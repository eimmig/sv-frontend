import { expect, test } from '@playwright/test';

test.describe('Expired session', () => {
  test('an expired token sends the user straight to the login, without waiting for the logo sequence', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('stakevault.language', 'pt-BR');
      localStorage.setItem(
        'stakevault.auth',
        JSON.stringify({
          token: 'v4.local.expired',
          userId: 'test-user',
          role: 'MEMBER',
          tenantSlug: 'acme',
          mustChangePassword: false,
        }),
      );
    });
    await page.route('**/api/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.fulfill({
        status: 401,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'https://docs/errors/invalid-token',
          title: 'Token inválido',
          status: 401,
          detail: 'O token de acesso é inválido ou expirou.',
        }),
      });
    });

    await page.goto('/overview');
    await expect(page.getByTestId('loading-overlay')).toBeVisible();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-session-expired')).toHaveText('Sua sessão expirou. Entre novamente.');
    await expect(page.getByTestId('loading-overlay')).toBeHidden({ timeout: 500 });
    expect(await page.evaluate(() => localStorage.getItem('stakevault.auth'))).toBeNull();
  });
});
