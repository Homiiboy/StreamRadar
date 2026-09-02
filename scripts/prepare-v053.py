from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def write(path, text):
    (ROOT / path).write_text(text, encoding='utf-8')


def replace(path, old, new, count=1):
    text = read(path)
    if old not in text:
        raise SystemExit(f'Missing marker in {path}: {old[:120]!r}')
    text = text.replace(old, new, count)
    write(path, text)


# Release surface: v0.5.2 -> v0.5.3.
write('VERSION', '0.5.3\n')
replace('package.json', '"version": "0.5.2"', '"version": "0.5.3"')
package_lock = read('package-lock.json')
if package_lock.count('"version": "0.5.2"') < 2:
    raise SystemExit('Expected two v0.5.2 version fields in package-lock.json')
write('package-lock.json', package_lock.replace('"version": "0.5.2"', '"version": "0.5.3"', 2))
replace('src-tauri/Cargo.toml', 'version = "0.5.2"', 'version = "0.5.3"')
replace('src-tauri/tauri.conf.json', '"version": "0.5.2"', '"version": "0.5.3"')
replace('js/themes.js', '/* StreamRadar v0.5.2 — selectable visual themes */', '/* StreamRadar v0.5.3 — selectable visual themes + poster geometry fix */')
replace('js/themes.js', "const VERSION = '0.5.2';", "const VERSION = '0.5.3';")

# Poster fix: the v0.5.0 clean layout moved the provider band to the bottom,
# but left the older top:10px rule active. With top + bottom set and no fixed
# height the provider band stretched over nearly the entire artwork.
styles = read('styles.css')
old_band = '.catalog-provider-band{left:9px!important;right:9px!important;bottom:9px!important;min-height:38px!important;'
new_band = '.catalog-provider-band{left:9px!important;right:9px!important;top:auto!important;bottom:9px!important;min-height:38px!important;'
if old_band not in styles:
    raise SystemExit('Provider band clean-layout marker missing')
styles = styles.replace(old_band, new_band, 1)

old_save = '.catalog-save{top:9px!important;right:9px!important;background:'
new_save = '.catalog-save{top:9px!important;right:9px!important;bottom:auto!important;background:'
if old_save not in styles:
    raise SystemExit('Catalog save marker missing')
styles = styles.replace(old_save, new_save, 1)

old_rating = '.catalog-rating{top:9px!important;left:9px!important;background:'
new_rating = '.catalog-rating{top:9px!important;left:9px!important;bottom:auto!important;background:'
if old_rating not in styles:
    raise SystemExit('Catalog rating marker missing')
styles = styles.replace(old_rating, new_rating, 1)
styles += '\n\n/* StreamRadar v0.5.3 — poster overlay geometry regression fix */\n'
write('styles.css', styles)

# Browser regression: provider band must remain a compact bottom overlay instead
# of stretching from the old top position to the new bottom position.
tests = read('tests/e2e/themes.spec.js')
regression = r'''

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
'''
if 'provider band stays compact and never covers the poster artwork' in tests:
    raise SystemExit('Poster regression test already present')
write('tests/e2e/themes.spec.js', tests.rstrip() + regression + '\n')

# Changelog.
changelog = read('CHANGELOG.md')
marker = 'Alle relevanten Änderungen an StreamRadar werden hier ab der ersten Version nach Semantic Versioning dokumentiert.\n'
entry = '''\n## [0.5.3] - 2026-09-02\n\n### Fixed\n- Katalog-Poster werden wieder vollständig sichtbar dargestellt.\n- Das Anbieter-Band (`JETZT AUF …`) setzt die alte obere Position explizit zurück und bleibt als kompakte Leiste am unteren Posterrand.\n- Merkliste- und Bewertungs-Badges erhalten eindeutige Positionsachsen, damit alte `bottom`-Regeln keine unerwartete Streckung verursachen.\n\n### Quality\n- Neuer Playwright-Regressionstest misst die reale Anbieter-Band-Höhe relativ zum Poster und verhindert ein erneutes Vollflächen-Overlay.\n- Release-, Tauri-, Rust-, Package- und MSI-Konfiguration auf `0.5.3` angehoben.\n'''
if marker not in changelog:
    raise SystemExit('Changelog intro marker missing')
write('CHANGELOG.md', changelog.replace(marker, marker + entry, 1))

# README current release and release history.
readme = read('README.md')
readme = readme.replace('## Aktuelle Version: v0.5.2', '## Aktuelle Version: v0.5.3', 1)
old_intro = '**v0.5.2 – Themes & Visual Personalization** erweitert das in v0.5.1 eingeführte Theme-System auf sieben deutlich unterschiedliche Designs. Die Oberfläche kann direkt in den Einstellungen umgeschaltet werden; die Auswahl bleibt lokal gespeichert.'
new_intro = '**v0.5.3 – Poster Visibility Fix** behebt einen Layoutfehler der großen Katalog-Poster: Das Anbieter-Band bleibt wieder kompakt am unteren Bildrand, sodass das Artwork vollständig sichtbar ist. Die sieben Designs aus v0.5.2 bleiben unverändert erhalten.'
if old_intro not in readme:
    raise SystemExit('README current release intro marker missing')
readme = readme.replace(old_intro, new_intro, 1)
start = readme.index('### Neu in v0.5.2')
end = readme.index('\n## Download', start)
new_notes = '''### Neu in v0.5.3\n\n- Poster-Artwork wird nicht mehr durch ein gestrecktes Anbieter-Overlay verdeckt\n- `JETZT AUF …` sitzt als kompakte Provider-Leiste am unteren Posterrand\n- Rating und Merkliste-Button verwenden eindeutige absolute Positionierung\n- automatischer Browser-Regressionstest prüft die reale Overlay-Höhe\n- alle sieben Designs aus v0.5.2 bleiben erhalten\n- Release-/Build-Konfiguration auf v0.5.3 aktualisiert\n'''
readme = readme[:start] + new_notes + readme[end:]
readme = readme.replace('[**StreamRadar v0.5.2 als MSI herunterladen**](downloads/StreamRadar_0.5.2_x64_de-DE.msi)', '[**StreamRadar v0.5.3 als MSI herunterladen**](downloads/StreamRadar_0.5.3_x64_de-DE.msi)', 1)
readme = readme.replace('Zusätzlich ist v0.5.2 inklusive MSI im nativen [GitHub-Releases-Bereich](../../releases) veröffentlicht.', 'Zusätzlich werden stabile Windows-Versionen im nativen [GitHub-Releases-Bereich](../../releases) dokumentiert.', 1)
release_row = '| **v0.5.2** | Themes & Visual Personalization | [MSI](downloads/StreamRadar_0.5.2_x64_de-DE.msi) |'
if release_row not in readme:
    raise SystemExit('README release table marker missing')
readme = readme.replace(release_row, '| **v0.5.3** | Poster Visibility Fix | [MSI](downloads/StreamRadar_0.5.3_x64_de-DE.msi) |\n' + release_row, 1)
readme = readme.replace('Alle **22 Versionen von v0.0.1 bis v0.5.2**', 'Alle bisherigen Versionen von **v0.0.1 bis v0.5.3**', 1)
write('README.md', readme)

print('Prepared StreamRadar v0.5.3 poster visibility fix.')
