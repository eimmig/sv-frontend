import { expect, test } from '@playwright/test';

const OVERALL = {
  totalStaked: 5000,
  netProfit: 264.2,
  roi: 0.0528,
  winRate: 0.37,
  settledCount: 200,
  wonCount: 74,
  lostCount: 126,
  voidCount: 0,
  preCount: 150,
  liveCount: 50,
  avgOdd: 3.22,
};

function statisticsBundle(overrides: Record<string, unknown> = {}) {
  return { overall: { ...OVERALL, ...overrides }, bySport: [], byMarket: [], byBettingHouse: [], monthly: [] };
}

test.describe('epic-017 - "Relatório do período" page', () => {
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
    // "**/api/v1/statistics*" (single trailing star) does NOT match "/api/v1/statistics/daily" -
    // Playwright's "*" glob excludes "/", only "**" crosses path segments (real gotcha hit while
    // QA-testing this feature, see feat-015.4 evidence). One route branches on the sub-path.
    await page.route('**/api/v1/statistics**', (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/daily')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{ date: '2026-09-11', totalStaked: 500, netProfit: 184.2, roi: 0.368, betCount: 12 }]),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(statisticsBundle()) });
    });
    await page.route('**/api/v1/bankroll/balance*', (route) => {
      const url = new URL(route.request().url());
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ at: url.searchParams.get('at') ?? 'now', balance: 1195.05 }),
      });
    });
    await page.route('**/api/v1/settings*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ unitPercent: 0.01 }) }),
    );
  });

  test('loads with the "Hoje" default period and renders the summary cards + daily table', async ({ page }) => {
    await page.goto('/period-report');

    // 264.20 / 1195.05 ≈ 22.11% (docs/STATISTICS.md reference value).
    await expect(page.getByTestId('period-report-roi-bankroll')).toContainText('22');
    await expect(page.getByTestId('period-report-daily-row')).toContainText('2026-09-11');
  });

  test('changing the period issues a new set of requests with the new date range', async ({ page }) => {
    let lastFrom: string | null = null;
    await page.route('**/api/v1/statistics**', (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/daily')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
      lastFrom = url.searchParams.get('from');
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(statisticsBundle()) });
    });

    await page.goto('/period-report');
    await expect(page.getByTestId('period-report-roi-bankroll')).toBeVisible();
    const initialFrom = lastFrom;

    await page.getByTestId('period-preset-select').click();
    await page.getByRole('option', { name: 'Last month' }).click();

    await expect.poll(() => lastFrom).not.toBe(initialFrom);
  });

  test('shows the RFC 7807 detail when the statistics request fails', async ({ page }) => {
    await page.route('**/api/v1/statistics**', (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/daily')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Filtro inválido.' }),
      });
    });

    await page.goto('/period-report');

    await expect(page.getByTestId('period-report-error')).toContainText('Filtro inválido.');
  });
});
