import { expect, test } from '@playwright/test';

function catalogRoute(items: { id: string; name: string }[]) {
  return (route: import('@playwright/test').Route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: items, page: 0, size: 100, totalElements: items.length, totalPages: 1 }),
    });
}

test.describe('feat-031 - searchable-select (typing filters the catalog list)', () => {
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
    await page.route(
      '**/api/v1/betting-houses*',
      catalogRoute([
        { id: 'bh-1', name: 'Bet365' },
        { id: 'bh-2', name: 'Betano' },
      ]),
    );
    await page.route(
      '**/api/v1/sports*',
      catalogRoute([
        { id: 'sp-1', name: 'Futebol' },
        { id: 'sp-2', name: 'Basquete' },
      ]),
    );
    await page.route(
      '**/api/v1/leagues*',
      catalogRoute([
        { id: 'lg-1', name: 'Brasileirão' },
        { id: 'lg-2', name: 'Premier League' },
      ]),
    );
    await page.route('**/api/v1/markets*', catalogRoute([{ id: 'mk-1', name: 'Handicap' }]));
    await page.route('**/api/v1/tipsters*', catalogRoute([{ id: 'tp-1', name: 'Ana' }]));
    await page.route('**/api/v1/teams*', catalogRoute([]));
  });

  test('typing a partial name narrows the option list', async ({ page }) => {
    await page.goto('/register-bet');
    const sport = page.getByTestId('register-bet-sport');
    await sport.click();
    await expect(page.getByRole('option')).toHaveCount(2);

    await sport.fill('bas');
    await expect(page.getByRole('option')).toHaveCount(1);
    await expect(page.getByRole('option', { name: 'Basquete' })).toBeVisible();
  });

  test('typing without diacritics still finds an accented name', async ({ page }) => {
    await page.goto('/register-bet');
    const league = page.getByTestId('register-bet-league');
    await league.click();
    await league.fill('brasileirao');

    await expect(page.getByRole('option')).toHaveCount(1);
    await expect(page.getByRole('option', { name: 'Brasileirão' })).toBeVisible();
  });

  test('selecting an option commits it, and reopening shows the full list again', async ({ page }) => {
    await page.goto('/register-bet');
    const house = page.getByTestId('register-bet-betting-house');
    await house.click();
    await page.getByRole('option', { name: 'Betano' }).click();
    await expect(house).toHaveValue('Betano');

    await house.click();
    await expect(page.getByRole('option')).toHaveCount(2);
  });

  test('typing text that matches nothing and blurring reverts to the previous selection', async ({ page }) => {
    await page.goto('/register-bet');
    const sport = page.getByTestId('register-bet-sport');
    await sport.click();
    await page.getByRole('option', { name: 'Futebol' }).click();
    await expect(sport).toHaveValue('Futebol');

    await sport.fill('xyz not a real sport');
    await page.getByTestId('register-bet-league').click();

    await expect(sport).toHaveValue('Futebol');
  });

  test('team1/team2 stay disabled showing "None" until a sport is chosen, then enable and filter by that sport', async ({
    page,
  }) => {
    await page.route(
      '**/api/v1/teams*',
      catalogRoute([
        { id: 'tm-1', name: 'Flamengo', sportId: 'sp-1' },
        { id: 'tm-2', name: 'Lakers', sportId: 'sp-2' },
      ]),
    );

    await page.goto('/register-bet');
    const team1 = page.getByTestId('register-bet-team1');

    await expect(team1).toBeDisabled();
    await expect(team1).toHaveValue('None');

    await page.getByTestId('register-bet-sport').click();
    await page.getByRole('option', { name: 'Futebol' }).click();

    await expect(team1).toBeEnabled();
    await team1.click();
    await expect(page.getByRole('option')).toHaveCount(2); // None + Flamengo, Lakers scoped out by sportId
    await page.getByRole('option', { name: 'Flamengo' }).click();
    await expect(team1).toHaveValue('Flamengo');
  });
});
