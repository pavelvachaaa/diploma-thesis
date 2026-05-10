import { expect, test, type Page } from '@playwright/test';
import {
  E2E_ACTIVE_JOB_COUNT,
  E2E_JOBS,
  FIRST_PAGE_JOB_COUNT,
  JOBS_URL,
  NURSE_CLASSIFICATION_CODE,
  NURSE_CLASSIFICATION_LABEL,
  PART_TIME_LABEL,
} from './support/real-data';

async function selectComboboxOption(page: Page, index: number, optionName: string | RegExp) {
  await page.getByRole('combobox').nth(index).click();
  await page.getByRole('option', { name: optionName }).click();
}

test.describe('Job listing with real backend data', () => {
  test('renders seeded public jobs and excludes hidden jobs', async ({ page }) => {
    await page.goto(JOBS_URL);

    await expect(page.getByTestId('job-card')).toHaveCount(FIRST_PAGE_JOB_COUNT);
    await expect(page.getByText(`Zobrazeno ${FIRST_PAGE_JOB_COUNT} pozic`)).toBeVisible();
    await expect(page.getByText(E2E_JOBS.cvRequired.title)).toBeVisible();
    await expect(page.getByText(E2E_JOBS.hiddenArchived)).not.toBeVisible();
    await expect(page.getByText(E2E_JOBS.hiddenFuture)).not.toBeVisible();
  });

  test('load more appends the second page and then hides after exhaustion', async ({ page }) => {
    await page.goto(JOBS_URL);

    await expect(page.getByTestId('job-card')).toHaveCount(FIRST_PAGE_JOB_COUNT);
    const loadMore = page.getByRole('button', { name: 'Načíst více pozic' });

    await loadMore.click();
    await expect(page.getByTestId('job-card')).toHaveCount(E2E_ACTIVE_JOB_COUNT);
    await expect(page.getByText(E2E_JOBS.partTime.title)).toBeVisible();

    await loadMore.click();
    await expect(page.getByTestId('job-card')).toHaveCount(E2E_ACTIVE_JOB_COUNT);
    await expect(loadMore).not.toBeVisible();
  });

  test('searches by keyword through the real API and updates URL', async ({ page }) => {
    await page.goto(JOBS_URL);

    await page.getByPlaceholder('Název pozice, klíčová slova nebo společnost').fill('interna');
    await page.getByRole('button', { name: 'Hledat' }).click();

    await expect(page).toHaveURL(/q=interna/);
    await expect(page.getByText(E2E_JOBS.doctor.title)).toBeVisible();
    await expect(page.getByText(E2E_JOBS.cvRequired.title)).not.toBeVisible();
  });

  test('filters by classification chip', async ({ page }) => {
    await page.goto(JOBS_URL);

    await expect(page.getByText(NURSE_CLASSIFICATION_LABEL)).toBeVisible();
    await page.getByText(NURSE_CLASSIFICATION_LABEL).click();

    await expect(page).toHaveURL(new RegExp(`classification=${NURSE_CLASSIFICATION_CODE}`));
    await expect(page.getByText(E2E_JOBS.cvRequired.title)).toBeVisible();
    await expect(page.getByText(E2E_JOBS.doctor.title)).not.toBeVisible();
  });

  test('filters by location, role, contract type, and clears filters', async ({ page }) => {
    await page.goto(JOBS_URL);

    await selectComboboxOption(page, 0, /Masarykova nemocnice/);
    await expect(page).toHaveURL(/location=UL/);
    await expect(page.getByText(E2E_JOBS.cvRequired.title)).toBeVisible();

    await selectComboboxOption(page, 1, NURSE_CLASSIFICATION_LABEL);
    await expect(page).toHaveURL(/role=/);
    await expect(page.getByText(E2E_JOBS.cvRequired.title)).toBeVisible();
    await expect(page.getByText(E2E_JOBS.doctor.title)).not.toBeVisible();

    await page.getByRole('button', { name: 'Vymazat vše' }).click();
    await expect(page).not.toHaveURL(/role=|location=|classification=|contractType=/);

    await selectComboboxOption(page, 2, PART_TIME_LABEL);
    await expect(page).toHaveURL(/contractType=part_time/);
    await expect(page.getByText(E2E_JOBS.noCv.title)).toBeVisible();
    await expect(page.getByText(E2E_JOBS.partTime.title)).toBeVisible();
  });
});
