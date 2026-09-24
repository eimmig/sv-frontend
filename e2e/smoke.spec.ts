import { expect, test } from '@playwright/test';

test.describe('smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('boots and redirects to /login', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('loading-overlay')).toHaveCount(0);
    await expect(page).toHaveTitle(/Arka/);
  });

  test('switching the language re-renders UI text end to end', async ({ page }) => {
    await page.goto('/');
    const themeToggle = page.getByTestId('theme-toggle');
    const languageSelector = page.getByTestId('language-selector');

    await languageSelector.click();
    await page.getByRole('option', { name: 'Português' }).click();
    await expect(themeToggle).toHaveAttribute('aria-label', /modo (claro|escuro)/i);

    await languageSelector.click();
    await page.getByRole('option', { name: 'English' }).click();

    await expect(themeToggle).toHaveAttribute('aria-label', /(light|dark) mode/i);
  });

  test('the language panel does not clip a longer locale label after a shorter one was selected', async ({ page }) => {
    await page.goto('/');
    const languageSelector = page.getByTestId('language-selector');

    await languageSelector.click();
    await page.getByRole('option', { name: 'English' }).click();

    await languageSelector.click();
    const option = page.getByRole('option', { name: 'Português' });
    await expect(option).toBeVisible();
    const overflow = await option.evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
