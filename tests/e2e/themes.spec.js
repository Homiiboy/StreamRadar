import { test, expect } from '@playwright/test';

async function boot(page) {
  await page.addInitScript(() => {
    localStorage.setItem('streamradar-onboarding-v2-complete', 'true');
    localStorage.removeItem('streamradar-theme-v1');
  });
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => Boolean(window.StreamRadarThemes))).toBe(true);
}

test('offers four selectable designs and persists the choice', async ({ page }) => {
  await boot(page);

  await page.locator('#sidebarSettings').click();
  await expect(page.locator('#streamradarThemeSettings')).toBeVisible();
  await expect(page.locator('[data-theme-option]')).toHaveCount(4);

  await page.locator('[data-theme-option="midnight"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-streamradar-theme', 'midnight');
  await expect(page.locator('[data-theme-option="midnight"]')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('streamradar-theme-v1'))).toBe('midnight');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-streamradar-theme', 'midnight');
});

test('topbar palette button cycles through complete themes', async ({ page }) => {
  await boot(page);
  await expect(page.locator('html')).toHaveAttribute('data-streamradar-theme', 'radar');

  await page.locator('#themePulse').click();
  await expect(page.locator('html')).toHaveAttribute('data-streamradar-theme', 'cinema');

  await page.locator('#themePulse').click();
  await expect(page.locator('html')).toHaveAttribute('data-streamradar-theme', 'midnight');
});
