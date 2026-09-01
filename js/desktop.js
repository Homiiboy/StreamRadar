(() => {
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
