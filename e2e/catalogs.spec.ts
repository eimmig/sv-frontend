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

  test('creates a sport and sees it in the list, then switches to another catalog tab', async ({ page }) => {
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
    await page.route('**/api/v1/markets*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: [], page: 0, size: 100, totalElements: 0, totalPages: 0 }),
      }),
    );
    await page.route('**/api/v1/tipsters*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: [], page: 0, size: 100, totalElements: 0, totalPages: 0 }),
      }),
    );

    await page.goto('/catalogs');
    await page.getByTestId('catalog-manager-name').first().fill('Futebol');
    await page.getByTestId('catalog-manager-submit').first().click();

    await expect(page.getByTestId('catalog-manager-row').first()).toContainText('Futebol');

    // Chromium defaults to en-US locale in this suite (see docs/TESTING.md) - tab labels render
    // in English unless the language selector is switched first.
    await page.getByRole('tab', { name: 'Leagues' }).click();

    await expect(page.getByTestId('catalog-manager-row').first()).toContainText('Brasileirão');
  });
});
