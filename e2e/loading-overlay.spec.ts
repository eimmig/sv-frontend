import { expect, test } from '@playwright/test';

test.describe('feat-044 - loading overlay', () => {
  test('the login screen opens with no loading animation', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByTestId('login-submit')).toBeVisible();
    await expect(page.getByTestId('loading-overlay')).toHaveCount(0);
  });

  test('a slow backend call shows the logo overlay until it finishes, then the app is usable again', async ({
    page,
  }) => {
    await page.route('**/api/v1/auth/login', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'https://docs/errors/invalid-credentials',
          title: 'Credenciais invalidas',
          detail: 'E-mail ou senha incorretos.',
          status: 401,
        }),
      });
    });
    await page.goto('/login');

    await page.getByTestId('login-slug').fill('acme');
    await page.getByTestId('login-email').fill('ana@acme');
    await page.getByTestId('login-password').fill('secret');
    await page.getByTestId('login-submit').click();

    const overlay = page.getByTestId('loading-overlay');
    await expect(overlay).toBeVisible();
    await expect(page.getByRole('status')).toBeVisible();

    await expect(overlay).toHaveCount(0, { timeout: 5_000 });
    await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible();
    await page.getByTestId('login-password').fill('another');
    await expect(page.getByTestId('login-password')).toHaveValue('another');
  });
});
