import { expect, test } from '@playwright/test';

function catalogRoute(items: { id: string; name: string }[]) {
  return (route: import('@playwright/test').Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: items, page: 0, size: 100, totalElements: items.length, totalPages: 1 }),
    });
}

function searchResultBody(overrides: Record<string, unknown> = {}) {
  return {
    summary: {
      betCount: 12,
      totalStaked: 600,
      netProfit: 90,
      roi: 0.15,
      winRate: 0.58,
      avgOdd: 1.87,
      maxDrawdown: 40,
      sharpeRatio: 0.42,
      ...((overrides['summary'] as Record<string, unknown>) ?? {}),
    },
    timeline: [
      { date: '2026-01-03', cumulativeProfit: 30 },
      { date: '2026-01-07', cumulativeProfit: -10 },
    ],
  };
}

test.describe('epic-012 - "Buscar Estatisticas" pre-bet decision screen', () => {
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
    await page.route('**/api/v1/leagues*', catalogRoute([{ id: 'lg-1', name: 'Brasileirao' }]));
    await page.route('**/api/v1/markets*', catalogRoute([{ id: 'mk-1', name: 'Handicap' }]));
    await page.route('**/api/v1/tipsters*', catalogRoute([{ id: 'tp-1', name: 'Ana' }]));
    // GET /api/v1/statistics/teams returns a bare array (see docs/API-CONTRACTS.md), not the
    // {content:[...]} paged envelope catalogRoute() builds for the other catalogs - a different
    // shape here would make DimTeam options[Symbol.iterator] undefined once teamOptions() is
    // passed straight into the template's @for.
    await page.route('**/api/v1/statistics/teams*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'tm-1', name: 'Flamengo' }]) }),
    );
    // Only the golden-path test navigates through /dashboard first (to prove the nav link works) -
    // this route just keeps that page from erroring out while it auto-loads on mount.
    await page.route('**/api/v1/statistics*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          overall: { totalStaked: 0, netProfit: 0, roi: 0, winRate: 0, settledCount: 0 },
          bySport: [],
          byMarket: [],
          byBettingHouse: [],
          monthly: [],
        }),
      }),
    );
  });

  test('golden path: choose sport+league, submit, see the summary cards and the equity curve', async ({ page }) => {
    await page.route('**/api/v1/statistics/search*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(searchResultBody()) }),
    );

    await page.goto('/dashboard');
    await page.getByTestId('nav-search-statistics').click();
    await expect(page).toHaveURL(/\/search-statistics$/);

    await expect(page.getByTestId('search-statistics-empty-before-search')).toBeVisible();
    await expect(page.getByTestId('search-statistics-submit')).toBeDisabled();

    await page.getByTestId('search-statistics-filter-sport').click();
    await page.getByRole('option', { name: 'Futebol' }).click();
    await page.getByTestId('search-statistics-filter-league').click();
    await page.getByRole('option', { name: 'Brasileirao' }).click();

    await expect(page.getByTestId('search-statistics-submit')).toBeEnabled();
    await page.getByTestId('search-statistics-submit').click();

    await expect(page.getByTestId('search-statistics-bet-count')).toContainText('12');
    await expect(page.getByTestId('search-statistics-total-staked')).toContainText('R$');
    await expect(page.getByTestId('search-statistics-roi')).toContainText('%');
    await expect(page.getByTestId('search-statistics-chart')).toBeVisible();
  });

  test('shows a distinct message when the combination has zero settled bets', async ({ page }) => {
    await page.route('**/api/v1/statistics/search*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          searchResultBody({
            summary: { betCount: 0, totalStaked: 0, netProfit: 0, roi: 0, winRate: 0, avgOdd: 0, maxDrawdown: 0, sharpeRatio: null },
          }),
        ),
      }),
    );

    await page.goto('/search-statistics');
    await page.getByTestId('search-statistics-filter-sport').click();
    await page.getByRole('option', { name: 'Futebol' }).click();
    await page.getByTestId('search-statistics-filter-league').click();
    await page.getByRole('option', { name: 'Brasileirao' }).click();
    await page.getByTestId('search-statistics-submit').click();

    await expect(page.getByTestId('search-statistics-empty-result')).toBeVisible();
    await expect(page.getByTestId('search-statistics-cards')).toHaveCount(0);
  });

  test('team options refilter after switching sport, scoped by the new sport', async ({ page }) => {
    await page.unroute('**/api/v1/statistics/teams*');
    await page.route('**/api/v1/statistics/teams*', (route) => {
      const url = new URL(route.request().url());
      const sportId = url.searchParams.get('sportId');
      const teams = sportId === 'sp-2' ? [{ id: 'tm-2', name: 'Vasco' }] : [{ id: 'tm-1', name: 'Flamengo' }];
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(teams) });
    });
    await page.route('**/api/v1/sports*', catalogRoute([
      { id: 'sp-1', name: 'Futebol' },
      { id: 'sp-2', name: 'Basquete' },
    ]));

    await page.goto('/search-statistics');
    await page.getByTestId('search-statistics-filter-sport').click();
    await page.getByRole('option', { name: 'Futebol' }).click();
    await page.getByTestId('search-statistics-filter-team').click();
    await expect(page.getByRole('option', { name: 'Flamengo' })).toBeVisible();
    await page.keyboard.press('Escape');

    await page.getByTestId('search-statistics-filter-sport').click();
    await page.getByRole('option', { name: 'Basquete' }).click();
    await page.getByTestId('search-statistics-filter-team').click();
    await expect(page.getByRole('option', { name: 'Vasco' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Flamengo' })).toHaveCount(0);
  });
});
