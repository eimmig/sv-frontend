import { expect, test } from '@playwright/test';

function statisticsBundle(bySport: unknown[]) {
  return {
    overall: {
      totalStaked: 0,
      netProfit: 0,
      roi: 0,
      winRate: 0,
      settledCount: 0,
      wonCount: 0,
      lostCount: 0,
      voidCount: 0,
      preCount: 0,
      liveCount: 0,
      avgOdd: null,
    },
    bySport,
    byMarket: [],
    byBettingHouse: [],
    byLeague: [],
    byTipster: [],
    monthly: [],
  };
}

test.describe('shared/catalog-dashboard (ranking per segment)', () => {
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

  test('opens /sports-dashboard from the nav and shows the ranking sorted by ROI desc', async ({ page }) => {
    await page.route('**/api/v1/statistics*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          statisticsBundle([
            { dimensionId: '1', dimensionName: 'Futebol', metrics: { totalStaked: 500, netProfit: 20, roi: 0.04, winRate: 0.5, settledCount: 10, wonCount: 5, lostCount: 5, voidCount: 0, preCount: 0, liveCount: 0, avgOdd: 2 } },
            { dimensionId: '2', dimensionName: 'Basquete', metrics: { totalStaked: 500, netProfit: 90, roi: 0.18, winRate: 0.6, settledCount: 10, wonCount: 6, lostCount: 4, voidCount: 0, preCount: 0, liveCount: 0, avgOdd: 2 } },
          ]),
        ),
      }),
    );

    await page.goto('/dashboard');
    await page.getByTestId('nav-sports-menu').click();
    await page.getByTestId('nav-sports-dashboard').click();

    await expect(page).toHaveURL(/\/sports-dashboard$/);
    const rows = page.getByTestId('catalog-dashboard-row');
    await expect(rows).toHaveCount(2);
    // Basquete has the higher ROI (18% > 4%) and must rank first.
    await expect(rows.first()).toContainText('Basquete');
    await expect(rows.last()).toContainText('Futebol');
  });

  test('changing the period issues a new statistics request with the new date range', async ({ page }) => {
    let lastFrom: string | null = null;
    await page.route('**/api/v1/statistics*', (route) => {
      const url = new URL(route.request().url());
      lastFrom = url.searchParams.get('from');
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(statisticsBundle([])) });
    });

    await page.goto('/sports-dashboard');
    await expect(page.getByTestId('catalog-dashboard-empty')).toBeVisible();
    const initialFrom = lastFrom;

    await page.getByTestId('period-preset-select').click();
    await page.getByRole('option', { name: 'Last month' }).click();

    await expect.poll(() => lastFrom).not.toBe(initialFrom);
  });

  test('shows the RFC 7807 detail when the statistics request fails', async ({ page }) => {
    await page.route('**/api/v1/statistics*', (route) =>
      route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ detail: 'Filtro inválido.' }) }),
    );

    await page.goto('/leagues-dashboard');

    await expect(page.getByTestId('catalog-dashboard-error')).toContainText('Filtro inválido.');
  });
});
