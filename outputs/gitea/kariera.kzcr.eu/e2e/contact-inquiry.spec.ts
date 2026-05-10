import { expect, test } from '@playwright/test';
import { closeDb, queryOne } from './support/db';
import { CONTACT_URL, uniqueEmail } from './support/real-data';

test.afterAll(async () => {
  await closeDb();
});

test.describe('Contact inquiry form with real backend data', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CONTACT_URL);
  });

  test('renders the public contact form', async ({ page }) => {
    await expect(page.getByLabel('Jméno a příjmení *')).toBeVisible();
    await expect(page.getByLabel('Email *')).toBeVisible();
    await expect(page.getByLabel('Jak vám můžeme pomoci? *')).toBeVisible();
    await expect(page.getByLabel('Potvrzuji, že jsem se seznámil/a s informacemi o zpracování osobních údajů. *')).toBeVisible();
  });

  test('shows client validation for whitespace message and missing GDPR', async ({ page }) => {
    await page.getByLabel('Jméno a příjmení *').fill('Jan Novák');
    await page.getByLabel('Email *').fill(uniqueEmail('contact.validation'));
    await page.getByLabel('Jak vám můžeme pomoci? *').fill('   ');
    await page.getByLabel('Potvrzuji, že jsem se seznámil/a s informacemi o zpracování osobních údajů. *').click();
    await page.getByRole('button', { name: 'Odeslat dotaz' }).click();
    await expect(page.getByText('Vyplňte prosím zprávu')).toBeVisible();

    await page.getByLabel('Jak vám můžeme pomoci? *').fill('Dotaz k náboru.');
    await page.getByLabel('Potvrzuji, že jsem se seznámil/a s informacemi o zpracování osobních údajů. *').click();
    await page.evaluate(() => {
      document.querySelector('form')?.setAttribute('novalidate', '');
    });
    await page.getByRole('button', { name: 'Odeslat dotaz' }).click();
    await expect(page.getByText('Potvrďte prosím seznámení s informacemi o zpracování osobních údajů')).toBeVisible();
  });

  test('submits successfully without phone and persists the inquiry', async ({ page }) => {
    const email = uniqueEmail('contact');

    await page.getByLabel('Jméno a příjmení *').fill('Jana Krátká');
    await page.getByLabel('Email *').fill(email);
    await page.getByLabel('Jak vám můžeme pomoci? *').fill('Mám dotaz k volným pozicím.');
    await page.getByLabel('Potvrzuji, že jsem se seznámil/a s informacemi o zpracování osobních údajů. *').click();
    await page.getByRole('button', { name: 'Odeslat dotaz' }).click();

    await expect(page.getByTestId('inquiry-success')).toBeVisible();

    const inquiry = await queryOne<{ email: string; phone: string | null; message: string }>(
      'SELECT email, phone, message FROM contact_inquiries WHERE email = $1',
      [email]
    );

    expect(inquiry?.email).toBe(email);
    expect(inquiry?.phone).toBeNull();
    expect(inquiry?.message).toBe('Mám dotaz k volným pozicím.');
  });
});
