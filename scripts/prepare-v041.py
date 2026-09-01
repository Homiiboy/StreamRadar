from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def write(path, text):
    (ROOT / path).write_text(text, encoding='utf-8')


def replace(path, old, new, count=None):
    text = read(path)
    if old not in text:
        raise SystemExit(f'Missing marker in {path}: {old!r}')
    text = text.replace(old, new, -1 if count is None else count)
    write(path, text)


# Version surfaces
write('VERSION', '0.4.1\n')
replace('package.json', '"version": "0.4.0"', '"version": "0.4.1"')
replace('package-lock.json', '"version": "0.4.0"', '"version": "0.4.1"')
replace('src-tauri/Cargo.toml', 'version = "0.4.0"', 'version = "0.4.1"', 1)
replace('src-tauri/tauri.conf.json', '"version": "0.4.0"', '"version": "0.4.1"', 1)
replace('js/app.js', "const APP_VERSION = '0.4.0';", "const APP_VERSION = '0.4.1';", 1)
replace('js/polish.js', "const VERSION = '0.4.0';", "const VERSION = '0.4.1';", 1)
replace('js/desktop.js', "const VERSION = '0.4.0';", "const VERSION = '0.4.1';", 1)
replace('js/ui.js', "const VERSION = '0.4.0';", "const VERSION = '0.4.1';", 1)
replace('js/catalog.js', "const VERSION = '0.4.0';", "const VERSION = '0.4.1';", 1)
replace('index.html', '0.4.0', '0.4.1')

# Provider sidebar: remove the six-provider cap and guarantee Crunchyroll is present
# whenever TMDB reports it as available, even if it is not in the preferred-provider subset.
catalog = read('js/catalog.js')
old = '''  function buildProviderNav() {\n    const root = $('#providerNav');\n    if (!root) return;\n    const preferred = preferredAvailableProviders().slice(0,6);\n    root.innerHTML = preferred.map(provider => `<button class="nav-link sidebar-link provider-nav-link" data-view="provider-${slug(provider.name)}" data-provider-name="${escapeHTML(provider.name)}"><span class="provider-nav-logo">${providerLogo(provider,'w92')}</span><span>${escapeHTML(provider.name)}</span></button>`).join('');\n    root.querySelectorAll('[data-provider-name]').forEach(button => button.onclick = () => setView(button.dataset.view));\n  }'''
new = '''  function sidebarProviders() {\n    const providers = [...preferredAvailableProviders()];\n    const crunchyroll = catalogState.providerMap.find(provider => provider.name === 'Crunchyroll' && provider.available);\n    if (crunchyroll && !providers.some(provider => provider.name === 'Crunchyroll')) providers.push(crunchyroll);\n    return providers;\n  }\n\n  function buildProviderNav() {\n    const root = $('#providerNav');\n    if (!root) return;\n    const providers = sidebarProviders();\n    root.innerHTML = providers.map(provider => `<button class="nav-link sidebar-link provider-nav-link" data-view="provider-${slug(provider.name)}" data-provider-name="${escapeHTML(provider.name)}"><span class="provider-nav-logo">${providerLogo(provider,'w92')}</span><span>${escapeHTML(provider.name)}</span></button>`).join('');\n    root.querySelectorAll('[data-provider-name]').forEach(button => button.onclick = () => setView(button.dataset.view));\n  }'''
if old not in catalog:
    raise SystemExit('Catalog provider navigation marker not found')
catalog = catalog.replace(old, new, 1)
write('js/catalog.js', catalog)

# Sidebar scrolling. App sidebar is fixed-height; explicit overflow makes every section reachable.
styles = read('styles.css')
marker = '/* StreamRadar v0.4.1 — Provider Sidebar Fixes */'
if marker not in styles:
    styles = styles.rstrip() + '''\n\n/* StreamRadar v0.4.1 — Provider Sidebar Fixes */\n.app-sidebar{overflow-y:auto;overflow-x:hidden;overscroll-behavior-y:contain;scrollbar-gutter:stable;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.18) transparent}\n.app-sidebar::-webkit-scrollbar{width:8px}.app-sidebar::-webkit-scrollbar-track{background:transparent}.app-sidebar::-webkit-scrollbar-thumb{background:rgba(255,255,255,.16);border-radius:999px;border:2px solid transparent;background-clip:padding-box}.app-sidebar::-webkit-scrollbar-thumb:hover{background:rgba(98,247,199,.32);border:2px solid transparent;background-clip:padding-box}\n.app-sidebar .sidebar-spacer{flex:1 0 14px;min-height:14px}\n'''
write('styles.css', styles)

# README current release section.
readme = read('README.md')
start = readme.index('## Aktuelle Version:')
end = readme.index('## Funktionsumfang', start)
release_block = '''## Aktuelle Version: v0.4.1\n\n**v0.4.1 – Provider Sidebar Fixes** verbessert die Anbieter-Navigation des v0.4.0-Katalogs: Crunchyroll ist jetzt zuverlässig im Anbieterblock erreichbar und die linke Sidebar lässt sich vollständig vertikal scrollen.\n\n## Download\n\n### Windows x64\n\n[**StreamRadar v0.4.1 als MSI herunterladen**](downloads/StreamRadar_0.4.1_x64_de-DE.msi)\n\nWeitere Builds und die SHA-256-Prüfsumme liegen im Ordner [`downloads/`](downloads/).\n\nDer Installer ist für die persönliche Nutzung weiterhin nicht code-signiert. Windows kann deshalb beim Öffnen einen Hinweis auf einen unbekannten Herausgeber anzeigen.\n\n## Neu in v0.4.1\n\n- **Crunchyroll** wird in der Anbieter-Sidebar zusätzlich aufgenommen, sobald TMDB den Dienst für Österreich als verfügbar meldet\n- die bisherige Begrenzung der Anbieter-Sidebar auf sechs Einträge ist entfernt\n- die komplette linke Sidebar ist vertikal scrollbar und bleibt damit auch bei kleinen Fensterhöhen vollständig bedienbar\n- sichtbare Scrollbar ist dezent an das StreamRadar-Design angepasst\n- Browser-Regressionstest prüft Crunchyroll und echtes vertikales Sidebar-Scrolling\n\n'''
readme = readme[:start] + release_block + readme[end:]
readme = readme.replace('downloads/StreamRadar_0.4.0_x64_de-DE.msi', 'downloads/StreamRadar_0.4.1_x64_de-DE.msi')
write('README.md', readme)

# Changelog entry.
changelog = read('CHANGELOG.md')
entry = '''## [0.4.1] - 2026-09-01\n\n### Added\n- **Crunchyroll** wird im Anbieterblock des Streaming-Katalogs zuverlässig ergänzt, wenn der Dienst in Österreich verfügbar ist.\n- Browser-Regressionstest für Crunchyroll in der Provider-Navigation und echtes vertikales Sidebar-Scrolling.\n\n### Changed\n- Anbieter-Navigation ist nicht mehr auf sechs Sidebar-Einträge begrenzt.\n- Linke Desktop-/Off-Canvas-Sidebar scrollt vertikal und nutzt eine dezente, zum Theme passende Scrollbar.\n- App-, Tauri-, Desktop- und MSI-Version auf `0.4.1` angehoben.\n\n'''
if '## [0.4.1]' not in changelog:
    insert_at = changelog.index('## [0.4.0]')
    changelog = changelog[:insert_at] + entry + changelog[insert_at:]
write('CHANGELOG.md', changelog)

# E2E regression for the requested patch + update existing version expectations.
tests = read('tests/e2e/streamradar.spec.js').replace("version: '0.4.0'", "version: '0.4.1'").replace("expect(version).toBe('0.4.0');", "expect(version).toBe('0.4.1');")
tests = tests.replace("const published = '# StreamRadar Downloads\\n\\n### StreamRadar v0.4.1 – Windows x64\\n\\n- Version: `0.4.1`\\n';", "const published = '# StreamRadar Downloads\\n\\n### StreamRadar v0.4.2 – Windows x64\\n\\n- Version: `0.4.2`\\n';")
tests = tests.replace("Update v0.4.1 verfügbar", "Update v0.4.2 verfügbar").replace("v0.4.1 MSI herunterladen", "v0.4.2 MSI herunterladen").replace("expect(state.latest).toBe('0.4.1');", "expect(state.latest).toBe('0.4.2');")
new_test = '''\n\ntest('provider sidebar includes Crunchyroll and scrolls vertically', async ({ page }) => {\n  const errors = await boot(page, configuredStorage());\n  await page.setViewportSize({ width: 1200, height: 560 });\n  await expect(page.locator('[data-provider-name="Crunchyroll"]')).toHaveCount(1);\n  const sidebar = await page.locator('.app-sidebar').evaluate(element => {\n    const style = getComputedStyle(element);\n    const before = element.scrollTop;\n    element.scrollTop = element.scrollHeight;\n    return {\n      overflowY: style.overflowY,\n      scrollable: element.scrollHeight > element.clientHeight,\n      moved: element.scrollTop > before\n    };\n  });\n  expect(sidebar.overflowY).toBe('auto');\n  expect(sidebar.scrollable).toBe(true);\n  expect(sidebar.moved).toBe(true);\n  expect(errors).toEqual([]);\n});\n'''
if 'provider sidebar includes Crunchyroll and scrolls vertically' not in tests:
    anchor = "\ntest('release radar still contains movie events and calendar coverage'"
    tests = tests.replace(anchor, new_test + anchor, 1)
write('tests/e2e/streamradar.spec.js', tests)

# Permanent CI version bump + patch-specific checks.
validate = read('.github/workflows/validate.yml').replace('0.4.0', '0.4.1')
validate = validate.replace('StreamRadar v0.4.1 — Streaming Catalog & Provider Experience', 'StreamRadar v0.4.1 — Provider Sidebar Fixes')
needle = "          grep -q 'JETZT AUF' js/catalog.js\n"
extra = "          grep -q 'sidebarProviders' js/catalog.js\n          grep -q \"provider.name === 'Crunchyroll'\" js/catalog.js\n          grep -q 'overflow-y:auto' styles.css\n          grep -q 'provider sidebar includes Crunchyroll and scrolls vertically' tests/e2e/streamradar.spec.js\n"
if extra not in validate:
    validate = validate.replace(needle, needle + extra, 1)
qa_needle = "          grep -q 'catalog exposes movies series and a provider-first Netflix experience' tests/e2e/streamradar.spec.js\n"
qa_extra = "          grep -q 'provider sidebar includes Crunchyroll and scrolls vertically' tests/e2e/streamradar.spec.js\n"
if qa_extra not in validate[validate.index('Check automated browser QA surface'):]:
    validate = validate.replace(qa_needle, qa_needle + qa_extra, 1)
write('.github/workflows/validate.yml', validate)

# Windows build / repository publisher for v0.4.1, retaining v0.4.0 as previous version.
build = read('.github/workflows/build-msi.yml').replace('0.4.0', '0.4.1')
build = build.replace('- [StreamRadar v0.3.0 – Windows x64](StreamRadar_0.3.0_x64_de-DE.msi)', '- [StreamRadar v0.4.0 – Windows x64](StreamRadar_0.4.0_x64_de-DE.msi)')
write('.github/workflows/build-msi.yml', build)

print('StreamRadar v0.4.1 provider/sidebar patch applied.')
