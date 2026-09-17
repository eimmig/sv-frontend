import { expect, test } from '@playwright/test';

function catalogRoute(items: { id: string; name: string }[]) {
  return (route: import('@playwright/test').Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: items, page: 0, size: 100, totalElements: items.length, totalPages: 1 }),
    });
}

function emptyPage() {
  return (route: import('@playwright/test').Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [], page: 0, size: 100, totalElements: 0, totalPages: 0 }),
    });
}

test.describe('feat-025 - betting houses balance movement bridge', () => {
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
    await page.route('**/api/v1/sports*', catalogRoute([]));
    await page.route('**/api/v1/leagues*', catalogRoute([]));
    await page.route('**/api/v1/markets*', catalogRoute([]));
    await page.route('**/api/v1/tipsters*', catalogRoute([]));
    await page.route('**/api/v1/bets*', emptyPage());
  });

  test('clicking "move balance" opens History on the Movimentações tab with the house pre-selected', async ({ page }) => {
    await page.route('**/api/v1/betting-houses*', catalogRoute([{ id: 'bh-1', name: 'Bet365' }]));
    await page.route('**/api/v1/transactions*', emptyPage());

    await page.goto('/betting-houses');
    await page.getByTestId('betting-houses-move-balance').click();

    await expect(page).toHaveURL(/\/history\?bettingHouseId=bh-1/);
    await expect(page.getByTestId('history-create-transaction-betting-house')).toHaveValue('Bet365');
  });

  test('a deposit made from the bridge is reflected back on the betting houses list', async ({ page }) => {
    let balance = 100;
    await page.route('**/api/v1/betting-houses*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [{ id: 'bh-1', name: 'Bet365', initialBalance: 100, balance, createdAt: '2026-01-01' }],
          page: 0,
          size: 100,
          totalElements: 1,
          totalPages: 1,
        }),
      }),
    );
    await page.route('**/api/v1/transactions*', (route) => {
      if (route.request().method() === 'POST') {
        balance += 50;
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'tx-1',
            bettingHouseId: 'bh-1',
            type: 'deposit',
            amount: 50,
            createdAt: '2026-01-02T00:00:00Z',
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
    await expect(page.getByTestId('betting-houses-row')).toContainText(/R\$\s*100,00/);

    await page.getByTestId('betting-houses-move-balance').click();
    await page.getByTestId('history-create-transaction-type').click();
    // "Deposit" is the first <mat-option> in the template (history.html) - selecting by
    // position, not by translated label, per this suite's locator convention (docs/TESTING.md).
    await page.getByRole('option').first().click();
    await page.getByTestId('history-create-transaction-amount').fill('50');
    await page.getByTestId('history-create-transaction-submit').click();
    await expect(page.getByTestId('history-create-transaction-success')).toBeVisible();

    // In-app SPA navigation (sidebar link), not a full page reload - a reload would trivially
    // show fresh data regardless of whether Angular's router actually recreates the component.
    await page.getByTestId('nav-betting-houses-menu').click();
    await page.getByTestId('nav-betting-houses-register').click();
    await expect(page).toHaveURL(/\/betting-houses$/);
    await expect(page.getByTestId('betting-houses-row')).toContainText(/R\$\s*150,00/);
  });
});
