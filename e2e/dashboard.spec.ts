import { expect, test } from '@playwright/test';

function catalogRoute(items: { id: string; name: string }[]) {
  return (route: import('@playwright/test').Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: items, page: 0, size: 100, totalElements: items.length, totalPages: 1 }),
    });
}

function statisticsBundle(overrides: Record<string, unknown> = {}) {
  return {
    overall: { totalStaked: 1000, netProfit: 150, roi: 0.15, winRate: 0.6, settledCount: 10 },
    bySport: [
      { dimensionId: 'sp-1', dimensionName: 'Futebol', metrics: { totalStaked: 1000, netProfit: 150, roi: 0.15, winRate: 0.6, settledCount: 10 } },
    ],
    byMarket: [],
    byBettingHouse: [],
    monthly: [{ year: 2026, month: 1, metrics: { totalStaked: 1000, netProfit: 150, roi: 0.15, winRate: 0.6, settledCount: 10 } }],
    ...overrides,
  };
}

test.describe('RF10/RF11 - dashboards and dynamic filters', () => {
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

  test('loads overall metrics and a sport breakdown row', async ({ page }) => {
    await page.route('**/api/v1/statistics*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(statisticsBundle()) }),
    );

    await page.goto('/dashboard');

    await expect(page.getByTestId('dashboard-total-staked')).toContainText('R$');
    await expect(page.getByTestId('dashboard-roi')).toContainText('%');
    await expect(page.getByTestId('dashboard-by-sport-row')).toContainText('Futebol');
  });

  test('applying a filter issues a new statistics request with the chosen betting house', async ({ page }) => {
    let lastBettingHouseFilter: string | null = null;
    await page.route('**/api/v1/statistics*', (route) => {
      const url = new URL(route.request().url());
      lastBettingHouseFilter = url.searchParams.get('bettingHouseId');
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(statisticsBundle()) });
    });

    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-total-staked')).toContainText('R$');

    await page.getByTestId('dashboard-filter-betting-house').click();
    await page.getByRole('option', { name: 'Bet365' }).click();
    await page.getByTestId('dashboard-filter-apply').click();

    await expect.poll(() => lastBettingHouseFilter).toBe('bh-1');
  });

  test('switches to the market breakdown tab', async ({ page }) => {
    await page.route('**/api/v1/statistics*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          statisticsBundle({
            byMarket: [
              { dimensionId: 'mk-1', dimensionName: 'Handicap', metrics: { totalStaked: 500, netProfit: 50, roi: 0.1, winRate: 0.5, settledCount: 5 } },
            ],
          }),
        ),
      }),
    );

    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-total-staked')).toContainText('R$');

    // Chromium defaults to en-US locale in this suite (see docs/TESTING.md) - tab labels render
    // in English unless the language selector is switched first.
    await page.getByRole('tab', { name: 'By market' }).click();

    await expect(page.getByTestId('dashboard-by-market-row')).toContainText('Handicap');
  });
});
