import { expect, test } from '@playwright/test';

test.describe('feat-023 - login floating controls do not overlap the form', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('language selector and theme toggle never overlap the login card, even on a short viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 400 });
    await page.goto('/login');

    const languageSelector = page.getByTestId('language-selector');
    const themeToggle = page.getByTestId('theme-toggle');
    const submit = page.getByTestId('login-submit');

    await expect(languageSelector).toBeVisible();
    await expect(themeToggle).toBeVisible();

    const [selectorBox, themeBox] = await Promise.all([languageSelector.boundingBox(), themeToggle.boundingBox()]);
    expect(selectorBox).not.toBeNull();
    expect(themeBox).not.toBeNull();
    expect(selectorBox!.x + selectorBox!.width).toBeLessThanOrEqual(themeBox!.x);

    await submit.scrollIntoViewIfNeeded();
    await expect(submit).toBeInViewport();

    const submitBox = (await submit.boundingBox())!;
    const selectorBoxAfterScroll = (await languageSelector.boundingBox())!;
    const overlaps =
      submitBox.y < selectorBoxAfterScroll.y + selectorBoxAfterScroll.height &&
      submitBox.y + submitBox.height > selectorBoxAfterScroll.y &&
      submitBox.x < selectorBoxAfterScroll.x + selectorBoxAfterScroll.width &&
      submitBox.x + submitBox.width > selectorBoxAfterScroll.x;
    expect(overlaps).toBe(false);
  });

  test('the language selector icon is fully visible and clickable on a realistic mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');

    const languageSelector = page.getByTestId('language-selector');
    await expect(languageSelector).toBeVisible();
    await expect(languageSelector).toBeInViewport();

    await languageSelector.click();
    await expect(page.getByRole('option', { name: 'English' })).toBeVisible();
  });
});

test.describe('feat-023.2 - login floating controls across locales and themes', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 667 });
  });

  const OPTION_NAME: Record<string, string> = { 'pt-BR': 'Português', 'en-US': 'English', es: 'Español' };

  for (const locale of ['pt-BR', 'en-US', 'es'] as const) {
    for (const colorScheme of ['light', 'dark'] as const) {
      test(`icon stays fully visible, no overlap - ${locale}/${colorScheme}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme });
        await page.goto('/login');

        if (locale !== 'pt-BR') {
          await page.getByTestId('language-selector').click();
          await page.getByRole('option', { name: OPTION_NAME[locale] }).click();
        }

        const languageSelector = page.getByTestId('language-selector');
        const themeToggle = page.getByTestId('theme-toggle');
        const icon = page.locator('.language-selector-host mat-icon');

        await expect(languageSelector).toBeInViewport();
        await expect(themeToggle).toBeInViewport();
        await expect(icon).toBeInViewport();

        const [selectorBox, themeBox] = await Promise.all([languageSelector.boundingBox(), themeToggle.boundingBox()]);
        expect(selectorBox!.x + selectorBox!.width).toBeLessThanOrEqual(themeBox!.x);
      });
    }
  }

  test('language selector and theme toggle are reachable and operable by keyboard', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('stakevault.language', 'pt-BR'));
    await page.goto('/login');
    await expect(page.getByTestId('login-submit')).toHaveText('Entrar');

    let reached = false;
    for (let i = 0; i < 15 && !reached; i++) {
      await page.keyboard.press('Tab');
      reached = await page.getByTestId('language-selector').evaluate((el) => el === document.activeElement);
    }
    expect(reached).toBe(true);

    const selector = page.getByTestId('language-selector');
    const activeOption = async (name: string) =>
      expect(selector).toHaveAttribute('aria-activedescendant', (await page.getByRole('option', { name }).getAttribute('id'))!);
    await page.keyboard.press('Enter');
    await activeOption('Português');
    await page.keyboard.press('ArrowDown');
    await activeOption('English');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('login-submit')).toHaveText('Sign in');

    await page.keyboard.press('Tab');
    await expect(page.getByTestId('theme-toggle')).toBeFocused();
  });
});
