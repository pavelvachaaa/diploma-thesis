import { expect, test, type Page } from '@playwright/test';
import { closeDb, queryOne } from './support/db';
import { E2E_JOBS, FAKE_PDF, uniqueEmail } from './support/real-data';

async function fillPersonalInfo(page: Page, email: string) {
  await page.getByLabel('Jméno *').fill('Jan');
  await page.getByLabel('Příjmení *').fill('Novák');
  await page.getByLabel('Email *').fill(email);
  await page.getByLabel('Telefon *').fill('+420777123456');
}

async function fillEducation(page: Page) {
  await page.getByLabel('Nejvyšší dosažené vzdělání *').click();
  await page.getByRole('option', { name: 'Bakalářské' }).click();
  await page.getByLabel('Obor vzdělání *').fill('Ošetřovatelství');
  await page.getByLabel('Délka praxe v oboru *').click();
  await page.getByRole('option', { name: '1-3 roky' }).click();
}

async function fillAndSubmitApplication(page: Page, email: string, uploadCv: boolean) {
  await fillPersonalInfo(page, email);
  await fillEducation(page);

  if (uploadCv) {
    await page.locator('#cv-upload').setInputFiles(FAKE_PDF);
  }

  await page.locator('#terms').click();
  await page.getByRole('button', { name: 'Odeslat přihlášku' }).click();
}

test.afterAll(async () => {
  await closeDb();
});

test.describe('Job detail and application with real backend data', () => {
  test('opens a seeded job detail and navigates to the apply form', async ({ page }) => {
    await page.goto(`/kariera/jobs/${E2E_JOBS.cvRequired.id}`);

    await expect(page.getByRole('heading', { name: E2E_JOBS.cvRequired.title })).toBeVisible();
    await expect(page.getByText(E2E_JOBS.cvRequired.organization).first()).toBeVisible();
    await expect(page.getByText('Péče o pacienty a spolupráce v týmu')).toBeVisible();

    await page.getByRole('button', { name: 'Odpovědět' }).click();
    await expect(page).toHaveURL(new RegExp(`/jobs/${E2E_JOBS.cvRequired.id}/apply`));
    await expect(page.getByText(E2E_JOBS.cvRequired.title).first()).toBeVisible();
  });

  test('submits a CV-required application and persists applicant plus attachment', async ({ page }) => {
    const email = uniqueEmail('application.cv');
    await page.goto(`/kariera/jobs/${E2E_JOBS.cvRequired.id}/apply`);

    await fillAndSubmitApplication(page, email, true);

    await expect(page).toHaveURL(/\/apply\/success/);
    await expect(page.getByRole('heading', { name: 'Přihláška byla úspěšně odeslána!' })).toBeVisible();

    const applicant = await queryOne<{ id: string; title: string; attachment_count: string }>(
      `
        SELECT a.id, jp.title, COUNT(aa.id)::text AS attachment_count
        FROM applicants a
        JOIN job_postings jp ON jp.id = a.job_posting_id
        LEFT JOIN application_attachments aa ON aa.applicant_id = a.id
        WHERE a.email = $1
        GROUP BY a.id, jp.title
      `,
      [email]
    );

    expect(applicant?.title).toBe(E2E_JOBS.cvRequired.title);
    expect(Number(applicant?.attachment_count ?? 0)).toBeGreaterThanOrEqual(1);
  });

  test('submits a no-CV application without uploading a file', async ({ page }) => {
    const email = uniqueEmail('application.nocv');
    await page.goto(`/kariera/jobs/${E2E_JOBS.noCv.id}/apply`);

    await fillAndSubmitApplication(page, email, false);

    await expect(page).toHaveURL(/\/apply\/success/);
    await expect(page.getByText(E2E_JOBS.noCv.title).first()).toBeVisible();

    const applicant = await queryOne<{ title: string; attachment_count: string }>(
      `
        SELECT jp.title, COUNT(aa.id)::text AS attachment_count
        FROM applicants a
        JOIN job_postings jp ON jp.id = a.job_posting_id
        LEFT JOIN application_attachments aa ON aa.applicant_id = a.id
        WHERE a.email = $1
        GROUP BY jp.title
      `,
      [email]
    );

    expect(applicant?.title).toBe(E2E_JOBS.noCv.title);
    expect(Number(applicant?.attachment_count ?? 0)).toBe(0);
  });

  test('shows not-found state for a missing job', async ({ page }) => {
    await page.goto('/kariera/jobs/00000000-0000-4000-8000-000000000000');

    await expect(page.getByText('Pozice nebyla nalezena')).toBeVisible();
  });
});
