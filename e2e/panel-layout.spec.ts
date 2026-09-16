import { expect, test } from '@playwright/test';

test.describe('dashboard panel layout (RNF01, docs/DESIGN-SYSTEM.md "Layout em paineis")', () => {
  test('the page does not scroll - each panel scrolls independently instead', async ({ page }) => {
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
    const emptyCatalog = { content: [], page: 0, size: 100, totalElements: 0, totalPages: 0 };
    await page.route('**/api/v1/betting-houses*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(emptyCatalog) }),
    );
    for (const resource of ['sports', 'leagues', 'markets', 'tipsters']) {
      await page.route(`**/api/v1/${resource}*`, (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(emptyCatalog) }),
      );
    }
    const metrics = {
      totalStaked: 100,
      netProfit: 10,
      roi: 0.1,
      winRate: 0.5,
      settledCount: 1,
      wonCount: 1,
      lostCount: 0,
      voidCount: 0,
      preCount: 1,
      liveCount: 0,
      avgOdd: 1.9,
    };
    await page.route('**/api/v1/statistics*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          overall: metrics,
          bySport: Array.from({ length: 40 }, (_, i) => ({ dimensionId: `${i}`, dimensionName: `Sport ${i}`, metrics })),
          byMarket: [],
          byBettingHouse: [],
          monthly: [],
        }),
      }),
    );
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

    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-by-sport-row').first()).toBeVisible();

    const pageScrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    expect(pageScrollHeight).toBeLessThanOrEqual(viewportHeight + 1);

    const isPanelScrollable = await page.getByTestId('panel-body').last().evaluate((body) => {
      return body.scrollHeight > body.clientHeight;
    });
    expect(isPanelScrollable).toBe(true);
  });

  test('at mobile width, the page does not overflow horizontally', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
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
    const catalogEntries = { content: [{ id: '1', name: 'Item' }], page: 0, size: 100, totalElements: 1, totalPages: 1 };
    for (const resource of ['betting-houses', 'sports', 'leagues', 'markets', 'tipsters']) {
      await page.route(`**/api/v1/${resource}*`, (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(catalogEntries) }),
      );
    }
    const metrics = {
      totalStaked: 100,
      netProfit: 10,
      roi: 0.1,
      winRate: 0.5,
      settledCount: 1,
      wonCount: 1,
      lostCount: 0,
      voidCount: 0,
      preCount: 1,
      liveCount: 0,
      avgOdd: 1.9,
    };
    await page.route('**/api/v1/statistics*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ overall: metrics, bySport: [], byMarket: [], byBettingHouse: [], monthly: [] }),
      }),
    );
    await page.route('**/api/v1/bankroll/balance*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ at: 'now', balance: 2000 }) }),
    );
    await page.route('**/api/v1/settings*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ unitPercent: 0.01 }) }),
    );

    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-total-staked')).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
