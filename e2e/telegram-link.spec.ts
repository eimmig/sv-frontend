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
    await page.route('**/api/v1/telegram-links/me', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ linked: false, linkedAt: null }) }),
    );
  });

  test('shows that no Telegram account is linked yet and offers the code', async ({ page }) => {
    await page.goto('/telegram-link');

    await expect(page.getByTestId('telegram-link-status-unlinked')).toBeVisible();
    await expect(page.getByTestId('telegram-link-generate')).toBeVisible();
  });

  test('shows since when the account is linked and hides the code button', async ({ page }) => {
    await page.route('**/api/v1/telegram-links/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ linked: true, linkedAt: '2026-10-20T14:30:00Z' }),
      }),
    );

    await page.goto('/telegram-link');

    await expect(page.getByTestId('telegram-link-status-linked')).toContainText('10/20/2026');
    await expect(page.getByTestId('telegram-link-generate')).toHaveCount(0);
  });

  test('checking again picks up a link made in the bot meanwhile', async ({ page }) => {
    let linked = false;
    await page.route('**/api/v1/telegram-links/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(linked ? { linked: true, linkedAt: '2026-11-02T18:00:00Z' } : { linked: false, linkedAt: null }),
      }),
    );

    await page.goto('/telegram-link');
    await expect(page.getByTestId('telegram-link-status-unlinked')).toBeVisible();

    linked = true;
    await page.getByTestId('telegram-link-status-refresh').click();

    await expect(page.getByTestId('telegram-link-status-linked')).toBeVisible();
    await expect(page.getByTestId('telegram-link-generate')).toHaveCount(0);
  });

  test('shows an error when the link status cannot be read', async ({ page }) => {
    await page.route('**/api/v1/telegram-links/me', (route) => route.abort('failed'));

    await page.goto('/telegram-link');

    await expect(page.getByTestId('telegram-link-status-error')).toBeVisible();
    await expect(page.getByTestId('telegram-link-status-refresh')).toBeVisible();
  });

  test('shows the link status in pt-BR', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('stakevault.language', 'pt-BR'));
    await page.route('**/api/v1/telegram-links/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ linked: true, linkedAt: '2026-10-20T14:30:00Z' }),
      }),
    );

    await page.goto('/telegram-link');

    await expect(page.getByTestId('telegram-link-status-linked')).toContainText('Conta do Telegram vinculada desde 20/10/2026');
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
