from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
VERSION = '0.2.1'
RUNTIME_JS = [
    'original-overrides.js', 'tmdb.js', 'tvmaze.js', 'app.js', 'calendar.js',
    'stability.js', 'polish.js', 'desktop.js', 'ui.js'
]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def write(path, text):
    (ROOT / path).parent.mkdir(parents=True, exist_ok=True)
    (ROOT / path).write_text(text.rstrip() + '\n', encoding='utf-8')


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'Missing expected text for {label}: {old!r}')
    return text.replace(old, new, 1)


# Version surfaces.
write('VERSION', VERSION)

package = json.loads(read('package.json'))
package['version'] = VERSION
package.setdefault('scripts', {})['test:e2e'] = 'playwright test --config=tests/playwright.config.js'
package.setdefault('devDependencies', {})['@playwright/test'] = '1.55.0'
write('package.json', json.dumps(package, indent=2, ensure_ascii=False))

tauri = json.loads(read('src-tauri/tauri.conf.json'))
tauri['version'] = VERSION
write('src-tauri/tauri.conf.json', json.dumps(tauri, indent=2, ensure_ascii=False))

cargo = read('src-tauri/Cargo.toml')
cargo = replace_once(cargo, 'version = "0.2.0"', 'version = "0.2.1"', 'Cargo version')
write('src-tauri/Cargo.toml', cargo)

app = read('js/app.js')
app = replace_once(app, "const APP_VERSION = '0.2.0';", "const APP_VERSION = '0.2.1';", 'app version')
write('js/app.js', app)

desktop = read('js/desktop.js')
desktop = replace_once(desktop, "const VERSION = '0.2.0';", "const VERSION = '0.2.1';", 'desktop version')
write('js/desktop.js', desktop)

ui = read('js/ui.js')
ui = replace_once(ui, "const VERSION = '0.2.0';", "const VERSION = '0.2.1';", 'personalization version')
ui = ui.replace('V0.2.0 · PERSONALIZATION', 'V0.2.1 · PERSONALIZATION')
write('js/ui.js', ui)

# Runtime paths + visible version text.
index = read('index.html')
for name in RUNTIME_JS:
    index = index.replace(f'src="{name}"', f'src="js/{name}"')
index = index.replace('V0.2.0', 'V0.2.1').replace('v0.2.0', 'v0.2.1').replace('Version 0.2.0', 'Version 0.2.1')
index = index.replace('<strong>v0.2.1:</strong> Personalization & Settings mit Onboarding, Einstellungs-Center, persönlichem Home-Feed, Anbieter-/Inhaltspräferenzen und Backup/Restore.', '<strong>v0.2.1:</strong> Automated QA & Repository Hardening mit Browser-Smoke-Tests und aufgeräumter JavaScript-Struktur.')
write('index.html', index)

# Desktop packer preserves the js/ directory.
build = read('scripts/build-desktop.mjs')
old_files = """  'index.html',\n  'styles.css',\n  'original-overrides.js',\n  'tmdb.js',\n  'tvmaze.js',\n  'app.js',\n  'calendar.js',\n  'stability.js',\n  'polish.js',\n  'desktop.js',\n  'ui.js'"""
new_files = """  'index.html',\n  'styles.css',\n  'js/original-overrides.js',\n  'js/tmdb.js',\n  'js/tvmaze.js',\n  'js/app.js',\n  'js/calendar.js',\n  'js/stability.js',\n  'js/polish.js',\n  'js/desktop.js',\n  'js/ui.js'"""
build = replace_once(build, old_files, new_files, 'desktop runtime list')
write('scripts/build-desktop.mjs', build)

# Repository documentation.
readme = read('README.md')
marker = '## Funktionsumfang'
if marker not in readme:
    raise SystemExit('README structure changed')
tail = marker + readme.split(marker, 1)[1]
tail = tail.replace('downloads/StreamRadar_0.2.0_x64_de-DE.msi', 'downloads/StreamRadar_0.2.1_x64_de-DE.msi')
tail = tail.replace('Für v0.2.1 und spätere Releases gilt:', 'Für v0.2.2 und spätere Releases gilt:')
tail = tail.replace('Die aktive UI-Logik wird direkt in `ui.js` weiterentwickelt.', 'Die aktive UI-Logik wird direkt in `js/ui.js` weiterentwickelt.')
tail = tail.replace('`index.html` und der Desktop-Build laden weiterhin ausschließlich `styles.css` und `ui.js`.', '`index.html` und der Desktop-Build laden weiterhin ausschließlich `styles.css` sowie die Runtime-Dateien unter `js/`.')
old_tree = """├── index.html\n├── styles.css\n├── ui.js\n├── original-overrides.js\n├── tmdb.js\n├── tvmaze.js\n├── app.js\n├── calendar.js\n├── stability.js\n├── polish.js\n├── desktop.js\n├── package.json"""
new_tree = """├── index.html\n├── styles.css\n├── js/\n│   ├── original-overrides.js\n│   ├── tmdb.js\n│   ├── tvmaze.js\n│   ├── app.js\n│   ├── calendar.js\n│   ├── stability.js\n│   ├── polish.js\n│   ├── desktop.js\n│   └── ui.js\n├── tests/\n│   ├── playwright.config.js\n│   └── e2e/streamradar.spec.js\n├── package.json"""
if old_tree in tail:
    tail = tail.replace(old_tree, new_tree)

prefix = f"""# StreamRadar

StreamRadar ist ein persönlicher Streaming-Release-Radar für Filme, Serien, Anime, Originals, neue Staffeln und Episoden – optimiert für Österreich.

## Aktuelle Version: v{VERSION}

**v{VERSION} – Automated QA & Repository Hardening** ergänzt echte Browser-Smoke-Tests und räumt die Runtime-Struktur auf, damit weitere Desktop-Features auf einer besser abgesicherten Basis entstehen.

## Download

### Windows x64

[**StreamRadar v{VERSION} als MSI herunterladen**](downloads/StreamRadar_0.2.1_x64_de-DE.msi)

Weitere Builds und die SHA-256-Prüfsumme liegen im Ordner [`downloads/`](downloads/).

Der Installer ist für die persönliche Nutzung weiterhin nicht code-signiert. Windows kann deshalb beim Öffnen einen Hinweis auf einen unbekannten Herausgeber anzeigen.

## Neu in v{VERSION}

- Runtime-JavaScript vollständig unter `js/`; im Repository-Root liegt keine aktive `.js`-Datei mehr
- `index.html` und Desktop-Packaging verwenden dieselbe feste `js/`-Struktur
- Playwright-basierte Chromium-Smoke-Tests für First Run, Onboarding, Suche/Details, Einstellungen, Persistenz und Backup/Restore
- Regressionstest für beschädigte lokale Einstellungen und ungültige JSON-Werte
- automatischer Check, dass Archive aus `OldCss/` und `OldUi/` nie im Desktop-Paket landen
- stärkere CI-Gates vor jedem Merge; Windows-MSI-Build bleibt ein unabhängiger Release-Gate
- zentraler App-/Desktop-Versionsstand `{VERSION}`

"""
write('README.md', prefix + tail)

changelog = read('CHANGELOG.md')
entry = f"""## [{VERSION}] - 2026-09-01

### Added
- Playwright-/Chromium-Smoke-Tests für First-Run-Onboarding, globale Suche, Premium-Details, Settings-Persistenz und Backup/Restore.
- Regressionstest für beschädigte lokale Personalisierungsdaten.
- `tests/`-Struktur mit eigener Playwright-Konfiguration.
- `js/README.md` als Dokumentation der Runtime-Ladereihenfolge.

### Changed
- Alle aktiven Runtime-JavaScript-Dateien wurden aus dem Repository-Root nach `js/` verschoben.
- `index.html` und Desktop-Packaging laden Runtime-JavaScript ausschließlich aus `js/`.
- Repository-Hygiene-Checks verhindern künftig aktive `.js`-Dateien im Root.
- App-, Tauri- und MSI-Version wurden auf `{VERSION}` angehoben.

### Quality
- Browser-Smoke-Tests werden im PR zusätzlich zu Syntax-/Strukturprüfung und echtem Windows-MSI-Build ausgeführt.
- Desktop-Preflight prüft die `dist/js/`-Struktur und stellt sicher, dass `OldCss/` und `OldUi/` nicht ausgeliefert werden.

"""
insert_at = changelog.find('## [0.2.0]')
if insert_at < 0:
    raise SystemExit('CHANGELOG insertion point missing')
changelog = changelog[:insert_at] + entry + changelog[insert_at:]
write('CHANGELOG.md', changelog)

# Runtime folder documentation.
write('js/README.md', """# StreamRadar Runtime JavaScript

Dieser Ordner enthält die aktiven Browser-/Desktop-Runtime-Dateien.

Die Ladereihenfolge in `index.html` ist absichtlich fest:

1. `original-overrides.js`
2. `tmdb.js`
3. `tvmaze.js`
4. `app.js`
5. `calendar.js`
6. `stability.js`
7. `polish.js`
8. `desktop.js`
9. `ui.js`

`OldUi/` bleibt ausschließlich Archiv und wird nicht zur Laufzeit oder im Tauri-Desktop-Paket geladen.
""")

# Browser QA configuration.
write('tests/playwright.config.js', """import { defineConfig } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export default defineConfig({
  testDir: './e2e',
  timeout: 20_000,
  expect: { timeout: 6_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['line'], ['html', { outputFolder: resolve(root, 'playwright-report'), open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1',
    cwd: root,
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 10_000
  }
});
""")

write('tests/e2e/streamradar.spec.js', """import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const ONBOARDING_KEY = 'streamradar-onboarding-v2-complete';
const CONFIG_KEY = 'streamradar-personalization-v2';
const PROVIDERS_KEY = 'streamradar-preferred-providers';
const TOKEN_KEY = 'streamradar-tmdb-token';
const WATCHLIST_KEY = 'streamradar-watchlist';

async function boot(page, storage = {}) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route(/^https?:\\/\\/(?!127\\.0\\.0\\.1:4173)/, route => route.abort());
  await page.addInitScript(entries => {
    try {
      localStorage.clear();
      Object.entries(entries).forEach(([key, value]) => localStorage.setItem(key, value));
    } catch {}
  }, storage);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.StreamRadarPersonalization));
  return errors;
}

function configuredStorage(extra = {}) {
  return { [ONBOARDING_KEY]: 'true', ...extra };
}

test('first run can finish with no providers and stays completed', async ({ page }) => {
  const errors = await boot(page);
  await expect(page.locator('#onboardingOverlay')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Dein Radar/i })).toBeVisible();

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
  await page.locator('#searchInput').fill('Neon District');
  const result = page.locator('.global-search-result').filter({ hasText: 'Neon District' }).first();
  await expect(result).toBeVisible();
  await result.click();
  await expect(page.locator('#detailDialog')).toHaveAttribute('open', '');
  await expect(page.locator('#detailDialog h2')).toContainText('Neon District');
  await page.locator('#dialogClose').click();

  await page.locator('.sidebar-link[data-view="calendar"]').click();
  await expect(page.locator('#calendarPanel')).toBeVisible();
  await page.locator('.sidebar-link[data-view="discover"]').click();
  await expect(page.locator('#homeDashboard')).toBeVisible();
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
  expect(download.suggestedFilename()).toMatch(/^streamradar-backup-.*\\.json$/);
  const backupText = await readFile(await download.path(), 'utf8');
  expect(backupText).not.toContain('super-secret-test-token');
  const exported = JSON.parse(backupText);
  expect(exported.app).toBe('StreamRadar');
  expect(exported).not.toHaveProperty('token');

  const restore = {
    app: 'StreamRadar', format: 2, version: '0.2.1',
    personalization: { density: 'compact', mediaPreferences: ['movie'], originalsBoost: false, showEpisodesHome: false, horizonDays: 14, rememberLastView: false, defaultView: 'discover' },
    preferredProviders: [], preferredProvidersOnly: false, watchlist: ['demo-1']
  };
  await page.locator('#streamRadarBackupFile').setInputFiles({
    name: 'streamradar-test-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(restore))
  });
  await expect(page.locator('.radar-toast')).toContainText('Backup erfolgreich wiederhergestellt');
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
  await expect(page.locator('#releaseGrid')).toBeVisible();
  const version = await page.evaluate(() => window.StreamRadarPersonalization?.VERSION);
  expect(version).toBe('0.2.1');
  expect(errors).toEqual([]);
});
""")

# Ignore browser-test and dependency outputs.
gitignore = read('.gitignore')
for entry in ['node_modules/', 'playwright-report/', 'test-results/']:
    if entry not in gitignore.splitlines():
        gitignore += f'\n{entry}'
write('.gitignore', gitignore)

print('Prepared StreamRadar v0.2.1 QA hardening release.')
