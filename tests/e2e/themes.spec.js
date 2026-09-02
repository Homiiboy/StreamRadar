import { test, expect } from '@playwright/test';

async function boot(page) {
  await page.addInitScript(() => {
    localStorage.setItem('streamradar-onboarding-v2-complete', 'true');
  });
  await page.goto('/');
  await page.evaluate(() => localStorage.removeItem('streamradar-theme-v1'));
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(window.StreamRadarThemes))).toBe(true);
}

test('offers seven selectable designs and persists the choice', async ({ page }) => {
  await boot(page);

  await page.locator('#sidebarSettings').click();
  await expect(page.locator('#streamradarThemeSettings')).toBeVisible();
  await expect(page.locator('[data-theme-option]')).toHaveCount(7);

  for (const theme of ['radar', 'cinema', 'midnight', 'oled', 'netflix', 'cyberpunk', 'glass']) {
    await expect(page.locator(`[data-theme-option="${theme}"]`)).toBeVisible();
  }

  await page.locator('[data-theme-option="glass"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-streamradar-theme', 'glass');
  await expect(page.locator('[data-theme-option="glass"]')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('streamradar-theme-v1'))).toBe('glass');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-streamradar-theme', 'glass');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('streamradar-theme-v1'))).toBe('glass');
});

test('new v0.5.2 designs can be selected directly', async ({ page }) => {
  await boot(page);
  await page.locator('#sidebarSettings').click();

  for (const theme of ['netflix', 'cyberpunk', 'glass']) {
    await page.locator(`[data-theme-option="${theme}"]`).click();
    await expect(page.locator('html')).toHaveAttribute('data-streamradar-theme', theme);
    await expect(page.locator(`[data-theme-option="${theme}"]`)).toHaveAttribute('aria-pressed', 'true');
  }
});

test('topbar palette button cycles through complete themes', async ({ page }) => {
  await boot(page);
  await expect(page.locator('html')).toHaveAttribute('data-streamradar-theme', 'radar');

  for (const theme of ['cinema', 'midnight', 'oled', 'netflix', 'cyberpunk', 'glass', 'radar']) {
    await page.locator('#themePulse').click();
    await expect(page.locator('html')).toHaveAttribute('data-streamradar-theme', theme);
  }
});

test('provider band stays compact and never covers the poster artwork', async ({ page }) => {
  await boot(page);

  const art = page.locator('.catalog-art').first();
  const band = art.locator('.catalog-provider-band');
  await expect(art).toBeVisible();
  await expect(band).toBeVisible();

  const geometry = await page.evaluate(() => {
    const artEl = document.querySelector('.catalog-art');
    const bandEl = artEl?.querySelector('.catalog-provider-band');
    if (!artEl || !bandEl) return null;
    const artRect = artEl.getBoundingClientRect();
    const bandRect = bandEl.getBoundingClientRect();
    return {
      artHeight: artRect.height,
      bandHeight: bandRect.height,
      gapToBottom: Math.abs(artRect.bottom - bandRect.bottom),
      gapToTop: bandRect.top - artRect.top
    };
  });

  expect(geometry).not.toBeNull();
  expect(geometry.artHeight).toBeGreaterThan(250);
  expect(geometry.bandHeight).toBeLessThan(80);
  expect(geometry.bandHeight / geometry.artHeight).toBeLessThan(0.22);
  expect(geometry.gapToBottom).toBeLessThan(20);
  expect(geometry.gapToTop).toBeGreaterThan(geometry.artHeight * 0.65);
});

