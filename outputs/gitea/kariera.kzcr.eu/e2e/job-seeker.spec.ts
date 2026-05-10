import { expect, test, type Page } from '@playwright/test';
import { closeDb, queryOne } from './support/db';
import { FAKE_PDF, JOB_SEEKER_URL, NURSE_CLASSIFICATION_LABEL, uniqueEmail } from './support/real-data';

async function fillPersonalInfo(page: Page, email: string) {
  await page.getByLabel('Jméno *').fill('Jana');
  await page.getByLabel('Příjmení *').fill('Horáčková');
  await page.getByLabel('Email *').fill(email);
  await page.getByLabel('Telefon *').fill('+420777000111');
}

test.afterAll(async () => {
  await closeDb();
});

test.describe('Job seeker profile form with real backend data', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(JOB_SEEKER_URL);
  });

  test('loads organizations and preferred positions from the real API', async ({ page }) => {
    await expect(page.getByLabel('Jméno *')).toBeVisible();
    await expect(page.getByText('Masarykova nemocnice v Ústí nad Labem')).toBeVisible();
    await expect(page.locator('#preferredPosition').getByRole('option', { name: NURSE_CLASSIFICATION_LABEL })).toBeAttached();
  });

  test('shows custom validation before submitting to the backend', async ({ page }) => {
    await fillPersonalInfo(page, uniqueEmail('jobseeker.validation'));
    await page.locator('#preferredPosition').selectOption(NURSE_CLASSIFICATION_LABEL);
    await page.locator('#cv-upload').setInputFiles(FAKE_PDF);
    await page.locator('#privacyNoticeAcknowledged').click();
    await page.locator('#terms').click();

    await page.getByRole('button', { name: 'Odeslat profil' }).click();
    await expect(page.getByText('Musíte vybrat alespoň jednu lokalitu')).toBeVisible();
  });

  test('allows selecting multiple preferred locations', async ({ page }) => {
    const email = uniqueEmail('jobseeker.multi');
    await fillPersonalInfo(page, email);
    
    // Select two locations
    await page.getByText('Masarykova nemocnice v Ústí nad Labem').click();
    await page.getByText('Nemocnice Chomutov').click();
    
    await page.locator('#preferredPosition').selectOption(NURSE_CLASSIFICATION_LABEL);
    await page.locator('#cv-upload').setInputFiles(FAKE_PDF);
    await page.locator('#privacyNoticeAcknowledged').click();
    await page.locator('#terms').click();

    await page.getByRole('button', { name: 'Odeslat profil' }).click();
    await expect(page.getByTestId('job-seeker-success')).toBeVisible();

    const result = await queryOne<{ location_count: string }>(
      'SELECT COUNT(*)::text as location_count FROM job_seeker_locations jsl JOIN job_seekers js ON js.id = jsl.job_seeker_id WHERE js.email = $1',
      [email]
    );
    expect(Number(result?.location_count)).toBe(2);
  });

  test('contains all expected job categories in the position dropdown', async ({ page }) => {
    // Wait for the options to load (remove the loading placeholder)
    await expect(page.locator('#preferredPosition')).not.toContainText('Načítání pozic...');
    
    const options = page.locator('#preferredPosition option');
    const labels = await options.allInnerTexts();
    
    const expectedCategories = [
      'Lékaři',
      'Sestry a záchranáři',
      'Ostatní zdravotnický personál',
      'Nezdravotnické profese',
      'Specialisté',
      'Vedoucí pozice',
      'Ostatní'
    ];

    for (const category of expectedCategories) {
      expect(labels).toContain(category);
    }
  });

  test('submits profile with CV and extra attachment, then persists all records', async ({ page }) => {
    const email = uniqueEmail('jobseeker');

    await fillPersonalInfo(page, email);
    await page.getByText('Masarykova nemocnice v Ústí nad Labem').click();
    await page.locator('#preferredPosition').selectOption(NURSE_CLASSIFICATION_LABEL);
    await page.getByLabel('Zpráva').fill('Zajímám se o práci v intenzivní péči.');
    await page.locator('#cv-upload').setInputFiles(FAKE_PDF);
    await page.locator('#attachments-upload').setInputFiles({
      name: 'certifikat-e2e.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 certificate'),
    });
    await page.locator('#privacyNoticeAcknowledged').click();
    await page.locator('#terms').click();

    await page.getByRole('button', { name: 'Odeslat profil' }).click();

    await expect(page.getByTestId('job-seeker-success')).toBeVisible();

    const seeker = await queryOne<{
      id: string;
      preferred_position_name: string;
      location_count: string;
      attachment_count: string;
      cv_original_filename: string;
    }>(
      `
        SELECT
          js.id,
          js.preferred_position_name,
          COUNT(DISTINCT jsl.organization_id)::text AS location_count,
          COUNT(DISTINCT jsa.id)::text AS attachment_count,
          cv.original_filename AS cv_original_filename
        FROM job_seekers js
        JOIN job_seeker_locations jsl ON jsl.job_seeker_id = js.id
        JOIN files cv ON cv.id = js.cv_file_id
        LEFT JOIN job_seeker_attachments jsa ON jsa.job_seeker_id = js.id
        WHERE js.email = $1
        GROUP BY js.id, cv.original_filename
      `,
      [email]
    );

    expect(seeker?.preferred_position_name).toBe(NURSE_CLASSIFICATION_LABEL);
    expect(Number(seeker?.location_count ?? 0)).toBe(1);
    expect(Number(seeker?.attachment_count ?? 0)).toBe(1);
    expect(seeker?.cv_original_filename).toBe('cv-e2e.pdf');
  });
});
