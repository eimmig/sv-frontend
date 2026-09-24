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
    // The "Hoje" default preset resolves from a real new Date() (period-preset-filter.ts) and
    // the fixtures below are fixed to 2026-09-11 - freeze only Date (not setTimeout/rAF, which
    // the loading overlay and Angular still need to run normally) so "today" always matches the
    // fixtures, regardless of which real day the suite runs on (same fix as the unit spec for
    // this page).
    await page.clock.setFixedTime(new Date('2026-09-11T12:00:00Z'));
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

  // Proves the "Custom" preset's real mat-datepicker widgets (calendar click, not
  // .fill() on a native input) drive the from/to query params - period-preset-filter.ts unit
  // tests already cover the boundary conversion, this proves the actual UI wiring.
  test('picks a custom date range via the datepicker calendars', async ({ page }) => {
    let lastFrom: string | null = null;
    let lastTo: string | null = null;
    await page.route('**/api/v1/statistics**', (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/daily')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
      lastFrom = url.searchParams.get('from');
      lastTo = url.searchParams.get('to');
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(statisticsBundle()) });
    });

    await page.goto('/period-report');
    await expect(page.getByTestId('period-report-roi-bankroll')).toBeVisible();

    await page.getByTestId('period-preset-select').click();
    await page.getByRole('option', { name: 'Custom' }).click();

    await page.getByTestId('period-preset-custom-from-toggle').click();
    await page.getByRole('button', { name: 'September 5, 2026' }).click();
    await page.getByTestId('period-preset-custom-to-toggle').click();
    await page.getByRole('button', { name: 'September 10, 2026' }).click();

    await expect.poll(() => lastFrom).toBe('2026-09-05');
    await expect.poll(() => lastTo).toBe('2026-09-10');
  });

  // The appDateMask directive formats input.value as the user types raw digits -
  // MatDatepickerInput's own (input) listener on the same element reads that live value and
  // parses it. Proves the two aren't just visually compatible (unit-tested already) but that the
  // final Date actually reaches the query params, against a real browser (JSDOM never resolves
  // this - see date-mask.directive.spec.ts).
  test('typing a raw digit sequence into the custom date fields drives the from/to query params', async ({ page }) => {
    let lastFrom: string | null = null;
    let lastTo: string | null = null;
    await page.route('**/api/v1/statistics**', (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/daily')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
      lastFrom = url.searchParams.get('from');
      lastTo = url.searchParams.get('to');
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(statisticsBundle()) });
    });

    await page.goto('/period-report');
    await expect(page.getByTestId('period-report-roi-bankroll')).toBeVisible();

    await page.getByTestId('period-preset-select').click();
    await page.getByRole('option', { name: 'Custom' }).click();

    await page.getByTestId('period-preset-custom-from').pressSequentially('09052026');
    await page.getByTestId('period-preset-custom-to').pressSequentially('09102026');
    await page.getByTestId('period-preset-custom-to').blur();

    await expect.poll(() => lastFrom).toBe('2026-09-05');
    await expect.poll(() => lastTo).toBe('2026-09-10');
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
