import { expect, test } from '@playwright/test';

test.describe('feat-035 - "Change password" page', () => {
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
  });

  test('changes the password and shows a confirmation', async ({ page }) => {
    await page.route('**/api/v1/auth/change-password', (route) =>
      route.fulfill({ status: 204 }),
    );

    await page.goto('/change-password');
    await page.getByTestId('change-password-current').fill('old-pass');
    await page.getByTestId('change-password-new').fill('new-pass');
    await page.getByTestId('change-password-confirm').fill('new-pass');
    await page.getByTestId('change-password-submit').click();

    await expect(page.getByTestId('change-password-success')).toBeVisible();
    await expect(page.getByTestId('change-password-current')).toHaveValue('');
  });

  test('shows the RFC 7807 detail when the current password is wrong, in Spanish', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('stakevault.language', 'es');
    });
    await page.route('**/api/v1/auth/change-password', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'La contraseña actual proporcionada no coincide.' }),
      }),
    );

    await page.goto('/change-password');
    await expect(page.getByTestId('change-password-submit')).toHaveText('Cambiar contraseña');
    await page.getByTestId('change-password-current').fill('wrong-pass');
    await page.getByTestId('change-password-new').fill('new-pass');
    await page.getByTestId('change-password-confirm').fill('new-pass');
    await page.getByTestId('change-password-submit').click();

    await expect(page.getByTestId('change-password-error')).toContainText('no coincide');
  });

  test('side nav and the mustChangePassword banner both link to the page', async ({ page }) => {
    // Only the shell/banner is under test here - stub every API call generically so the
    // dashboard page underneath doesn't error out while loading its own data (same pattern as
    // e2e/side-nav.spec.ts / e2e/telegram-link.spec.ts).
    await page.route('**/api/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
    );
    await page.route('**/api/v1/statistics/daily*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    await page.route('**/api/v1/statistics*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          overall: {
            totalStaked: 0,
            netProfit: 0,
            roi: 0,
            winRate: 0,
            settledCount: 0,
            wonCount: 0,
            lostCount: 0,
            voidCount: 0,
            preCount: 0,
            liveCount: 0,
            avgOdd: null,
          },
          bySport: [],
          byMarket: [],
          byBettingHouse: [],
          byLeague: [],
          byTipster: [],
          byBetType: [],
          monthly: [],
        }),
      }),
    );

    await page.goto('/dashboard');
    await page.getByTestId('nav-settings-menu').click();
    await page.getByTestId('nav-change-password').click();
    await expect(page).toHaveURL(/\/change-password$/);

    await page.addInitScript(() => {
      localStorage.setItem(
        'stakevault.auth',
        JSON.stringify({
          token: 'v4.local.test',
          userId: 'test-user',
          role: 'MEMBER',
          tenantSlug: 'acme',
          mustChangePassword: true,
        }),
      );
    });
    await page.goto('/dashboard');
    await page.getByTestId('must-change-password-action').click();
    await expect(page).toHaveURL(/\/change-password$/);
  });
});
