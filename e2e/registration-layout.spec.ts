import { expect, test } from '@playwright/test';

test.describe('feat-024.3 - shared registration layout across all catalog + team screens', () => {
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
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"content":[],"page":0,"size":100,"totalElements":0,"totalPages":0}' }),
    );
  });

  const ROUTES: { path: string; hostTag: string; nameTestId: string; submitTestId: string }[] = [
    { path: '/sports', hostTag: 'app-catalog-manager', nameTestId: 'catalog-manager-name', submitTestId: 'catalog-manager-submit' },
    { path: '/leagues', hostTag: 'app-catalog-manager', nameTestId: 'catalog-manager-name', submitTestId: 'catalog-manager-submit' },
    { path: '/markets', hostTag: 'app-catalog-manager', nameTestId: 'catalog-manager-name', submitTestId: 'catalog-manager-submit' },
    { path: '/tipsters', hostTag: 'app-catalog-manager', nameTestId: 'catalog-manager-name', submitTestId: 'catalog-manager-submit' },
    { path: '/betting-houses', hostTag: 'app-betting-houses', nameTestId: 'betting-houses-name', submitTestId: 'betting-houses-submit' },
    { path: '/teams', hostTag: 'app-team-manager', nameTestId: 'team-manager-name', submitTestId: 'team-manager-submit' },
  ];

  for (const { path, hostTag, nameTestId, submitTestId } of ROUTES) {
    test(`${path}: host has lateral padding and the name field stays full-width on a narrow viewport`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 700 });
      await page.goto(path);

      const nameField = page.getByTestId(nameTestId);
      const submit = page.getByTestId(submitTestId);

      const [nameBox, submitBox, hostPaddingLeft] = await Promise.all([
        nameField.boundingBox(),
        submit.boundingBox(),
        page.locator(hostTag).evaluate((el) => parseFloat(getComputedStyle(el).paddingLeft)),
      ]);
      expect(nameBox).not.toBeNull();
      expect(submitBox).not.toBeNull();

      expect(hostPaddingLeft).toBeGreaterThanOrEqual(24);
      expect(nameBox!.width).toBeGreaterThan(100);
      expect(submitBox!.y).toBeGreaterThanOrEqual(nameBox!.y + nameBox!.height);
    });
  }
});
