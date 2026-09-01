from pathlib import Path
import json
import re
import shutil

ROOT = Path('.')
VERSION = '0.3.0'
PREVIOUS = '0.2.2'


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def write(path, text):
    (ROOT / path).write_text(text, encoding='utf-8', newline='\n')


def replace_once(text, old, new, label):
    if old not in text:
        if new in text:
            return text
        raise SystemExit(f'Missing expected marker in {label}: {old[:80]!r}')
    return text.replace(old, new, 1)

# Archive the last active CSS state before v0.3.0 changes it.
archive = ROOT / 'OldCss' / 'styles-v0.2.2.css'
if not archive.exists():
    shutil.copyfile(ROOT / 'styles.css', archive)

# Version files.
write('VERSION', VERSION + '\n')

package = json.loads(read('package.json'))
package['version'] = VERSION
write('package.json', json.dumps(package, ensure_ascii=False, indent=2) + '\n')

tauri = json.loads(read('src-tauri/tauri.conf.json'))
tauri['version'] = VERSION
tauri.setdefault('app', {})['withGlobalTauri'] = True
write('src-tauri/tauri.conf.json', json.dumps(tauri, ensure_ascii=False, indent=2) + '\n')

cap = json.loads(read('src-tauri/capabilities/default.json'))
permissions = cap.setdefault('permissions', [])
for permission in ['opener:default', 'window-state:default']:
    if permission not in permissions:
        permissions.append(permission)
cap['description'] = 'StreamRadar desktop permissions for core APIs, safe external URL opening and persisted window state.'
write('src-tauri/capabilities/default.json', json.dumps(cap, ensure_ascii=False, indent=2) + '\n')

cargo = read('src-tauri/Cargo.toml')
cargo = cargo.replace('version = "0.2.2"', 'version = "0.3.0"', 1)
if 'tauri-plugin-opener' not in cargo:
    cargo = cargo.rstrip() + '\ntauri-plugin-opener = "2"\ntauri-plugin-window-state = "2"\n'
write('src-tauri/Cargo.toml', cargo)

write('src-tauri/src/lib.rs', '''#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running StreamRadar");
}
''')

# Runtime version surfaces.
index = read('index.html').replace('0.2.2', '0.3.0')
write('index.html', index)

app = read('js/app.js').replace("APP_VERSION = '0.2.2'", "APP_VERSION = '0.3.0'")
write('js/app.js', app)

ui = read('js/ui.js')
ui = ui.replace("/* StreamRadar v0.2.0 — Personalization & Settings */\n(() => {\n  const VERSION = '0.2.2';", "/* StreamRadar v0.2.0+ — Personalization & Settings */\n(() => {\n  const VERSION = '0.3.0';")
write('js/ui.js', ui)

# Desktop integration + Update Center.
desktop_js = r'''(() => {
  const VERSION = '0.3.0';
  const PUBLISHED_DOWNLOADS_URL = 'https://raw.githubusercontent.com/Homiiboy/StreamRadar/main/downloads/README.md';
  const DOWNLOADS_PAGE_URL = 'https://github.com/Homiiboy/StreamRadar/tree/main/downloads';
  const UPDATE_PREFS_KEY = 'streamradar-update-prefs-v1';
  const UPDATE_CACHE_KEY = 'streamradar-update-cache-v1';
  const UPDATE_INTERVAL_MS = 24 * 60 * 60 * 1000;
  const isDesktop = Boolean(window.__TAURI_INTERNALS__ || window.__TAURI__);

  const safeJSON = (value, fallback) => {
    try { return JSON.parse(value); } catch { return fallback; }
  };
  const prefs = { autoCheck:true, ...safeJSON(localStorage.getItem(UPDATE_PREFS_KEY) || '{}', {}) };
  const cached = safeJSON(localStorage.getItem(UPDATE_CACHE_KEY) || '{}', {});
  const updateState = {
    status:'idle',
    current:VERSION,
    latest:typeof cached.latest === 'string' ? cached.latest : VERSION,
    lastChecked:Number(cached.lastChecked || 0),
    message:'Noch nicht geprüft.',
    runtimeVersion:VERSION,
    tauriVersion:'',
    isDesktop
  };

  function versionParts(value) {
    return String(value || '').trim().replace(/^v/i, '').split('.').slice(0, 3).map(part => Number(part.replace(/[^0-9].*$/, '')) || 0);
  }

  function compareVersions(a, b) {
    const left = versionParts(a); const right = versionParts(b);
    for (let index = 0; index < 3; index += 1) {
      if ((left[index] || 0) > (right[index] || 0)) return 1;
      if ((left[index] || 0) < (right[index] || 0)) return -1;
    }
    return 0;
  }

  function extractPublishedVersion(markdown) {
    const match = String(markdown || '').match(/StreamRadar\s+v(\d+\.\d+\.\d+)\s*[–-]\s*Windows\s+x64/i)
      || String(markdown || '').match(/Version:\s*`{1,2}(\d+\.\d+\.\d+)`{1,2}/i);
    return match?.[1] || null;
  }

  function directMsiUrl(version) {
    return `https://raw.githubusercontent.com/Homiiboy/StreamRadar/main/downloads/StreamRadar_${version}_x64_de-DE.msi`;
  }

  function persistPrefs() {
    localStorage.setItem(UPDATE_PREFS_KEY, JSON.stringify({ autoCheck:Boolean(prefs.autoCheck) }));
  }

  function persistUpdateCache() {
    localStorage.setItem(UPDATE_CACHE_KEY, JSON.stringify({ latest:updateState.latest, lastChecked:updateState.lastChecked }));
  }

  function stateLabel() {
    if (updateState.status === 'checking') return ['Prüfe auf Updates …', 'StreamRadar fragt den veröffentlichten MSI-Stand auf GitHub ab.'];
    if (updateState.status === 'available') return [`Update v${updateState.latest} verfügbar`, `Installiert ist v${updateState.current}. Der neue MSI-Build wurde bereits veröffentlicht.`];
    if (updateState.status === 'current') return ['StreamRadar ist aktuell', `v${updateState.current} ist die neueste veröffentlichte MSI-Version.`];
    if (updateState.status === 'offline') return ['Offline', 'Die Update-Prüfung benötigt kurz eine Internetverbindung.'];
    if (updateState.status === 'error') return ['Update-Prüfung fehlgeschlagen', updateState.message || 'GitHub konnte nicht erreicht werden.'];
    return ['Update-Status', updateState.message || 'Noch nicht geprüft.'];
  }

  function formatLastCheck() {
    if (!updateState.lastChecked) return 'Noch nie';
    try { return new Intl.DateTimeFormat('de-AT', { dateStyle:'medium', timeStyle:'short' }).format(new Date(updateState.lastChecked)); }
    catch { return new Date(updateState.lastChecked).toLocaleString(); }
  }

  function emitUpdateState() {
    renderUpdateSurface();
    window.dispatchEvent(new CustomEvent('streamradar:update-state', { detail:{ ...updateState } }));
  }

  async function loadRuntimeMetadata() {
    if (!isDesktop || !window.__TAURI__?.app) return;
    try {
      updateState.runtimeVersion = await window.__TAURI__.app.getVersion();
      updateState.current = updateState.runtimeVersion || VERSION;
      updateState.tauriVersion = await window.__TAURI__.app.getTauriVersion();
    } catch (error) {
      console.warn('StreamRadar: Tauri runtime metadata unavailable.', error);
    }
    emitUpdateState();
  }

  async function openExternal(url) {
    const target = String(url || '');
    if (!/^https?:\/\//i.test(target)) return false;
    if (isDesktop && window.__TAURI__?.opener?.openUrl) {
      try {
        await window.__TAURI__.opener.openUrl(target);
        return true;
      } catch (error) {
        console.warn('StreamRadar: native opener failed, falling back to browser.', error);
      }
    }
    window.open(target, '_blank', 'noopener,noreferrer');
    return true;
  }

  async function checkForUpdates({ force = false } = {}) {
    if (updateState.status === 'checking') return { ...updateState };
    if (!force && !prefs.autoCheck) return { ...updateState };
    if (!force && updateState.lastChecked && Date.now() - updateState.lastChecked < UPDATE_INTERVAL_MS) {
      updateState.status = compareVersions(updateState.latest, updateState.current) > 0 ? 'available' : 'current';
      updateState.message = 'Letzte veröffentlichte Version aus lokalem Update-Cache.';
      emitUpdateState();
      return { ...updateState };
    }
    if (navigator.onLine === false) {
      updateState.status = 'offline'; updateState.message = 'Keine Netzwerkverbindung.'; emitUpdateState();
      return { ...updateState };
    }

    updateState.status = 'checking'; updateState.message = 'GitHub wird geprüft …'; emitUpdateState();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${PUBLISHED_DOWNLOADS_URL}?streamradar=${Date.now()}`, { cache:'no-store', signal:controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const latest = extractPublishedVersion(await response.text());
      if (!latest) throw new Error('Keine veröffentlichte StreamRadar-Version gefunden.');
      updateState.latest = latest;
      updateState.lastChecked = Date.now();
      updateState.status = compareVersions(latest, updateState.current) > 0 ? 'available' : 'current';
      updateState.message = updateState.status === 'available' ? `StreamRadar v${latest} wurde als MSI veröffentlicht.` : `v${updateState.current} ist aktuell.`;
      persistUpdateCache();
    } catch (error) {
      updateState.status = navigator.onLine === false ? 'offline' : 'error';
      updateState.message = error?.name === 'AbortError' ? 'Zeitüberschreitung beim Update-Check.' : String(error?.message || 'GitHub konnte nicht erreicht werden.');
    } finally {
      clearTimeout(timeout);
      emitUpdateState();
    }
    return { ...updateState };
  }

  function ensureRuntimeBadge() {
    if (!isDesktop) return;
    document.body.classList.add('desktop-app');
    const status = document.querySelector('#dataStatus');
    if (status && !document.querySelector('#desktopRuntimeBadge')) {
      const badge = document.createElement('span');
      badge.id = 'desktopRuntimeBadge';
      badge.className = 'desktop-runtime-badge';
      badge.textContent = 'WINDOWS APP';
      badge.title = `StreamRadar Desktop v${updateState.current}`;
      status.insertBefore(badge, document.querySelector('#statusAction'));
    }
  }

  function ensureSidebarUpdateButton() {
    const settings = document.querySelector('#sidebarSettings');
    if (!settings || document.querySelector('#desktopUpdateButton')) return;
    const button = document.createElement('button');
    button.id = 'desktopUpdateButton';
    button.className = 'sidebar-action sidebar-update-action';
    button.hidden = true;
    button.innerHTML = '<span class="sidebar-update-dot"></span><span>Update verfügbar</span><strong></strong>';
    button.onclick = () => openUpdateCenter();
    settings.parentNode.insertBefore(button, settings);
  }

  function activateUpdateTab() {
    document.querySelectorAll('.settings-tab').forEach(node => node.classList.toggle('active', node.dataset.settingsTab === 'updates'));
    document.querySelectorAll('.settings-page').forEach(node => node.classList.toggle('active', node.dataset.settingsPage === 'updates'));
  }

  function openUpdateCenter() {
    const dialog = document.querySelector('#settingsDialog');
    const opener = document.querySelector('#openSettings');
    if (dialog && !dialog.open && opener) opener.click();
    ensureUpdateCenter();
    activateUpdateTab();
  }

  function ensureUpdateCenter() {
    const tabs = document.querySelector('.settings-tabs');
    const main = document.querySelector('.settings-main');
    if (!tabs || !main) return;

    if (!document.querySelector('#settingsUpdateTab')) {
      const tab = document.createElement('button');
      tab.id = 'settingsUpdateTab';
      tab.className = 'settings-tab';
      tab.dataset.settingsTab = 'updates';
      tab.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 18h14"/></svg><span>Updates</span><i class="settings-update-indicator"></i>';
      tab.onclick = activateUpdateTab;
      tabs.appendChild(tab);
    }

    if (!document.querySelector('#settingsUpdatePage')) {
      const page = document.createElement('section');
      page.id = 'settingsUpdatePage';
      page.className = 'settings-page desktop-update-page';
      page.dataset.settingsPage = 'updates';
      main.appendChild(page);
    }
    renderUpdateSurface();
  }

  function renderUpdateSurface() {
    ensureSidebarUpdateButton();
    const available = updateState.status === 'available';
    const sidebar = document.querySelector('#desktopUpdateButton');
    if (sidebar) {
      sidebar.hidden = !available;
      const version = sidebar.querySelector('strong');
      if (version) version.textContent = available ? `v${updateState.latest}` : '';
    }
    document.querySelector('#settingsUpdateTab')?.classList.toggle('has-update', available);

    const page = document.querySelector('#settingsUpdatePage');
    if (!page) return;
    const [title, copy] = stateLabel();
    const download = available ? `<button class="primary-button" id="downloadStreamRadarUpdate">v${updateState.latest} MSI herunterladen</button>` : '';
    page.innerHTML = `<div class="settings-page-head"><span class="section-kicker">DESKTOP & UPDATES</span><h2>StreamRadar aktuell halten</h2><p>StreamRadar prüft ausschließlich veröffentlichte MSI-Builds im GitHub-Downloadordner. Updates werden nie automatisch installiert.</p></div>
      <div class="update-status-card update-${updateState.status}"><div class="update-status-orb"><span></span></div><div class="update-status-copy"><span>${updateState.status === 'available' ? 'UPDATE VERFÜGBAR' : updateState.status === 'checking' ? 'PRÜFUNG LÄUFT' : 'UPDATE CENTER'}</span><h3>${title}</h3><p>${copy}</p></div><div class="update-version-pair"><small>Installiert</small><strong>v${updateState.current}</strong><small>Veröffentlicht</small><strong>v${updateState.latest}</strong></div></div>
      <div class="settings-group"><div class="setting-row"><div class="setting-copy"><strong>Automatisch nach Updates suchen</strong><span>Die Windows-App prüft höchstens einmal pro 24 Stunden auf eine neu veröffentlichte MSI-Version.</span></div><label class="setting-switch"><input id="desktopAutoUpdateCheck" type="checkbox" ${prefs.autoCheck ? 'checked' : ''}/><span></span></label></div><div class="setting-row"><div class="setting-copy"><strong>Letzte Prüfung</strong><span>${formatLastCheck()}</span></div><button class="ghost-button compact-action" id="checkStreamRadarUpdate" ${updateState.status === 'checking' ? 'disabled' : ''}>${updateState.status === 'checking' ? 'Prüfe …' : 'Jetzt prüfen'}</button></div></div>
      <div class="desktop-runtime-grid"><div><span>Runtime</span><strong>${isDesktop ? 'Windows Desktop' : 'Web'}</strong></div><div><span>App-Version</span><strong>v${updateState.runtimeVersion}</strong></div><div><span>Tauri</span><strong>${updateState.tauriVersion ? `v${updateState.tauriVersion}` : isDesktop ? 'wird erkannt …' : '–'}</strong></div><div><span>Update-Kanal</span><strong>Stable MSI</strong></div></div>
      <div class="update-actions">${download}<button class="ghost-button" id="openStreamRadarDownloads">GitHub Downloads öffnen</button></div>
      <div class="settings-note update-security-note"><strong>Sicheres Verhalten:</strong> v0.3.0 lädt und startet keinen Installer selbstständig. Der MSI-Download wird nur auf deinen Klick im Windows-Standardbrowser geöffnet. Ein vollautomatischer Tauri-Updater folgt erst, wenn dafür eine eigene Update-Signatur-Infrastruktur eingerichtet ist.</div>`;

    const auto = document.querySelector('#desktopAutoUpdateCheck');
    if (auto) auto.onchange = event => { prefs.autoCheck = Boolean(event.target.checked); persistPrefs(); };
    const check = document.querySelector('#checkStreamRadarUpdate');
    if (check) check.onclick = () => checkForUpdates({ force:true });
    const downloads = document.querySelector('#openStreamRadarDownloads');
    if (downloads) downloads.onclick = () => openExternal(DOWNLOADS_PAGE_URL);
    const downloadButton = document.querySelector('#downloadStreamRadarUpdate');
    if (downloadButton) downloadButton.onclick = () => openExternal(directMsiUrl(updateState.latest));
  }

  function installExternalLinkRouting() {
    document.addEventListener('click', event => {
      if (!isDesktop || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest?.('a[href]');
      if (!link) return;
      const href = link.href || '';
      if (!/^https?:\/\//i.test(href)) return;
      event.preventDefault();
      openExternal(href);
    });
  }

  function installSettingsObserver() {
    const observer = new MutationObserver(() => ensureUpdateCenter());
    observer.observe(document.body, { childList:true, subtree:true });
    ensureUpdateCenter();
  }

  document.documentElement.dataset.streamradarVersion = VERSION;
  document.documentElement.dataset.streamradarRuntime = isDesktop ? 'desktop' : 'web';
  ensureRuntimeBadge();
  ensureSidebarUpdateButton();
  installExternalLinkRouting();
  installSettingsObserver();
  loadRuntimeMetadata().then(() => {
    if (isDesktop && prefs.autoCheck) setTimeout(() => checkForUpdates(), 900);
  });
  window.addEventListener('online', () => { if (isDesktop && prefs.autoCheck && updateState.status === 'offline') checkForUpdates({ force:true }); });

  window.StreamRadarDesktop = Object.freeze({
    version:VERSION,
    isDesktop,
    checkForUpdates,
    openExternal,
    openUpdateCenter,
    compareVersions,
    getUpdateState:() => ({ ...updateState }),
    getUpdatePreferences:() => ({ ...prefs })
  });
})();
'''
write('js/desktop.js', desktop_js)

# CSS additions.
styles = read('styles.css')
marker = '/* StreamRadar v0.3.0 — Desktop Integration & Updates */'
if marker not in styles:
    styles = styles.rstrip() + '\n\n' + marker + r'''
.sidebar-update-action{border:1px solid color-mix(in srgb,var(--accent) 28%,transparent);background:linear-gradient(135deg,color-mix(in srgb,var(--accent) 10%,transparent),rgba(255,255,255,.025));color:var(--text);margin-bottom:8px}.sidebar-update-action strong{margin-left:auto;font-size:10px;color:var(--accent);font-family:"Space Grotesk",sans-serif}.sidebar-update-dot{width:8px;height:8px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 12%,transparent),0 0 14px color-mix(in srgb,var(--accent) 55%,transparent);flex:0 0 auto}.settings-tab .settings-update-indicator{display:none;width:7px;height:7px;border-radius:50%;background:var(--accent);box-shadow:0 0 10px var(--accent);margin-left:auto}.settings-tab.has-update .settings-update-indicator{display:block}.desktop-update-page{gap:18px}.update-status-card{display:grid;grid-template-columns:auto 1fr auto;gap:18px;align-items:center;padding:22px;border:1px solid var(--line);border-radius:20px;background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(255,255,255,.018));overflow:hidden;position:relative}.update-status-card.update-available{border-color:color-mix(in srgb,var(--accent) 36%,transparent);box-shadow:inset 0 0 35px color-mix(in srgb,var(--accent) 6%,transparent)}.update-status-orb{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;border:1px solid color-mix(in srgb,var(--accent) 35%,transparent);background:color-mix(in srgb,var(--accent) 8%,transparent)}.update-status-orb span{width:13px;height:13px;border-radius:50%;background:var(--accent);box-shadow:0 0 18px color-mix(in srgb,var(--accent) 70%,transparent)}.update-checking .update-status-orb span{animation:pulse 1s ease-in-out infinite}.update-status-copy>span{font-size:10px;font-weight:800;letter-spacing:.14em;color:var(--accent)}.update-status-copy h3{font:700 22px/1.15 "Space Grotesk",sans-serif;margin:4px 0 6px}.update-status-copy p{color:var(--muted);font-size:13px;line-height:1.5;margin:0}.update-version-pair{display:grid;grid-template-columns:auto auto;gap:3px 12px;align-items:baseline;padding-left:18px;border-left:1px solid var(--line)}.update-version-pair small{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}.update-version-pair strong{font:700 13px "Space Grotesk",sans-serif}.update-status-card.update-available .update-version-pair strong:last-child{color:var(--accent)}.desktop-runtime-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.desktop-runtime-grid>div{padding:14px;border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.025);display:flex;flex-direction:column;gap:5px}.desktop-runtime-grid span{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}.desktop-runtime-grid strong{font:650 13px "Space Grotesk",sans-serif}.update-actions{display:flex;gap:10px;flex-wrap:wrap}.compact-action{padding:9px 13px;min-height:auto}.update-security-note{line-height:1.55}@media(max-width:850px){.update-status-card{grid-template-columns:auto 1fr}.update-version-pair{grid-column:1/-1;border-left:0;border-top:1px solid var(--line);padding:14px 0 0}.desktop-runtime-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.update-status-card{grid-template-columns:1fr}.update-status-orb{display:none}.desktop-runtime-grid{grid-template-columns:1fr}.update-actions>*{width:100%}}
'''
write('styles.css', styles)

# README current release sections.
readme = read('README.md')
readme = re.sub(r'## Aktuelle Version: v0\.2\.2\n\n.*?\n\n## Download', '''## Aktuelle Version: v0.3.0

**v0.3.0 – Desktop Integration & Updates** macht StreamRadar zu einer deutlich eigenständigeren Windows-App: mit Update-Center, veröffentlichtem MSI-Versionscheck, nativer Link-Öffnung und gespeichertem Fensterzustand.

## Download''', readme, count=1, flags=re.S)
readme = readme.replace('[**StreamRadar v0.2.2 als MSI herunterladen**](downloads/StreamRadar_0.2.2_x64_de-DE.msi)', '[**StreamRadar v0.3.0 als MSI herunterladen**](downloads/StreamRadar_0.3.0_x64_de-DE.msi)')
readme = re.sub(r'## Neu in v0\.2\.2\n\n.*?\n\n## Funktionsumfang', '''## Neu in v0.3.0

- eigenes **Update-Center** im Personalization Center
- manueller und optional täglicher Check der tatsächlich veröffentlichten MSI-Version im GitHub-Downloadordner
- Update-Hinweis in der Sidebar, sobald eine neuere veröffentlichte Version verfügbar ist
- direkter MSI-Download auf Benutzeraktion; keine automatische Installation
- native Tauri-Integration zum Öffnen externer URLs im Windows-Standardbrowser
- Fenstergröße, Position und Zustand werden über das Tauri Window-State-Plugin gespeichert und wiederhergestellt
- echte Runtime-Metadaten für App- und Tauri-Version in der Desktop-Oberfläche
- `withGlobalTauri` für die Vanilla-JavaScript-Desktop-Brücke, abgesichert über Tauri Capabilities
- CSS-Snapshot des letzten v0.2.2-Zustands unter `OldCss/styles-v0.2.2.css`
- automatisierter Browser-Test für Update-Erkennung zusätzlich zu den bestehenden Film-, Kalender-, First-Run-, Settings- und Backup-Tests

## Funktionsumfang''', readme, count=1, flags=re.S)
readme = readme.replace('downloads/StreamRadar_0.2.2_x64_de-DE.msi', 'downloads/StreamRadar_0.3.0_x64_de-DE.msi')
readme = readme.replace('npm install\nnpm run desktop:build', 'npm ci\nnpm run desktop:build')
readme = readme.replace('- Tauri-v2-Desktop-App für Windows\n- MSI-Installer für Windows x64', '- Tauri-v2-Desktop-App für Windows\n- integriertes Update-Center mit veröffentlichtem MSI-Versionscheck\n- gespeicherter nativer Fensterzustand und externe Links über den Windows-Standardbrowser\n- MSI-Installer für Windows x64')
write('README.md', readme)

# Changelog.
changelog = read('CHANGELOG.md')
entry = '''## [0.3.0] - 2026-09-01

### Added
- Neues **Update-Center** im Einstellungs-Center mit installierter und veröffentlichter Version.
- Manueller Update-Check sowie optionaler automatischer Check höchstens einmal pro 24 Stunden.
- Sidebar-Hinweis und direkter MSI-Download, sobald eine neuere veröffentlichte Version verfügbar ist.
- Native Tauri-Opener-Integration für externe Links im Windows-Standardbrowser.
- Tauri Window State zum Wiederherstellen von Fenstergröße, Position und Zustand.
- Runtime-Anzeige für echte App- und Tauri-Version.
- Playwright-Regressionstest für die Erkennung einer neueren veröffentlichten MSI-Version.
- Archiv-Snapshot `OldCss/styles-v0.2.2.css` vor den v0.3.0-Styleänderungen.

### Changed
- App-, Desktop-, Tauri- und MSI-Version auf `0.3.0` angehoben.
- Tauri Vanilla-JavaScript-Bridge über `withGlobalTauri` aktiviert und über Capabilities auf Core, Opener und Window State begrenzt.
- Update-Erkennung orientiert sich am tatsächlich veröffentlichten `downloads/README.md` statt an einem noch nicht gebauten Release-Commit.

### Security
- v0.3.0 installiert Updates nicht automatisch und führt keine heruntergeladenen Dateien aus.
- Ein MSI wird ausschließlich nach einem Benutzerklick im Standardbrowser geöffnet; der bestehende unsignierte Installer-Status bleibt unverändert.

'''
if '## [0.3.0]' not in changelog:
    changelog = changelog.replace('Alle relevanten Änderungen an StreamRadar werden hier ab der ersten Version nach Semantic Versioning dokumentiert.\n\n', 'Alle relevanten Änderungen an StreamRadar werden hier ab der ersten Version nach Semantic Versioning dokumentiert.\n\n' + entry, 1)
write('CHANGELOG.md', changelog)

# Tests: allow one mocked published downloads response and add Update Center coverage.
tests = read('tests/e2e/streamradar.spec.js')
tests = tests.replace('async function boot(page, storage = {}) {', 'async function boot(page, storage = {}, options = {}) {')
tests = tests.replace("  await page.route(/^https?:\\/\\/(?!127\\.0\\.0\\.1:4173)/, route => route.abort());\n", "  await page.route(/^https?:\\/\\/(?!127\\.0\\.0\\.1:4173)/, route => route.abort());\n  if (options.publishedDownloads) {\n    await page.route('https://raw.githubusercontent.com/Homiiboy/StreamRadar/main/downloads/README.md*', route => route.fulfill({ status:200, contentType:'text/markdown', body:options.publishedDownloads }));\n  }\n")
tests = tests.replace("version: '0.2.2'", "version: '0.3.0'")
tests = tests.replace("expect(version).toBe('0.2.2');", "expect(version).toBe('0.3.0');")
if "update center detects a newer published MSI" not in tests:
    tests = tests.rstrip() + r'''

test('update center detects a newer published MSI', async ({ page }) => {
  const published = '# StreamRadar Downloads\n\n### StreamRadar v0.3.1 – Windows x64\n\n- Version: `0.3.1`\n';
  const errors = await boot(page, configuredStorage(), { publishedDownloads: published });
  await page.locator('#openSettings').click();
  await expect(page.locator('[data-settings-tab="updates"]')).toBeVisible();
  await page.locator('[data-settings-tab="updates"]').click();
  await page.locator('#checkStreamRadarUpdate').click();
  await expect(page.locator('#settingsUpdatePage')).toContainText('Update v0.3.1 verfügbar');
  await expect(page.locator('#downloadStreamRadarUpdate')).toContainText('v0.3.1 MSI herunterladen');
  const state = await page.evaluate(() => window.StreamRadarDesktop.getUpdateState());
  expect(state.status).toBe('available');
  expect(state.latest).toBe('0.3.1');
  expect(errors).toEqual([]);
});
''' + '\n'
write('tests/e2e/streamradar.spec.js', tests)

# Validation workflow.
validate = read('.github/workflows/validate.yml').replace('0.2.2', '0.3.0')
validate = validate.replace("      - name: Check automated browser QA surface\n", "      - name: Check desktop integration and update center\n        run: |\n          test -s OldCss/styles-v0.2.2.css\n          grep -q 'PUBLISHED_DOWNLOADS_URL' js/desktop.js\n          grep -q 'checkForUpdates' js/desktop.js\n          grep -q 'settingsUpdatePage' js/desktop.js\n          grep -q 'openExternal' js/desktop.js\n          grep -q '24 \* 60 \* 60 \* 1000' js/desktop.js\n          grep -q '\"withGlobalTauri\": true' src-tauri/tauri.conf.json\n          grep -q 'tauri-plugin-opener' src-tauri/Cargo.toml\n          grep -q 'tauri-plugin-window-state' src-tauri/Cargo.toml\n          grep -q 'opener:default' src-tauri/capabilities/default.json\n          grep -q 'window-state:default' src-tauri/capabilities/default.json\n          grep -q 'tauri_plugin_opener::init' src-tauri/src/lib.rs\n          grep -q 'tauri_plugin_window_state' src-tauri/src/lib.rs\n          grep -q 'StreamRadar v0.3.0 — Desktop Integration & Updates' styles.css\n\n      - name: Check automated browser QA surface\n", 1)
validate = validate.replace("          grep -q 'corrupt local personalization data' tests/e2e/streamradar.spec.js\n", "          grep -q 'corrupt local personalization data' tests/e2e/streamradar.spec.js\n          grep -q 'movies view and calendar include movie releases' tests/e2e/streamradar.spec.js\n          grep -q 'update center detects a newer published MSI' tests/e2e/streamradar.spec.js\n")
validate = validate.replace("          test ! -e scripts/prepare-v021.py\n", "          test ! -e scripts/prepare-v030.py\n          test ! -e .github/workflows/prepare-v030.yml\n          test ! -e scripts/prepare-v021.py\n")
write('.github/workflows/validate.yml', validate)

# Windows workflow.
build = read('.github/workflows/build-msi.yml')
build = build.replace('StreamRadar-v0.2.2-Windows', 'StreamRadar-v0.3.0-Windows')
build = build.replace('StreamRadar_0.2.2_x64_de-DE.msi', 'StreamRadar_0.3.0_x64_de-DE.msi')
build = build.replace('StreamRadar v0.2.2 – Windows x64', 'StreamRadar v0.3.0 – Windows x64')
build = build.replace('Version: ``0.2.2``', 'Version: ``0.3.0``')
build = build.replace('chore: publish StreamRadar v0.2.2 MSI', 'chore: publish StreamRadar v0.3.0 MSI')
build = build.replace('- [StreamRadar v0.2.1 – Windows x64](StreamRadar_0.2.1_x64_de-DE.msi)', '- [StreamRadar v0.2.2 – Windows x64](StreamRadar_0.2.2_x64_de-DE.msi)')
write('.github/workflows/build-msi.yml', build)

print('StreamRadar v0.3.0 preparation applied.')
