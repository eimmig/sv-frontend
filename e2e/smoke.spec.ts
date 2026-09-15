import { expect, test } from '@playwright/test';

test.describe('smoke', () => {
  test.beforeEach(async ({ page }) => {
    // Skips the ~5.4s splash intro (docs/DESIGN-SYSTEM.md item 17) so the suite stays fast -
    // prefers-reduced-motion must be set before navigation, since Splash reads it in ngOnInit.
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('boots and redirects to /login', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator('app-splash')).toHaveCount(0);
  });

  test('switching the language re-renders UI text end to end', async ({ page }) => {
    await page.goto('/');
    const themeToggle = page.getByTestId('theme-toggle');
    const languageSelector = page.getByTestId('language-selector');

    // Pins a known starting language instead of assuming the browser's default locale -
    // Chromium defaults to en-US, which would make this test pass by accident.
    await languageSelector.click();
    await page.getByRole('option', { name: 'Português' }).click();
    await expect(themeToggle).toHaveAttribute('aria-label', /modo (claro|escuro)/i);

    await languageSelector.click();
    await page.getByRole('option', { name: 'English' }).click();

    await expect(themeToggle).toHaveAttribute('aria-label', /(light|dark) mode/i);
  });

  // Real bug (feat-018.2): MatSelect's overlay panel matched the trigger's width, which shrinks
  // to fit whichever locale is currently selected - once "English" (short) was active, the
  // panel reopened too narrow and clipped "Português" (longer). Fixed with a min-width on the
  // trigger; this proves the option's full text stays visible regardless of which locale opened
  // the panel.
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
