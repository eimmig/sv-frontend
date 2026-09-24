import { expect, test } from '@playwright/test';

function catalogRoute(items: { id: string; name: string }[]) {
  return (route: import('@playwright/test').Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: items, page: 0, size: 100, totalElements: items.length, totalPages: 1 }),
    });
}

test.describe('RF04 - manual bet registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-09-16T12:00:00Z'));
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
    await page.route('**/api/v1/teams*', catalogRoute([{ id: 'tm-1', name: 'Flamengo' }]));
  });

  test('registers a bet and shows the success banner with the form cleared', async ({ page }) => {
    let idempotencyKeyHeader: string | null = null;
    await page.route('**/api/v1/bets', (route) => {
      idempotencyKeyHeader = route.request().headers()['idempotency-key'] ?? null;
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: '1', status: 'pending' }),
      });
    });

    await page.goto('/register-bet');
    await page.getByTestId('register-bet-betting-house').click();
    await page.getByRole('option', { name: 'Bet365' }).click();
    await page.getByTestId('register-bet-sport').click();
    await page.getByRole('option', { name: 'Futebol' }).click();
    await page.getByTestId('register-bet-league').click();
    await page.getByRole('option', { name: 'Brasileirão' }).click();
    await page.getByTestId('register-bet-market').click();
    await page.getByRole('option', { name: 'Handicap' }).click();
    await page.getByTestId('register-bet-stake').fill('100');
    await page.getByTestId('register-bet-odd').fill('1.5');
    await page.getByTestId('register-bet-submit').click();

    await expect(page.getByTestId('register-bet-success')).toBeVisible();
    expect(idempotencyKeyHeader).toBeTruthy();
    await expect(page.getByTestId('register-bet-stake')).toHaveValue('0');
  });

  test('registers a bet with a PRE/LIVE bet type selected via mat-select, not free text', async ({ page }) => {
    let requestBody: Record<string, unknown> | null = null;
    await page.route('**/api/v1/bets', (route) => {
      requestBody = route.request().postDataJSON();
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: '1', status: 'pending' }),
      });
    });

    await page.goto('/register-bet');
    await page.getByTestId('register-bet-betting-house').click();
    await page.getByRole('option', { name: 'Bet365' }).click();
    await page.getByTestId('register-bet-sport').click();
    await page.getByRole('option', { name: 'Futebol' }).click();
    await page.getByTestId('register-bet-league').click();
    await page.getByRole('option', { name: 'Brasileirão' }).click();
    await page.getByTestId('register-bet-market').click();
    await page.getByRole('option', { name: 'Handicap' }).click();
    await page.getByTestId('register-bet-bet-type').click();
    await page.getByRole('option', { name: 'Live' }).click();
    await page.getByTestId('register-bet-stake').fill('100');
    await page.getByTestId('register-bet-odd').fill('1.5');
    await page.getByTestId('register-bet-submit').click();

    await expect(page.getByTestId('register-bet-success')).toBeVisible();
    expect(requestBody?.['betType']).toBe('live');
  });

  test('picks the bet date via the calendar and the time via the timepicker input', async ({ page }) => {
    let requestBody: Record<string, unknown> | null = null;
    await page.route('**/api/v1/bets', (route) => {
      requestBody = route.request().postDataJSON();
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: '1', status: 'pending' }),
      });
    });

    await page.goto('/register-bet');
    await page.getByTestId('register-bet-betting-house').click();
    await page.getByRole('option', { name: 'Bet365' }).click();
    await page.getByTestId('register-bet-sport').click();
    await page.getByRole('option', { name: 'Futebol' }).click();
    await page.getByTestId('register-bet-league').click();
    await page.getByRole('option', { name: 'Brasileirão' }).click();
    await page.getByTestId('register-bet-market').click();
    await page.getByRole('option', { name: 'Handicap' }).click();
    await page.getByTestId('register-bet-stake').fill('100');
    await page.getByTestId('register-bet-odd').fill('1.5');

    await page.getByTestId('register-bet-date-toggle').click();
    await page.getByRole('button', { name: 'September 10, 2026' }).click();
    await page.getByTestId('register-bet-time').fill('14:30');
    await page.getByTestId('register-bet-time').blur();

    await page.getByTestId('register-bet-submit').click();

    await expect(page.getByTestId('register-bet-success')).toBeVisible();
    const sentDate = new Date(requestBody?.['betDate'] as string);
    expect(sentDate.getDate()).toBe(10);
    expect(sentDate.getMonth()).toBe(8);
    expect(sentDate.getHours()).toBe(14);
    expect(sentDate.getMinutes()).toBe(30);
  });

  test('shows the RFC 7807 detail when the odd is invalid', async ({ page }) => {
    await page.route('**/api/v1/bets', (route) =>
      route.fulfill({
        status: 422,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          type: 'https://docs/errors/invalid-odd',
          title: 'Invalid odd',
          detail: 'A odd informada deve ser estritamente maior que 1,00 (RN07).',
          status: 422,
        }),
      }),
    );

    await page.goto('/register-bet');
    await page.getByTestId('register-bet-betting-house').click();
    await page.getByRole('option', { name: 'Bet365' }).click();
    await page.getByTestId('register-bet-sport').click();
    await page.getByRole('option', { name: 'Futebol' }).click();
    await page.getByTestId('register-bet-league').click();
    await page.getByRole('option', { name: 'Brasileirão' }).click();
    await page.getByTestId('register-bet-market').click();
    await page.getByRole('option', { name: 'Handicap' }).click();
    await page.getByTestId('register-bet-stake').fill('100');
    await page.getByTestId('register-bet-odd').fill('1.5');
    await page.getByTestId('register-bet-submit').click();

    await expect(page.getByTestId('register-bet-form-error')).toHaveText(
      'A odd informada deve ser estritamente maior que 1,00 (RN07).',
    );
  });
});
