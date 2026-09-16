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

  const ROUTES: { path: string; nameTestId: string; submitTestId: string }[] = [
    { path: '/sports', nameTestId: 'catalog-manager-name', submitTestId: 'catalog-manager-submit' },
    { path: '/leagues', nameTestId: 'catalog-manager-name', submitTestId: 'catalog-manager-submit' },
    { path: '/markets', nameTestId: 'catalog-manager-name', submitTestId: 'catalog-manager-submit' },
    { path: '/tipsters', nameTestId: 'catalog-manager-name', submitTestId: 'catalog-manager-submit' },
    { path: '/betting-houses', nameTestId: 'betting-houses-name', submitTestId: 'betting-houses-submit' },
    { path: '/teams', nameTestId: 'team-manager-name', submitTestId: 'team-manager-submit' },
  ];

  for (const { path, nameTestId, submitTestId } of ROUTES) {
    test(`${path}: panel has a visible gap from the sidebar and the name field stays full-width on a narrow viewport`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 700 });
      await page.goto(path);

      const nav = page.getByTestId('app-nav');
      const nameField = page.getByTestId(nameTestId);
      const submit = page.getByTestId(submitTestId);

      const [navBox, nameBox, submitBox] = await Promise.all([nav.boundingBox(), nameField.boundingBox(), submit.boundingBox()]);
      expect(navBox).not.toBeNull();
      expect(nameBox).not.toBeNull();
      expect(submitBox).not.toBeNull();

      expect(nameBox!.x).toBeGreaterThan(navBox!.x + navBox!.width + 8);
      expect(nameBox!.width).toBeGreaterThan(100);
      // The button sits below the field, not beside it.
      expect(submitBox!.y).toBeGreaterThanOrEqual(nameBox!.y + nameBox!.height);
    });
  }
});
