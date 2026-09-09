import { expect, test } from '@playwright/test';

// Regression coverage for a real bug found via this subtask's own Playwright setup (feat-001.7):
// app-panel-layout/app-panel (feat-001.4) never set `:host { display: block }` on either
// component, so the CSS Grid item sizing/percentage-height chain never actually applied - a
// panel with more content than fits (here, the placeholder Filters list) grew the whole page
// instead of capping its own height and scrolling internally. Unit tests couldn't catch this:
// jsdom doesn't run real layout, so `max-height: 100%` on an element with no definite ancestor
// height passes any DOM/CSS-text assertion while still being visually broken.
test.describe('dashboard panel layout (RNF01, docs/DESIGN-SYSTEM.md "Layout em painéis")', () => {
  test('the page does not scroll - each panel scrolls independently instead', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // /dashboard is authGuard-protected since feat-002.2 - seed a session before navigating
    // instead of going through the real login form, which is out of scope for this test.
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
    await page.goto('/dashboard');

    const pageScrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    expect(pageScrollHeight).toBeLessThanOrEqual(viewportHeight + 1);

    const isPanelScrollable = await page.getByTestId('panel-body').first().evaluate((body) => {
      return body.scrollHeight > body.clientHeight;
    });
    expect(isPanelScrollable).toBe(true);
  });
});
