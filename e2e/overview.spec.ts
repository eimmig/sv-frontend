import { expect, test } from '@playwright/test';

test.describe('epic-021 - "Visão geral" pós-login', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.setFixedTime(new Date('2026-09-15T12:00:00Z'));
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
    await page.route('**/api/v1/statistics**', (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/daily')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { date: '2026-02-10', totalStaked: 100, netProfit: 100, roi: 1, betCount: 1 },
            { date: '2026-03-05', totalStaked: 100, netProfit: -20, roi: -0.2, betCount: 1 },
          ]),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          overall: { totalStaked: 0, netProfit: 0, roi: 0, winRate: 0, settledCount: 0, wonCount: 0, lostCount: 0, voidCount: 0, preCount: 0, liveCount: 0, avgOdd: null },
          bySport: [],
          byMarket: [],
          byBettingHouse: [],
          byLeague: [],
          byTipster: [],
          byBetType: [
            { dimensionId: 'PRE', dimensionName: 'PRE', metrics: { totalStaked: 100, netProfit: 70, roi: 0.1, winRate: 0.5, settledCount: 1 } },
            { dimensionId: 'LIVE', dimensionName: 'LIVE', metrics: { totalStaked: 100, netProfit: 10, roi: 0.1, winRate: 0.5, settledCount: 1 } },
          ],
          monthly: [
            { year: 2026, month: 3, metrics: { totalStaked: 100, netProfit: -20, roi: -0.2, winRate: 0.4, settledCount: 3, wonCount: 1, lostCount: 2, voidCount: 0, preCount: 0, liveCount: 0, avgOdd: 1.9 } },
          ],
        }),
      });
    });
    await page.route('**/api/v1/bankroll/balance*', (route) => {
      const url = new URL(route.request().url());
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ at: url.searchParams.get('at') ?? 'now', balance: 1000 }),
      });
    });
    await page.route('**/api/v1/settings*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ unitPercent: 0.01 }) }),
    );
  });

  test('renders the 4 lifetime cards and a 12-row monthly table', async ({ page }) => {
    await page.goto('/overview');

    // 100/(1000*0.01)=10, -20/10=-2 -> total 8. Browser locale defaults to en-US in this suite.
    await expect(page.getByTestId('overview-lucro-total')).toContainText('8.00');
    await expect(page.getByTestId('overview-pre-live')).toContainText('7.00');
    await expect(page.getByTestId('overview-lucro-medio-mensal')).toContainText('0.67');

    await expect(page.getByTestId('overview-monthly-row')).toHaveCount(12);
  });

  test('returning to an already loaded screen reuses its data, with no new request and no loading overlay', async ({
    page,
  }) => {
    const statisticsRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/v1/statistics')) {
        statisticsRequests.push(request.url());
      }
    });
    await page.route('**/api/v1/statistics**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      await route.fallback();
    });

    await page.goto('/overview');
    await expect(page.getByTestId('loading-overlay')).toBeVisible();
    await expect(page.getByTestId('overview-lucro-total')).toContainText('8.00');
    await expect(page.getByTestId('loading-overlay')).toHaveCount(0);

    await page.getByTestId('nav-dashboard').click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId('loading-overlay')).toHaveCount(0);
    const requestsBeforeReturn = statisticsRequests.length;

    await page.getByTestId('nav-overview').click();
    await expect(page.getByTestId('overview-lucro-total')).toContainText('8.00');
    await expect(page.getByTestId('loading-overlay')).toHaveCount(0);
    expect(statisticsRequests).toHaveLength(requestsBeforeReturn);
  });

  test('login redirects here and /dashboard remains a normal nav item', async ({ page }) => {
    await page.goto('/overview');

    await page.getByTestId('nav-dashboard').click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.getByTestId('nav-overview').click();
    await expect(page).toHaveURL(/\/overview$/);
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

    await page.goto('/overview');

    await expect(page.getByTestId('overview-error')).toContainText('Filtro inválido.');
  });
});
