import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const ONBOARDING_KEY = 'streamradar-onboarding-v2-complete';
const CONFIG_KEY = 'streamradar-personalization-v2';
const PROVIDERS_KEY = 'streamradar-preferred-providers';
const TOKEN_KEY = 'streamradar-tmdb-token';
const WATCHLIST_KEY = 'streamradar-watchlist';

async function boot(page, storage = {}, options = {}) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:4173)/, route => route.abort());
  if (options.publishedDownloads) {
    await page.route('https://raw.githubusercontent.com/Homiiboy/StreamRadar/main/downloads/README.md*', route => route.fulfill({ status:200, contentType:'text/markdown', body:options.publishedDownloads }));
  }
  await page.addInitScript(entries => {
    try {
      if (sessionStorage.getItem('__streamradar_test_seeded') !== '1') {
        localStorage.clear();
        Object.entries(entries).forEach(([key, value]) => localStorage.setItem(key, value));
        sessionStorage.setItem('__streamradar_test_seeded', '1');
      }
    } catch {}
  }, storage);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.StreamRadarPersonalization && window.StreamRadarCatalog));
  return errors;
}

function configuredStorage(extra = {}) {
  return { [ONBOARDING_KEY]: 'true', ...extra };
}

test('first run can finish with no providers and stays completed', async ({ page }) => {
  const errors = await boot(page);
  await expect(page.locator('#onboardingOverlay')).toBeVisible();
  await expect(page.locator('[data-onboarding-step="0"].active h1')).toContainText('Dein Radar');

  await page.locator('#onboardingNext').click();
  await page.locator('#onboardingNext').click();
  await page.locator('#onboardingProvidersNone').click();
  await page.locator('#onboardingNext').click();
  await expect(page.locator('#onboardingNext')).toHaveText('StreamRadar starten');
  await page.locator('#onboardingNext').click();

  await expect(page.locator('#onboardingOverlay')).toHaveCount(0);
  const saved = await page.evaluate(({ onboardingKey, providersKey }) => ({
    onboarding: localStorage.getItem(onboardingKey),
    providers: JSON.parse(localStorage.getItem(providersKey) || 'null')
  }), { onboardingKey: ONBOARDING_KEY, providersKey: PROVIDERS_KEY });
  expect(saved.onboarding).toBe('true');
  expect(saved.providers).toEqual([]);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#onboardingOverlay')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('global search opens details and main navigation remains usable', async ({ page }) => {
  const errors = await boot(page, configuredStorage());
  await page.keyboard.press('Control+K');
  await expect(page.locator('#globalSearchOverlay')).toBeVisible();
  await page.locator('#searchInput').fill('Midnight Protocol');
  const result = page.locator('.global-search-result').filter({ hasText: 'Midnight Protocol' }).first();
  await expect(result).toBeVisible();
  await result.click();
  await expect(page.locator('#detailDialog')).toHaveAttribute('open', '');
  await expect(page.locator('#detailDialog h2')).toContainText('Midnight Protocol');
  await page.locator('#dialogClose').click();

  await page.locator('.sidebar-link[data-view="calendar"]').click();
  await expect(page.locator('#calendarPanel')).toBeVisible();
  await page.locator('.sidebar-link[data-view="catalog-home"]').click();
  await expect(page.locator('#catalogSurface')).toBeVisible();
  expect(errors).toEqual([]);
});

test('settings persist density and last view across reloads', async ({ page }) => {
  const errors = await boot(page, configuredStorage());
  await page.locator('#openSettings').click();
  await expect(page.locator('#settingsDialog')).toHaveAttribute('open', '');
  await page.locator('#prefDensity').selectOption('compact');
  await expect(page.locator('body')).toHaveAttribute('data-density', 'compact');
  await page.locator('#settingsClose').click();

  await page.locator('.sidebar-link[data-view="upcoming"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-streamradar-view', 'upcoming');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toHaveAttribute('data-density', 'compact');
  await expect(page.locator('body')).toHaveAttribute('data-streamradar-view', 'upcoming');
  expect(errors).toEqual([]);
});

test('backup excludes the token and restore normalizes personal data', async ({ page }) => {
  const errors = await boot(page, configuredStorage());
  await page.evaluate(token => localStorage.setItem('streamradar-tmdb-token', token), 'super-secret-test-token');
  await page.locator('#openSettings').click();
  await page.locator('[data-settings-tab="data"]').click();

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#exportStreamRadarBackup').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^streamradar-backup-.*\.json$/);
  const backupText = await readFile(await download.path(), 'utf8');
  expect(backupText).not.toContain('super-secret-test-token');
  const exported = JSON.parse(backupText);
  expect(exported.app).toBe('StreamRadar');
  expect(exported).not.toHaveProperty('token');

  const restore = {
    app: 'StreamRadar', format: 2, version: '0.4.0',
    personalization: { density: 'compact', mediaPreferences: ['movie'], originalsBoost: false, showEpisodesHome: false, horizonDays: 14, rememberLastView: false, defaultView: 'catalog-home' },
    preferredProviders: [], preferredProvidersOnly: false, watchlist: ['demo-1']
  };
  await page.locator('#streamRadarBackupFile').setInputFiles({
    name: 'streamradar-test-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(restore))
  });
  await expect(page.locator('.radar-toast').filter({ hasText: 'Backup erfolgreich wiederhergestellt' })).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-density', 'compact');
  const restored = await page.evaluate(({ tokenKey, watchlistKey }) => ({
    token: localStorage.getItem(tokenKey),
    watchlist: JSON.parse(localStorage.getItem(watchlistKey) || '[]')
  }), { tokenKey: TOKEN_KEY, watchlistKey: WATCHLIST_KEY });
  expect(restored.token).toBe('super-secret-test-token');
  expect(restored.watchlist).toContain('demo-1');
  expect(errors).toEqual([]);
});

test('corrupt local personalization data does not crash the app', async ({ page }) => {
  const errors = await boot(page, configuredStorage({
    [CONFIG_KEY]: '{broken-json',
    [PROVIDERS_KEY]: 'not-json',
    [WATCHLIST_KEY]: '[broken'
  }));
  await expect(page.locator('.app-sidebar')).toBeVisible();
  await expect(page.locator('#catalogSurface')).toBeVisible();
  const version = await page.evaluate(() => window.StreamRadarPersonalization?.VERSION);
  expect(version).toBe('0.4.0');
  expect(errors).toEqual([]);
});


test('catalog exposes movies series and a provider-first Netflix experience', async ({ page }) => {
  const errors = await boot(page, configuredStorage());
  await expect(page.locator('body')).toHaveAttribute('data-streamradar-view', 'catalog-home');
  await expect(page.locator('#catalogSurface')).toBeVisible();
  await expect(page.locator('#catalogSurface')).toContainText('Alles, was du');
  await page.locator('[data-catalog-action="catalog-all"]').first().click();
  await expect(page.locator('body')).toHaveAttribute('data-streamradar-view', 'catalog-all');
  await expect(page.locator('#catalogSurface')).toContainText('Gesamtes Streaming-Angebot');

  await page.locator('.sidebar-link[data-view="catalog-movies"]').click();
  await expect(page.locator('#catalogSurface')).toContainText('Filme aus deinen Streaming-Diensten');
  await expect(page.locator('.catalog-card').filter({ hasText: 'Midnight Protocol' })).toBeVisible();
  await expect(page.locator('.catalog-card').filter({ hasText: 'Terminal Zero' })).toHaveCount(0);

  await page.locator('[data-provider-name="Netflix"]').click();
  await expect(page.locator('.catalog-provider-hero')).toContainText('Netflix');
  await expect(page.locator('#catalogSurface')).toContainText('JETZT AUF NETFLIX');
  expect(errors).toEqual([]);
});

test('release radar still contains movie events and calendar coverage', async ({ page }) => {
  const errors = await boot(page, configuredStorage());
  await page.locator('.sidebar-link[data-view="discover"]').click();
  await page.locator('[data-summary-view="movies"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-streamradar-view', 'movies');
  await expect(page.locator('.release-card').filter({ hasText: 'Red Horizon' })).toBeVisible();
  await expect(page.locator('.release-card').filter({ hasText: 'Neon District' })).toHaveCount(0);
  await page.locator('.sidebar-link[data-view="calendar"]').click();
  await page.locator('[data-calendar-mode="90"]').click();
  await expect(page.locator('#calendarStats')).toContainText('Filme');
  await expect(page.locator('.timeline-event').filter({ hasText: 'Red Horizon' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('update center detects a newer published MSI', async ({ page }) => {
  const published = '# StreamRadar Downloads\n\n### StreamRadar v0.4.1 – Windows x64\n\n- Version: `0.4.1`\n';
  const errors = await boot(page, configuredStorage(), { publishedDownloads: published });
  await page.locator('#openSettings').click();
  await expect(page.locator('[data-settings-tab="updates"]')).toBeVisible();
  await page.locator('[data-settings-tab="updates"]').click();
  await page.locator('#checkStreamRadarUpdate').click();
  await expect(page.locator('#settingsUpdatePage')).toContainText('Update v0.4.1 verfügbar');
  await expect(page.locator('#downloadStreamRadarUpdate')).toContainText('v0.4.1 MSI herunterladen');
  const state = await page.evaluate(() => window.StreamRadarDesktop.getUpdateState());
  expect(state.status).toBe('available');
  expect(state.latest).toBe('0.4.1');
  expect(errors).toEqual([]);
});

