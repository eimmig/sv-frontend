import { expect, test } from '@playwright/test';

test.describe('catalog management (sports/leagues/markets/tipsters)', () => {
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

  test('creates a sport in /sports, then navigates via the nav menu to leagues (real page navigation, not a tab switch)', async ({
    page,
  }) => {
    let sportCreated = false;
    await page.route('**/api/v1/sports*', (route) => {
      if (route.request().method() === 'POST') {
        sportCreated = true;
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: '1', name: 'Futebol' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: sportCreated ? [{ id: '1', name: 'Futebol' }] : [],
          page: 0,
          size: 100,
          totalElements: sportCreated ? 1 : 0,
          totalPages: sportCreated ? 1 : 0,
        }),
      });
    });
    await page.route('**/api/v1/leagues*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [{ id: '2', name: 'Brasileirão' }],
          page: 0,
          size: 100,
          totalElements: 1,
          totalPages: 1,
        }),
      }),
    );

    await page.goto('/sports');
    await page.getByTestId('catalog-manager-name').fill('Futebol');
    await page.getByTestId('catalog-manager-submit').click();
    await expect(page.getByTestId('catalog-manager-row').first()).toContainText('Futebol');

    await page.getByTestId('nav-leagues-menu').click();
    await page.getByTestId('nav-leagues-register').click();

    await expect(page).toHaveURL(/\/leagues$/);
    await expect(page.getByTestId('catalog-manager-row').first()).toContainText('Brasileirão');
  });

  test('shows the RFC 7807 detail when creating a market fails', async ({ page }) => {
    await page.route('**/api/v1/markets*', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Já existe um mercado com esse nome.' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: [], page: 0, size: 100, totalElements: 0, totalPages: 0 }),
      });
    });

    await page.goto('/markets');
    await page.getByTestId('catalog-manager-name').fill('Handicap');
    await page.getByTestId('catalog-manager-submit').click();

    await expect(page.getByTestId('catalog-manager-form-error')).toContainText('Já existe um mercado com esse nome.');
  });
});
