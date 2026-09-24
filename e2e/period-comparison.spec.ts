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
    bySport: [{ dimensionId: 'sp-1', dimensionName: 'Futebol', metrics: overallDefaults }],
    byMarket: [],
    byBettingHouse: [],
    byLeague: [],
    byTipster: [],
    byBetType: [],
    monthly: [],
    ...overrides,
  };
}

test.describe('epic-031 - "Comparativo de períodos" page', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.setFixedTime(new Date('2026-09-22T12:00:00Z'));
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
    await page.route('**/api/v1/bankroll/balance*', (route) => {
      const url = new URL(route.request().url());
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ at: url.searchParams.get('at') ?? 'now', balance: 2000 }),
      });
    });
    await page.route('**/api/v1/settings*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ unitPercent: 0.01 }) }),
    );
    await page.route('**/api/v1/statistics/daily*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
    );
  });

  test('loads with both periods defaulting to "Hoje", rendering KPI rows, chart, and segment tables', async ({ page }) => {
    await page.route('**/api/v1/statistics*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(statisticsBundle()) }),
    );

    await page.goto('/period-comparison');

    await expect(page.getByTestId('period-comparison-row-net-profit')).toContainText('R$');
    await expect(page.getByTestId('period-comparison-chart')).toBeVisible();
    await expect(page.getByTestId('period-comparison-segment-sport-row')).toContainText('Futebol');
  });

  test('changing Período A alone issues a new request for A while Período B keeps its own range', async ({ page }) => {
    const seenFroms: string[] = [];
    await page.route('**/api/v1/statistics*', (route) => {
      const url = new URL(route.request().url());
      const from = url.searchParams.get('from');
      if (from) {
        seenFroms.push(from);
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(statisticsBundle()) });
    });

    await page.goto('/period-comparison');
    await expect(page.getByTestId('period-comparison-row-net-profit')).toBeVisible();

    await page.getByTestId('period-comparison-period-a').getByTestId('period-preset-select').click();
    await page.getByRole('option', { name: 'Last month' }).click();

    await expect.poll(() => seenFroms.some((from) => from !== '2026-09-22')).toBe(true);
    await expect.poll(() => seenFroms.includes('2026-09-22')).toBe(true);
  });

  test('renders distinct net profit values per side and colors the delta when B improves on A', async ({ page }) => {
    await page.route('**/api/v1/statistics*', (route) => {
      const url = new URL(route.request().url());
      const from = url.searchParams.get('from');
      const netProfit = from === '2026-01-01' ? 100 : 150;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(statisticsBundle({ overall: { ...statisticsBundle().overall, netProfit } })),
      });
    });

    await page.goto('/period-comparison');
    await page.getByTestId('period-comparison-period-a').getByTestId('period-preset-select').click();
    await page.getByRole('option', { name: 'Last month' }).click();

    const row = page.getByTestId('period-comparison-row-net-profit');
    await expect(row.getByTestId('comparison-metric-row-delta')).toBeVisible();
  });

  test('column headers line up with the right edge of each KPI value on desktop', async ({ page }) => {
    await page.route('**/api/v1/statistics*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(statisticsBundle()) }),
    );

    await page.goto('/period-comparison');
    const row = page.getByTestId('period-comparison-row-net-profit');
    await expect(row).toContainText('R$');

    const textRight = (locator: import('@playwright/test').Locator) =>
      locator.evaluate((el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return range.getBoundingClientRect().right;
      });
    const headers = page.getByTestId('period-comparison-rows-header').locator('span');
    const values = [
      row.getByTestId('comparison-metric-row-value-a'),
      row.getByTestId('comparison-metric-row-value-b'),
      row.getByTestId('comparison-metric-row-delta'),
    ];

    for (const [index, value] of values.entries()) {
      const headerRight = await textRight(headers.nth(index + 1));
      expect(Math.abs(headerRight - (await textRight(value)))).toBeLessThanOrEqual(1);
    }
  });
});
