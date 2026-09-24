import { expect, test } from '@playwright/test';

test.describe('app-side-nav collapsed state', () => {
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
  });

  test('settings menu stays reachable and switches locale in the collapsed sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByTestId('nav-collapse-toggle').click();

    const trigger = page.getByTestId('nav-settings-menu');
    await expect(trigger).toBeVisible();

    await trigger.click();
    await page.getByTestId('nav-settings-language-toggle').click();
    await page.getByTestId('nav-settings-language-en-US').click();
    await trigger.click();
    await expect(page.getByTestId('nav-settings-theme')).toContainText(/(light|dark) mode/i);
    await page.keyboard.press('Escape');

    await trigger.click();
    await page.getByTestId('nav-settings-language-toggle').click();
    await page.getByTestId('nav-settings-language-es').click();
    await trigger.click();
    await expect(page.getByTestId('nav-settings-theme')).toContainText(/modo (claro|oscuro)/i);
    await page.keyboard.press('Escape');

    await trigger.click();
    await page.getByTestId('nav-settings-language-toggle').click();
    await page.getByTestId('nav-settings-language-pt-BR').click();
    await trigger.click();
    await expect(page.getByTestId('nav-settings-theme')).toContainText(/modo (claro|escuro)/i);
  });

  test('language options stay collapsed until the "Idioma" row is toggled open', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByTestId('nav-collapse-toggle').click();

    await page.getByTestId('nav-settings-menu').click();
    const menu = page.locator('.mat-mdc-menu-panel');
    await expect(menu).toBeVisible();

    await page.getByTestId('nav-settings-language-toggle').click();
    await expect(page.getByTestId('nav-settings-language-pt-BR')).toBeVisible();
    await expect(page.getByTestId('nav-settings-language-en-US')).toBeVisible();
    await expect(page.getByTestId('nav-settings-language-es')).toBeVisible();
    await expect(page.getByTestId('nav-settings-theme')).toBeVisible();
    await expect(page.getByTestId('nav-change-password')).toBeVisible();
    await expect(page.getByTestId('nav-logout')).toBeVisible();
  });
});
