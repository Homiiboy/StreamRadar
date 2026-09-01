from pathlib import Path
import json

def rw(path, fn):
    p=Path(path); s=p.read_text(encoding='utf-8'); p.write_text(fn(s),encoding='utf-8',newline='\n')

Path('VERSION').write_text('0.2.2\n',encoding='utf-8')

p=Path('package.json'); d=json.loads(p.read_text(encoding='utf-8')); d['version']='0.2.2'; d['devDependencies']['@playwright/test']='1.62.1'; p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
p=Path('src-tauri/tauri.conf.json'); d=json.loads(p.read_text(encoding='utf-8')); d['version']='0.2.2'; p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
rw('src-tauri/Cargo.toml',lambda s:s.replace('version = "0.2.1"','version = "0.2.2"',1))
rw('js/app.js',lambda s:s.replace("const APP_VERSION = '0.2.1';","const APP_VERSION = '0.2.2';",1))
rw('js/desktop.js',lambda s:s.replace('0.2.1','0.2.2'))
rw('js/ui.js',lambda s:s.replace("const VERSION = '0.2.1';","const VERSION = '0.2.2';",1).replace('V0.2.1 · PERSONALIZATION','V0.2.2 · MOVIES & PERSONALIZATION'))
rw('index.html',lambda s:s.replace('V0.2.1','V0.2.2').replace('v0.2.1','v0.2.2').replace('Version 0.2.1','Version 0.2.2').replace('<strong>v0.2.1:</strong> Automated QA & Repository Hardening mit Browser-Smoke-Tests und aufgeräumter JavaScript-Struktur.','<strong>v0.2.2:</strong> Movies & Calendar Polish mit eigenem Film-Radar und automatisierter Film-/Kalender-Abdeckung.'))
rw('tests/e2e/streamradar.spec.js',lambda s:s.replace("version: '0.2.1'","version: '0.2.2'").replace("expect(version).toBe('0.2.1')","expect(version).toBe('0.2.2')"))

# README only represents the current downloadable release.
rw('README.md',lambda s:s.replace('v0.2.1','v0.2.2').replace('0.2.1','0.2.2') + ('\n\n### Film-Radar\n\nStreamRadar v0.2.2 bietet einen eigenen **Filme**-Bereich. Film-Releases bleiben gleichzeitig Bestandteil des Release-Kalenders und der 90-Tage-Timeline.\n' if '### Film-Radar' not in s else ''))

p=Path('CHANGELOG.md'); s=p.read_text(encoding='utf-8')
if '## [0.2.2]' not in s:
    marker='Alle relevanten Änderungen an StreamRadar werden hier ab der ersten Version nach Semantic Versioning dokumentiert.\n\n'
    entry='''## [0.2.2] - 2026-09-01\n\n### Added\n- Eigener **Filme**-Eintrag in der Hauptnavigation mit dediziertem Film-Radar.\n- Film-Zähler in der Kalender-Zusammenfassung.\n- Playwright-Regressionstest für Film-View und Film-Event in der 90-Tage-Kalender-Timeline.\n\n### Changed\n- App-, Tauri-, MSI- und Runtime-Version auf `0.2.2` angehoben.\n- Playwright auf `1.62.1` aktualisiert und reproduzierbare Node-Abhängigkeiten eingeführt.\n\n### Quality\n- Film-Releases werden explizit als Teil der Kalender-Abdeckung getestet.\n- High-Severity-NPM-Audit wird Bestandteil der Release-Validierung.\n\n'''
    s=s.replace(marker,marker+entry,1); p.write_text(s,encoding='utf-8',newline='\n')
print('release preparation done')
