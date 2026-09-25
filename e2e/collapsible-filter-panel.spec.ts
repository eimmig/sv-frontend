import { Page, Route, expect, test } from '@playwright/test';

function catalogRoute(items: { id: string; name: string }[]) {
  return (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: items, page: 0, size: 100, totalElements: items.length, totalPages: 1 }),
    });
}

const STATISTICS_BUNDLE = {
  overall: {
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
  },
  bySport: [],
  byMarket: [],
  byBettingHouse: [],
  byLeague: [],
  byTipster: [],
  byTeam: [],
  byBetType: [],
  monthly: [],
};

async function mockApi(page: Page, language = 'pt-BR') {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript((lang) => {
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
    localStorage.setItem('stakevault.language', lang);
  }, language);
  await page.route('**/api/v1/betting-houses*', catalogRoute([{ id: 'bh-1', name: 'Bet365' }]));
  await page.route('**/api/v1/sports*', catalogRoute([{ id: 'sp-1', name: 'Futebol' }]));
  await page.route('**/api/v1/leagues*', catalogRoute([{ id: 'lg-1', name: 'Brasileirão' }]));
  await page.route('**/api/v1/markets*', catalogRoute([{ id: 'mk-1', name: 'Handicap' }]));
  await page.route('**/api/v1/tipsters*', catalogRoute([{ id: 'tp-1', name: 'Ana' }]));
  await page.route('**/api/v1/bankroll/balance*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ at: 'now', balance: 2000 }) }),
  );
  await page.route('**/api/v1/settings*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ unitPercent: 0.01 }) }),
  );
  await page.route('**/api/v1/statistics*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(STATISTICS_BUNDLE) }),
  );
  await page.route('**/api/v1/statistics/daily*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
  );
}

async function panelWidth(page: Page, index: number): Promise<number> {
  const box = await page.locator('app-panel').nth(index).boundingBox();
  return box?.width ?? 0;
}

test.describe('Collapsible filter panel on the dashboard screens', () => {
  test('collapsing gives the charts the freed width, keeps the chosen filters and survives a reload', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockApi(page);
    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-total-staked')).toContainText('R$');

    await page.getByTestId('dashboard-filter-betting-house').click();
    await page.getByRole('option', { name: 'Bet365' }).click();
    await page.getByTestId('dashboard-filter-apply').click();

    const chartsBefore = await panelWidth(page, 1);
    const toggle = page.getByTestId('panel-collapse-toggle');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await toggle.click();

    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByTestId('panel-badge')).toHaveText('1');
    await expect(toggle).toHaveAttribute('aria-label', 'Expandir painel, 1 filtro aplicado');
    await expect(page.getByTestId('dashboard-filter-betting-house')).toBeHidden();
    await expect.poll(() => panelWidth(page, 0)).toBeLessThan(64);
    await expect.poll(() => panelWidth(page, 1)).toBeGreaterThan(chartsBefore + 200);

    await toggle.click();
    await expect(page.getByTestId('dashboard-filter-betting-house')).toHaveValue('Bet365');

    await toggle.click();
    await page.reload();
    await expect(page.getByTestId('dashboard-total-staked')).toContainText('R$');
    await expect(page.getByTestId('panel-collapse-toggle')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByTestId('dashboard-filter-betting-house')).toBeHidden();
  });

  test('each screen remembers its own state', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockApi(page);
    await page.goto('/period-report');
    await page.getByTestId('panel-collapse-toggle').first().click();
    await expect(page.getByTestId('panel-collapse-toggle').first()).toHaveAttribute('aria-expanded', 'false');

    await page.goto('/sports-dashboard');
    await expect(page.getByTestId('panel-collapse-toggle')).toHaveAttribute('aria-expanded', 'true');
  });

  test('at mobile width, the collapsed panel is a short bar and the page does not overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockApi(page);
    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-total-staked')).toContainText('R$');

    await page.getByTestId('panel-collapse-toggle').click();

    const filters = await page.locator('app-panel').first().boundingBox();
    const results = await page.locator('app-panel').nth(1).boundingBox();
    expect(filters?.height ?? 0).toBeLessThan(80);
    expect(filters?.width ?? 0).toBeCloseTo(results?.width ?? 0, 0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('the toggle follows the active language', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockApi(page, 'en-US');
    await page.goto('/period-comparison');
    await expect(page.getByTestId('period-comparison-row-net-profit')).toBeVisible();

    const toggle = page.getByTestId('panel-collapse-toggle');
    await expect(toggle).toHaveAttribute('aria-label', 'Collapse panel');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-label', 'Expand panel');
  });
});
