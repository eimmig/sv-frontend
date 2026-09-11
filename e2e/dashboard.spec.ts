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
  const overallDefaults = {
    totalStaked: 1000,
    netProfit: 150,
    roi: 0.15,
    winRate: 0.6,
    settledCount: 10,
    wonCount: 6,
    lostCount: 4,
    voidCount: 0,
    preCount: 8,
    liveCount: 2,
    avgOdd: 1.9,
  };
  return {
    overall: overallDefaults,
    bySport: [
      {
        dimensionId: 'sp-1',
        dimensionName: 'Futebol',
        metrics: { totalStaked: 1000, netProfit: 150, roi: 0.15, winRate: 0.6, settledCount: 10 },
      },
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
    // feat-014: applyFilter()'s forkJoin now also calls bankroll balance (x3: at=from, at=to,
    // and no at for "now") and settings - unmocked, these would hang the suite waiting on a
    // real network call (no backend runs under Playwright).
    await page.route('**/api/v1/bankroll/balance*', (route) => {
      const url = new URL(route.request().url());
      const at = url.searchParams.get('at') ?? 'now';
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ at, balance: 2000 }) });
    });
    await page.route('**/api/v1/settings*', (route) => {
      if (route.request().method() === 'PATCH') {
        const body = route.request().postDataJSON() as { unitPercent: number };
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ unitPercent: 0.01 }) });
    });
  });

  test('loads overall metrics and a sport breakdown row, defaulting to the "Hoje" period', async ({ page }) => {
    await page.route('**/api/v1/statistics*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(statisticsBundle()) }),
    );

    await page.goto('/dashboard');

    await expect(page.getByTestId('dashboard-total-staked')).toContainText('R$');
    await expect(page.getByTestId('dashboard-roi')).toContainText('%');
    await expect(page.getByTestId('dashboard-by-sport-row')).toContainText('Futebol');
    // totalStaked=1000, bankrollNow=2000 (mocked), unitPercent=0.01 (mocked) -> 1000/(2000*0.01)=50
    await expect(page.getByTestId('dashboard-units-staked')).toContainText('50.00');
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

  // feat-014: changing the period preset auto-applies (unlike the 5 catalog selects, which
  // still require the "Aplicar filtro" button) - reloads the bundle with a different from/to.
  test('changing the period preset issues a new statistics request with a different date range', async ({ page }) => {
    const seenRanges: { from: string | null; to: string | null }[] = [];
    await page.route('**/api/v1/statistics*', (route) => {
      const url = new URL(route.request().url());
      seenRanges.push({ from: url.searchParams.get('from'), to: url.searchParams.get('to') });
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(statisticsBundle()) });
    });

    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-total-staked')).toContainText('R$');
    await expect.poll(() => seenRanges.length).toBeGreaterThan(0);
    const initialRange = seenRanges.at(-1)!;

    await page.getByTestId('period-preset-select').click();
    await page.getByRole('option', { name: 'Last month' }).click();

    await expect.poll(() => seenRanges.at(-1)?.from).not.toBe(initialRange.from);
  });

  test('does not show the unit config field for a member session', async ({ page }) => {
    await page.route('**/api/v1/statistics*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(statisticsBundle()) }),
    );

    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-total-staked')).toContainText('R$');

    await expect(page.getByTestId('dashboard-unit-percent-form')).toHaveCount(0);
  });

  test('admin can view and update the unit config field', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'stakevault.auth',
        JSON.stringify({
          token: 'v4.local.test',
          userId: 'admin-user',
          role: 'ADMIN',
          tenantSlug: 'acme',
          mustChangePassword: false,
        }),
      );
    });
    await page.route('**/api/v1/statistics*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(statisticsBundle()) }),
    );

    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-unit-percent-input')).toHaveValue('1');

    await page.getByTestId('dashboard-unit-percent-input').fill('2');
    await page.getByTestId('dashboard-unit-percent-save').click();

    await expect(page.getByTestId('dashboard-unit-percent-success')).toBeVisible();
  });
});
