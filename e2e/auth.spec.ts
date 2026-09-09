import { expect, test } from '@playwright/test';

function mockLogin(page: import('@playwright/test').Page, response: unknown, status = 200) {
  return page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(response) }),
  );
}

function seedSession(
  page: import('@playwright/test').Page,
  role: 'ADMIN' | 'MEMBER',
  mustChangePassword = false,
) {
  return page.addInitScript(
    ({ role, mustChangePassword }) => {
      localStorage.setItem(
        'stakevault.auth',
        JSON.stringify({
          token: 'v4.local.test',
          userId: 'test-user',
          role,
          tenantSlug: 'acme',
          mustChangePassword,
        }),
      );
    },
    { role, mustChangePassword },
  );
}

test.describe('RF01/RF02 - authentication and tenant user management', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('successful login navigates to the dashboard and shows the nav', async ({ page }) => {
    await mockLogin(page, { token: 'v4.local.token', userId: 'u1', role: 'ADMIN', mustChangePassword: false });
    await page.goto('/login');

    await page.getByTestId('login-slug').fill('acme');
    await page.getByTestId('login-email').fill('ana@acme');
    await page.getByTestId('login-password').fill('secret');
    await page.getByTestId('login-submit').click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId('app-nav')).toBeVisible();
  });

  test('invalid credentials show the RFC 7807 detail and stay on the login page', async ({ page }) => {
    await mockLogin(
      page,
      {
        type: 'https://docs/errors/invalid-credentials',
        title: 'Credenciais invalidas',
        detail: 'E-mail ou senha incorretos.',
        status: 401,
      },
      401,
    );
    await page.goto('/login');

    await page.getByTestId('login-slug').fill('acme');
    await page.getByTestId('login-email').fill('ana@acme');
    await page.getByTestId('login-password').fill('wrong');
    await page.getByTestId('login-submit').click();

    await expect(page.getByTestId('login-error')).toHaveText('E-mail ou senha incorretos.');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('the login error message follows the active language', async ({ page }) => {
    await mockLogin(
      page,
      {
        type: 'https://docs/errors/invalid-credentials',
        title: 'Invalid credentials',
        detail: 'Incorrect email or password.',
        status: 401,
      },
      401,
    );
    await page.goto('/login');
    await page.getByTestId('language-selector').click();
    await page.getByRole('option', { name: 'English' }).click();

    await expect(page.getByTestId('login-submit')).toHaveText('Sign in');

    await page.getByTestId('login-slug').fill('acme');
    await page.getByTestId('login-email').fill('ana@acme');
    await page.getByTestId('login-password').fill('wrong');
    await page.getByTestId('login-submit').click();

    await expect(page.getByTestId('login-error')).toHaveText('Incorrect email or password.');
  });

  test('a protected route redirects to /login without a session', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/login$/);
  });

  test('an admin sees the "Usuários" link and can manage tenant users', async ({ page }) => {
    await seedSession(page, 'ADMIN');
    await page.route('**/api/v1/users', (route) => {
      if (route.request().method() !== 'GET') {
        return route.continue();
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: '1', name: 'Ana', email: 'ana@acme', role: 'ADMIN', mustChangePassword: false, createdAt: '2026-01-01' },
        ]),
      });
    });
    await page.goto('/dashboard');

    await expect(page.getByTestId('nav-users')).toBeVisible();
    await page.getByTestId('nav-users').click();

    await expect(page).toHaveURL(/\/users$/);
    await expect(page.getByTestId('users-row')).toContainText('Ana');
    await expect(page.getByTestId('users-avatar')).toHaveText('A');
    await expect(page.getByTestId('users-role-badge')).toHaveClass(/users__role--admin/);
  });

  test('a member does not see the "Usuários" link and is bounced from /users', async ({ page }) => {
    await seedSession(page, 'MEMBER');
    await page.goto('/dashboard');

    await expect(page.getByTestId('nav-users')).toHaveCount(0);

    await page.goto('/users');

    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('a non-blocking banner appears when mustChangePassword is true and can be dismissed', async ({ page }) => {
    await seedSession(page, 'ADMIN', true);
    await page.goto('/dashboard');

    const banner = page.getByTestId('must-change-password-banner');
    await expect(banner).toBeVisible();

    await page.getByTestId('must-change-password-dismiss').click();

    await expect(banner).toHaveCount(0);
  });
});
