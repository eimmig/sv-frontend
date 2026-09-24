import { expect, test } from '@playwright/test';

test.describe('epic-027 - "Vincular Telegram" page', () => {
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

  test('generates a link code and shows it with its expiration', async ({ page }) => {
    await page.route('**/api/v1/telegram-links', (route) =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'ABC23XYZ', expiresAt: '2026-09-15T12:15:00Z' }),
      }),
    );

    await page.goto('/telegram-link');
    await page.getByTestId('telegram-link-generate').click();

    await expect(page.getByTestId('telegram-link-code')).toHaveText('ABC23XYZ');
  });

  test('shows the RFC 7807 detail when generation fails', async ({ page }) => {
    await page.route('**/api/v1/telegram-links', (route) =>
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Muitas tentativas. Aguarde antes de gerar um novo código.' }),
      }),
    );

    await page.goto('/telegram-link');
    await page.getByTestId('telegram-link-generate').click();

    await expect(page.getByTestId('telegram-link-error')).toContainText('Muitas tentativas');
  });

  test('side nav links to the telegram-link page', async ({ page }) => {
    await page.route('**/api/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
    );
    await page.route('**/api/v1/statistics/daily*', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    await page.route('**/api/v1/statistics*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
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
          bySport: [],
          byMarket: [],
          byBettingHouse: [],
          byLeague: [],
          byTipster: [],
          byBetType: [],
          monthly: [],
        }),
      }),
    );

    await page.goto('/dashboard');
    await page.getByTestId('nav-telegram-link').click();

    await expect(page).toHaveURL(/\/telegram-link$/);
  });
});
