import { expect, test } from '@playwright/test';

test.describe('app-side-nav collapsed state', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      localStorage.setItem(
        'stakevault.auth',
        JSON.stringify({
          token: 'v4.local.test',
          userId: 'test-user',
          role: 'MEMBER',
          tenantSlug: 'acme',
          mustChangePassword: false,
        }),
      );
    });
    // Only the shell (side-nav) is under test here - stub every API call generically so the
    // dashboard page underneath doesn't error out while loading its own data.
    await page.route('**/api/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
    );
  });

  test('language selector stays reachable and switches locale in the collapsed sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByTestId('nav-collapse-toggle').click();

    const trigger = page.getByTestId('language-selector-collapsed');
    const themeToggle = page.getByTestId('theme-toggle');
    await expect(trigger).toBeVisible();
    await expect(page.getByTestId('language-selector')).toHaveCount(0);

    await trigger.click();
    await page.getByTestId('language-option-en-US').click();
    await expect(themeToggle).toHaveAttribute('aria-label', /(light|dark) mode/i);

    await trigger.click();
    await page.getByTestId('language-option-es').click();
    await expect(themeToggle).toHaveAttribute('aria-label', /modo (claro|oscuro)/i);

    await trigger.click();
    await page.getByTestId('language-option-pt-BR').click();
    await expect(themeToggle).toHaveAttribute('aria-label', /modo (claro|escuro)/i);
  });

  test('collapsed language menu does not overlap the theme toggle or logout controls', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByTestId('nav-collapse-toggle').click();

    await page.getByTestId('language-selector-collapsed').click();
    const menu = page.locator('.mat-mdc-menu-panel');
    await expect(menu).toBeVisible();

    const menuBox = await menu.boundingBox();
    const themeBox = await page.getByTestId('theme-toggle').boundingBox();
    const logoutBox = await page.getByTestId('nav-logout').boundingBox();
    expect(menuBox).not.toBeNull();
    expect(themeBox).not.toBeNull();
    expect(logoutBox).not.toBeNull();
    // The menu is a CDK overlay anchored to the trigger - it must not visually sit on top of the
    // two controls immediately below the language trigger in the footer.
    expect(menuBox!.y + menuBox!.height).toBeLessThanOrEqual(themeBox!.y + 1);
    expect(themeBox!.y + themeBox!.height).toBeLessThanOrEqual(logoutBox!.y + 1);
  });
});
