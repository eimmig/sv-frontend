import { expect, test } from '@playwright/test';

test.describe('RF03 - betting houses', () => {
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

  test('creates a betting house and sees it in the list', async ({ page }) => {
    let created = false;
    await page.route('**/api/v1/betting-houses*', (route) => {
      if (route.request().method() === 'POST') {
        created = true;
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: '1', name: 'Bet365', initialBalance: 100, balance: 100, createdAt: '2026-01-01' }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: created
            ? [{ id: '1', name: 'Bet365', initialBalance: 100, balance: 100, createdAt: '2026-01-01' }]
            : [],
          page: 0,
          size: 100,
          totalElements: created ? 1 : 0,
          totalPages: created ? 1 : 0,
        }),
      });
    });

    await page.goto('/betting-houses');
    await page.getByTestId('betting-houses-name').fill('Bet365');
    await page.getByTestId('betting-houses-initial-balance').fill('100');
    await page.getByTestId('betting-houses-submit').click();

    await expect(page.getByTestId('betting-houses-row')).toContainText('Bet365');
    await expect(page.getByTestId('betting-houses-row')).toContainText('R$');
  });

  test('shows the RFC 7807 detail for a duplicate name', async ({ page }) => {
    await page.route('**/api/v1/betting-houses*', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 409,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'https://docs/errors/betting-house-already-registered',
            title: 'Betting house already registered',
            detail: 'Já existe uma casa de apostas com esse nome.',
            status: 409,
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: [], page: 0, size: 100, totalElements: 0, totalPages: 0 }),
      });
    });

    await page.goto('/betting-houses');
    await page.getByTestId('betting-houses-name').fill('Bet365');
    await page.getByTestId('betting-houses-initial-balance').fill('100');
    await page.getByTestId('betting-houses-submit').click();

    await expect(page.getByTestId('betting-houses-form-error')).toHaveText(
      'Já existe uma casa de apostas com esse nome.',
    );
  });
});
