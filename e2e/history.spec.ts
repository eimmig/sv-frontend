import { expect, test } from '@playwright/test';

function catalogRoute(items: { id: string; name: string }[]) {
  return (route: import('@playwright/test').Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: items, page: 0, size: 100, totalElements: items.length, totalPages: 1 }),
    });
}

test.describe('RF08 - operations history', () => {
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
    await page.route('**/api/v1/betting-houses*', catalogRoute([{ id: 'bh-1', name: 'Bet365' }]));
    await page.route('**/api/v1/sports*', catalogRoute([{ id: 'sp-1', name: 'Futebol' }]));
    await page.route('**/api/v1/leagues*', catalogRoute([{ id: 'lg-1', name: 'Brasileirão' }]));
    await page.route('**/api/v1/markets*', catalogRoute([{ id: 'mk-1', name: 'Handicap' }]));
    await page.route('**/api/v1/tipsters*', catalogRoute([{ id: 'tp-1', name: 'Ana' }]));
  });

  test('filters bets by betting house and resolves names instead of raw IDs', async ({ page }) => {
    let lastBettingHouseFilter: string | null = null;
    await page.route('**/api/v1/bets*', (route) => {
      const url = new URL(route.request().url());
      lastBettingHouseFilter = url.searchParams.get('bettingHouseId');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [
            {
              id: '1',
              bettingHouseId: 'bh-1',
              sportId: 'sp-1',
              leagueId: 'lg-1',
              marketId: 'mk-1',
              tipsterId: null,
              stake: 100,
              odd: 1.85,
              status: 'won',
              betDate: '2026-03-01T18:00:00Z',
            },
          ],
          page: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
        }),
      });
    });
    await page.route('**/api/v1/transactions*', catalogRouteEmpty());

    await page.goto('/history');
    await page.getByTestId('history-bets-filter-betting-house').click();
    await page.getByRole('option', { name: 'Bet365' }).click();
    await page.getByTestId('history-bets-filter-submit').click();

    expect(lastBettingHouseFilter).toBe('bh-1');
    await expect(page.getByTestId('history-bets-row')).toContainText('Bet365');
    await expect(page.getByTestId('history-bets-row')).not.toContainText('bh-1');
  });

  test('switches to the transactions tab and paginates', async ({ page }) => {
    await page.route('**/api/v1/bets*', catalogRouteEmpty());
    await page.route('**/api/v1/transactions*', (route) => {
      const url = new URL(route.request().url());
      const requestedPage = url.searchParams.get('page');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [
            {
              id: '1',
              bettingHouseId: 'bh-1',
              type: 'deposit',
              amount: 500,
              createdAt: '2026-02-01T10:00:00Z',
            },
          ],
          page: requestedPage === '1' ? 1 : 0,
          size: 20,
          totalElements: 21,
          totalPages: 2,
        }),
      });
    });

    await page.goto('/history');
    await page.getByRole('tab', { name: 'Transactions' }).click();

    await expect(page.getByTestId('history-transactions-row')).toContainText('Bet365');
    await expect(page.getByTestId('history-transactions-page-indicator')).toHaveText('Page 1 of 2');

    await page.getByTestId('history-transactions-next-page').click();

    await expect(page.getByTestId('history-transactions-page-indicator')).toHaveText('Page 2 of 2');
  });
});

function catalogRouteEmpty() {
  return (route: import('@playwright/test').Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }),
    });
}
