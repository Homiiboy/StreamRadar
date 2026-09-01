from pathlib import Path
import json
import os
import re

ROOT = Path(__file__).resolve().parents[1]

def read(path):
    return (ROOT / path).read_text(encoding='utf-8')

def write(path, text):
    (ROOT / path).write_text(text, encoding='utf-8')

# 1) Consolidate every historical visual patch through v0.1.1 into the core stylesheet.
legacy = [
    'OldCss/v003.css','OldCss/v004.css','OldCss/v005.css','OldCss/v006.css','OldCss/v007.css',
    'OldCss/v008.css','OldCss/v009.css','OldCss/v0010.css','OldCss/v0100.css','v011.css'
]
styles = read('styles.css')
marker = '/* === StreamRadar consolidated visual baseline through v0.1.1 === */'
if marker not in styles:
    chunks = [styles.rstrip(), '', marker]
    for path in legacy:
        chunks += ['', f'/* archived patch: {path} */', read(path).strip()]
    write('styles.css', '\n'.join(chunks) + '\n')

old_dir = ROOT / 'OldCss'
old_dir.mkdir(exist_ok=True)
source = ROOT / 'v011.css'
target = old_dir / 'v011.css'
if source.exists() and not target.exists():
    os.replace(source, target)

write('OldCss/README.md', '''# OldCss\n\nHier liegen die historischen versionsbezogenen CSS-Patches von StreamRadar.\n\nRegel: Die CSS-Datei der aktuellen Version bleibt im Repository-Root. Sobald eine neue Version erscheint, wird die bisher aktuelle Versions-CSS in diesen Ordner verschoben. `styles.css` ist die konsolidierte aktive Basis und lädt die Archive nicht mehr zur Laufzeit.\n\nAktuell archiviert: v0.0.3 bis v0.1.1. Die aktuelle `v012.css` für v0.1.2 bleibt im Root.\n''')

# 2) Runtime HTML: only core + current patch are loaded.
index = read('index.html')
index = re.sub(r'\s*<link rel="stylesheet" href="OldCss/[^"]+" />', '', index)
index = index.replace('<link rel="stylesheet" href="v011.css" />', '<link rel="stylesheet" href="v012.css" />')
index = index.replace('0.1.1', '0.1.2')
if 'ui012.js' not in index:
    index = index.replace('<script src="ui011.js" defer></script>', '<script src="ui011.js" defer></script><script src="ui012.js" defer></script>')
write('index.html', index)

# 3) Desktop packager: archive CSS is no longer shipped as runtime dependencies.
build = read('scripts/build-desktop.mjs')
new_files = '''const files = [
  'index.html',
  'styles.css',
  'v012.css',
  'original-overrides.js',
  'tmdb.js',
  'tvmaze.js',
  'app.js',
  'calendar.js',
  'stability.js',
  'polish.js',
  'desktop.js',
  'ui011.js',
  'ui012.js'
];'''
build = re.sub(r'const files = \[.*?\n\];', new_files, build, flags=re.S)
write('scripts/build-desktop.mjs', build)

# 4) Canonical version surfaces.
write('VERSION', '0.1.2\n')

package = json.loads(read('package.json'))
package['version'] = '0.1.2'
write('package.json', json.dumps(package, ensure_ascii=False, indent=2) + '\n')

tauri = json.loads(read('src-tauri/tauri.conf.json'))
tauri['version'] = '0.1.2'
write('src-tauri/tauri.conf.json', json.dumps(tauri, ensure_ascii=False, indent=2) + '\n')

cargo = read('src-tauri/Cargo.toml').replace('version = "0.1.1"', 'version = "0.1.2"', 1)
write('src-tauri/Cargo.toml', cargo)

desktop = read('desktop.js').replace("const VERSION = '0.1.1';", "const VERSION = '0.1.2';")
write('desktop.js', desktop)

app = read('app.js').replace("const APP_VERSION = '0.0.7';", "const APP_VERSION = '0.1.2';")
write('app.js', app)

# 5) README: current release documentation without rewriting historic sections.
readme = read('README.md')
intro = '''## Aktuelle Version: v0.1.2\n\n**v0.1.2 – UI/UX Polish** verfeinert das v0.1.1-Desktop-Redesign mit einer Premium-Detailansicht, globaler Suche, besser navigierbaren Content-Rows, „Neu seit deinem letzten Besuch“ und einer konsolidierten CSS-Basis.\n\n'''
readme = re.sub(r'## Aktuelle Version: v0\.1\.1\n\n.*?(?=## Download)', intro, readme, flags=re.S)
readme = readme.replace('[**StreamRadar v0.1.1 als MSI herunterladen**](downloads/StreamRadar_0.1.1_x64_de-DE.msi)', '[**StreamRadar v0.1.2 als MSI herunterladen**](downloads/StreamRadar_0.1.2_x64_de-DE.msi)')
new_features = '''## Neu in v0.1.2\n\n- neue **Premium-Detailansicht** mit Backdrop, Poster, Release Intelligence, Herkunft, Providern und nächster Episode\n- globale Schnell-Suche mit Suchoverlay und **Ctrl+K**\n- einheitliche SVG-Icons statt gemischter Text-/Unicode-Symbole\n- Pfeilnavigation und sauberer Scroll-Zustand für horizontale Content-Rows\n- neuer Bereich **Neu seit deinem letzten Besuch** auf Basis lokal gespeicherter Radar-Event-IDs\n- `styles.css` konsolidiert alle historischen visuellen Patches bis v0.1.1\n- `OldCss/` ist jetzt ein echtes Archiv und wird nicht mehr zur Laufzeit geladen\n- aktuelle UI-Schicht `ui012.js` und Styling `v012.css`\n- zentraler sichtbarer App-/Desktop-Versionsstand auf `0.1.2`\n\n'''
readme = re.sub(r'## Neu in v0\.1\.1\n\n.*?(?=## Funktionsumfang)', new_features, readme, flags=re.S)
readme = readme.replace('downloads/StreamRadar_0.1.1_x64_de-DE.msi', 'downloads/StreamRadar_0.1.2_x64_de-DE.msi')
write('README.md', readme)

# 6) Changelog prepend.
changelog = read('CHANGELOG.md')
entry = '''## [0.1.2] - 2026-09-01\n\n### Added\n- Premium-Detailansicht mit großem Backdrop, Poster, Release Intelligence, Herkunft, Provider-Kacheln und nächster Episode.\n- Globale Suche mit eigenem Ergebnis-Overlay und `Ctrl+K`-Shortcut.\n- Einheitliches Inline-SVG-Iconset für Navigation und zentrale Desktop-Aktionen.\n- Rail-Navigation mit Vor-/Zurück-Pfeilen und Scroll-Zuständen.\n- Lokaler Bereich **Neu seit deinem letzten Besuch** über persistierte Event-Fingerprints.\n- Neue UI-Schicht `ui012.js` und Styling `v012.css`.\n\n### Changed\n- Historische CSS-Patches bis einschließlich v0.1.1 wurden in `styles.css` konsolidiert.\n- `OldCss/` dient nur noch als Archiv; historische Styles werden nicht mehr einzeln im Browser oder MSI geladen.\n- Desktop-Packaging liefert nur noch `styles.css` plus die aktuelle `v012.css` aus.\n- Der bisher veraltete interne `APP_VERSION`-Wert wurde auf den aktuellen Stand gebracht.\n- Desktop-, Tauri- und MSI-Version wurden auf `0.1.2` angehoben.\n\n### Desktop\n- Tauri-MSI und EXE werden als v0.1.2 gebaut.\n- Der finale Main-Build veröffentlicht `downloads/StreamRadar_0.1.2_x64_de-DE.msi` automatisch im Repository.\n- Der Installer bleibt für die persönliche Nutzung unsigniert.\n\n'''
if '## [0.1.2]' not in changelog:
    changelog = changelog.replace('Alle relevanten Änderungen an StreamRadar werden hier ab der ersten Version nach Semantic Versioning dokumentiert.\n\n', 'Alle relevanten Änderungen an StreamRadar werden hier ab der ersten Version nach Semantic Versioning dokumentiert.\n\n' + entry)
write('CHANGELOG.md', changelog)

# 7) Download index on the development branch (final SHA is filled by the main MSI workflow).
write('downloads/README.md', '''# StreamRadar Downloads\n\nHier liegen die direkt installierbaren Windows-Builds von StreamRadar.\n\n## Aktuelle Windows-Version\n\n### StreamRadar v0.1.2 – Windows x64\n\n[**StreamRadar_0.1.2_x64_de-DE.msi herunterladen**](StreamRadar_0.1.2_x64_de-DE.msi)\n\n- Version: `0.1.2`\n- Plattform: Windows x64\n- Installer: MSI (`de-DE`)\n- SHA-256: wird beim finalen Main-Build automatisch eingetragen\n\nDer Installer ist aktuell nicht code-signiert. Windows kann deshalb beim Öffnen einen Hinweis auf einen unbekannten Herausgeber anzeigen.\n\n## Vorherige Version\n\n- [StreamRadar v0.1.1 – Windows x64](StreamRadar_0.1.1_x64_de-DE.msi)\n\nDie aktuelle MSI wird vom GitHub-Actions-Workflow **Build StreamRadar Windows MSI** auf einem Windows-Runner gebaut, geprüft und anschließend automatisch in diesen Ordner veröffentlicht.\n''')

print('Prepared StreamRadar v0.1.2 source tree.')
