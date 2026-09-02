(() => {
  const VERSION = '0.0.9';
  const CACHE_KEY = 'streamradar-radar-cache-v1';
  const PROVIDERS_KEY = 'streamradar-preferred-providers';
  const PROVIDERS_ONLY_KEY = 'streamradar-preferred-providers-only';
  const SORT_KEY = 'streamradar-sort-mode';
  const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
  const MAX_CACHE_EVENTS = 350;

  const allProviderNames = tmdb.SERVICE_DEFINITIONS.map(service => service.name);
  const savedProviders = safeJSON(localStorage.getItem(PROVIDERS_KEY) || 'null', null);
  let preferredProviders = new Set(Array.isArray(savedProviders) ? savedProviders : allProviderNames);
  let preferredProvidersOnly = localStorage.getItem(PROVIDERS_ONLY_KEY) === 'true';
  let sortMode = localStorage.getItem(SORT_KEY) || 'relevance';
  let cacheHydrated = false;
  let temporarySource = null;

  const baseRenderReleases = renderReleases;
  const baseUseDemo = useDemo;
  const baseEnrichRadarMetadata = enrichRadarMetadata;
  const baseLoadLiveData = loadLiveData;

  function parseCache() {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (!cached || !Array.isArray(cached.releases) || !cached.savedAt) return null;
      return cached;
    } catch {
      return null;
    }
  }

  function cacheAge(cached = parseCache()) {
    return cached ? Math.max(0, Date.now() - Number(cached.savedAt || 0)) : Infinity;
  }

  function cacheIsFresh(cached = parseCache()) {
    return Boolean(cached && cacheAge(cached) <= CACHE_TTL_MS);
  }

  function humanAge(milliseconds) {
    if (!Number.isFinite(milliseconds)) return 'kein Cache';
    const minutes = Math.max(0, Math.round(milliseconds / 60000));
    if (minutes < 2) return 'gerade eben';
    if (minutes < 60) return `vor ${minutes} Min.`;
    const hours = Math.round(minutes / 60);
    return `vor ${hours} Std.`;
  }

  function saveSnapshot() {
    if (state.mode !== 'live' || !state.releases?.length) return false;
    const payload = {
      version: VERSION,
      savedAt: Date.now(),
      releases: state.releases.slice(0, MAX_CACHE_EVENTS),
      providerMap: state.providerMap || [],
      scheduleStats: state.scheduleStats || {},
      region: tmdb.REGION || 'AT'
    };
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
      updateHealth();
      updateSettingsSummary();
      return true;
    } catch (error) {
      console.warn('StreamRadar: Cache konnte nicht gespeichert werden.', error);
      return false;
    }
  }

  function restoreCache({ allowStale = false, status = true } = {}) {
    const cached = parseCache();
    if (!cached || (!allowStale && !cacheIsFresh(cached))) return false;
    state.mode = 'live';
    state.providerMap = Array.isArray(cached.providerMap) ? cached.providerMap : [];
    state.scheduleStats = cached.scheduleStats || { days:0, matchedShows:0, events:0, errors:0 };
    state.releases = cached.releases.map(enrichRelease).filter(item => item?.title);
    cacheHydrated = true;
    renderServices();
    renderReleases();
    if (status) {
      setDataStatus('live', navigator.onLine ? 'Sofort-Cache' : 'Offline-Cache', `${state.releases.length} Events ${humanAge(cacheAge(cached))} geladen${navigator.onLine ? ' · Live-Abgleich läuft im Hintergrund.' : ' · Keine Netzwerkverbindung.'}`);
    }
    setLoading(false);
    updateHealth();
    updateSettingsSummary();
    return true;
  }

  function sortEvents(items) {
    const copy = [...items];
    if (sortMode === 'date') {
      return copy.sort((a, b) => String(a.releaseDate || '9999').localeCompare(String(b.releaseDate || '9999')) || sortByRadarRelevance(a, b));
    }
    if (sortMode === 'popularity') {
      return copy.sort((a, b) => (b.popularity || 0) - (a.popularity || 0) || sortByRadarRelevance(a, b));
    }
    if (sortMode === 'rating') {
      return copy.sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.popularity || 0) - (a.popularity || 0));
    }
    return copy.sort(sortByRadarRelevance);
  }

  function providerFiltered(items) {
    if (!preferredProvidersOnly) return items;
    return items.filter(item => (item.services || []).some(service => preferredProviders.has(service)));
  }

  function personalized(items) {
    return sortEvents(providerFiltered(items));
  }

  function withPersonalizedState(callback) {
    if (!Array.isArray(state.releases)) return callback();
    const full = state.releases;
    state.releases = personalized(full);
    try {
      return callback();
    } finally {
      state.releases = full;
    }
  }

  renderReleases = function() {
    const result = withPersonalizedState(() => baseRenderReleases());
    updatePersonalMode();
    return result;
  };

  useDemo = function(message = 'TMDB noch nicht verbunden.') {
    const token = localStorage.getItem(TOKEN_KEY)?.trim();
    const authProblem = /ungültig|nicht autorisiert|auth/i.test(message || '');
    if (token && !authProblem && restoreCache({ allowStale:true, status:false })) {
      setDataStatus('live', navigator.onLine ? 'Cache-Fallback' : 'Offline-Cache', `${state.releases.length} zuletzt gespeicherte Events werden angezeigt · ${message}`);
      showToast('Live-Sync nicht verfügbar – gespeicherte Daten bleiben sichtbar.', 'warning');
      return;
    }
    return baseUseDemo(message);
  };

  enrichRadarMetadata = async function(token) {
    const result = await baseEnrichRadarMetadata(token);
    saveSnapshot();
    return result;
  };

  loadLiveData = async function(options = {}) {
    if (!navigator.onLine) {
      if (restoreCache({ allowStale:true })) {
        showToast('Offline: StreamRadar verwendet den letzten gespeicherten Stand.', 'warning');
        return;
      }
    }
    const result = await baseLoadLiveData(options);
    if (state.mode === 'live' && !state.enriching && !state.scheduleSyncing) saveSnapshot();
    return result;
  };

  function installFilterControls() {
    const filters = $('.filters');
    if (!filters || $('#sortFilter')) return;

    const sort = document.createElement('select');
    sort.id = 'sortFilter';
    sort.setAttribute('aria-label', 'Releases sortieren');
    sort.innerHTML = '<option value="relevance">Sortierung: Relevanz</option><option value="date">Datum: bald zuerst</option><option value="popularity">Beliebtheit</option><option value="rating">TMDB-Wertung</option>';
    sort.value = ['relevance','date','popularity','rating'].includes(sortMode) ? sortMode : 'relevance';
    sort.onchange = () => {
      sortMode = sort.value;
      localStorage.setItem(SORT_KEY, sortMode);
      renderReleases();
    };

    const providerToggle = document.createElement('label');
    providerToggle.className = 'toggle-filter personal-provider-filter';
    providerToggle.innerHTML = '<input type="checkbox" id="preferredProvidersOnly" /><span></span><b id="preferredProviderLabel">Meine Anbieter</b>';
    filters.append(sort, providerToggle);
    $('#preferredProvidersOnly').checked = preferredProvidersOnly;
    $('#preferredProvidersOnly').onchange = event => {
      preferredProvidersOnly = event.target.checked;
      localStorage.setItem(PROVIDERS_ONLY_KEY, String(preferredProvidersOnly));
      renderReleases();
    };
    updatePersonalMode();
  }

  function installSettingsControls() {
    const root = $('.settings-content');
    if (!root || $('#stabilitySettings')) return;
    const section = document.createElement('section');
    section.id = 'stabilitySettings';
    section.className = 'stability-settings';
    section.innerHTML = `
      <div class="stability-heading"><div><span class="section-kicker">V0.0.9 · PERSONALISIERUNG</span><h3>Meine Anbieter & lokale Daten</h3></div><span class="health-pill" id="cacheHealthPill">Cache</span></div>
      <p class="stability-copy">Wähle die Dienste, die für deinen persönlichen Feed relevant sind. Mit <strong>Meine Anbieter</strong> blendet StreamRadar andere Streaming-Provider aus, ohne Herkunfts-/Studioinformationen zu verlieren.</p>
      <div class="provider-pref-actions"><button type="button" class="text-button" id="providersAll">Alle wählen</button><button type="button" class="text-button" id="providersNone">Keine wählen</button></div>
      <div class="provider-pref-grid" id="providerPrefGrid"></div>
      <div class="stability-meta" id="stabilityMeta"></div>
      <div class="stability-actions"><button type="button" class="ghost-button" id="clearRadarCache">Cache leeren</button><button type="button" class="ghost-button" id="exportWatchlist">Merkliste sichern</button><button type="button" class="ghost-button" id="importWatchlist">Merkliste importieren</button><input type="file" id="watchlistImportFile" accept="application/json,.json" hidden /></div>`;
    root.appendChild(section);
    renderProviderPreferences();

    $('#providersAll').onclick = () => { preferredProviders = new Set(allProviderNames); persistProviders(); };
    $('#providersNone').onclick = () => { preferredProviders = new Set(); persistProviders(); };
    $('#clearRadarCache').onclick = () => {
      localStorage.removeItem(CACHE_KEY);
      updateHealth();
      updateSettingsSummary();
      showToast('Lokaler Radar-Cache wurde geleert.');
    };
    $('#exportWatchlist').onclick = exportWatchlist;
    $('#importWatchlist').onclick = () => $('#watchlistImportFile').click();
    $('#watchlistImportFile').onchange = importWatchlist;
    updateSettingsSummary();
  }

  function renderProviderPreferences() {
    const root = $('#providerPrefGrid');
    if (!root) return;
    root.innerHTML = allProviderNames.map(name => {
      const checked = preferredProviders.has(name) ? 'checked' : '';
      const provider = providerFor(name);
      const logo = provider?.logoPath ? `<img src="${tmdb.image(provider.logoPath, 'w92')}" alt="" loading="lazy"/>` : '<i></i>';
      return `<label class="provider-pref-item">${logo}<span>${escapeHTML(name)}</span><input type="checkbox" value="${escapeHTML(name)}" ${checked}/></label>`;
    }).join('');
    $$('#providerPrefGrid input').forEach(input => input.onchange = () => {
      input.checked ? preferredProviders.add(input.value) : preferredProviders.delete(input.value);
      persistProviders(false);
    });
  }

  function persistProviders(rerenderGrid = true) {
    localStorage.setItem(PROVIDERS_KEY, JSON.stringify([...preferredProviders]));
    if (rerenderGrid) renderProviderPreferences();
    updatePersonalMode();
    renderReleases();
  }

  function updatePersonalMode() {
    const label = $('#preferredProviderLabel');
    if (label) label.textContent = preferredProviders.size === allProviderNames.length ? 'Meine Anbieter' : `Meine Anbieter (${preferredProviders.size})`;
    document.body.classList.toggle('personal-providers-active', preferredProvidersOnly);
  }

  function updateHealth() {
    let pill = $('#syncHealth');
    if (!pill) {
      pill = document.createElement('span');
      pill.id = 'syncHealth';
      pill.className = 'sync-health';
      $('#dataStatus')?.insertBefore(pill, $('#statusAction'));
    }
    if (!pill) return;
    const cached = parseCache();
    const online = navigator.onLine;
    pill.dataset.state = online ? 'online' : 'offline';
    pill.textContent = online ? (cached ? `Cache ${humanAge(cacheAge(cached))}` : 'Online') : 'Offline';
  }

  function updateSettingsSummary() {
    const meta = $('#stabilityMeta');
    const pill = $('#cacheHealthPill');
    const cached = parseCache();
    if (pill) {
      pill.textContent = cached ? `Cache · ${humanAge(cacheAge(cached))}` : 'Cache leer';
      pill.dataset.state = cached && cacheIsFresh(cached) ? 'fresh' : cached ? 'stale' : 'empty';
    }
    if (meta) {
      const count = cached?.releases?.length || 0;
      meta.innerHTML = `<span><strong>${preferredProviders.size}</strong> von ${allProviderNames.length} Anbietern gewählt</span><span><strong>${state.watchlist.size}</strong> Titel in der Merkliste</span><span><strong>${count}</strong> Events lokal gepuffert</span>`;
    }
  }

  function showToast(message, type = 'info') {
    let root = $('#toastStack');
    if (!root) {
      root = document.createElement('div');
      root.id = 'toastStack';
      root.className = 'toast-stack';
      document.body.appendChild(root);
    }
    const toast = document.createElement('div');
    toast.className = `radar-toast ${type}`;
    toast.textContent = message;
    root.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 220);
    }, 3200);
  }

  function exportWatchlist() {
    const payload = { app:'StreamRadar', version:VERSION, exportedAt:new Date().toISOString(), watchlist:[...state.watchlist] };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `streamradar-watchlist-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function importWatchlist(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const list = Array.isArray(data) ? data : data.watchlist;
      if (!Array.isArray(list)) throw new Error('WATCHLIST_FORMAT');
      const normalized = list.map(String).filter(Boolean);
      state.watchlist = new Set([...state.watchlist, ...normalized]);
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify([...state.watchlist]));
      renderReleases();
      updateSettingsSummary();
      showToast(`${normalized.length} Merkliste-Einträge importiert.`);
    } catch {
      showToast('Die Merkliste-Datei konnte nicht gelesen werden.', 'warning');
    }
  }

  function prepareCalendarPersonalization() {
    if (!preferredProvidersOnly || temporarySource) return;
    temporarySource = state.releases;
    state.releases = personalized(temporarySource);
    queueMicrotask(() => {
      if (temporarySource) state.releases = temporarySource;
      temporarySource = null;
    });
  }

  function installCalendarBridge() {
    const panel = $('#calendarPanel');
    if (!panel) return;
    panel.addEventListener('click', prepareCalendarPersonalization, true);
    panel.addEventListener('change', prepareCalendarPersonalization, true);
  }

  function installSearchDebounce() {
    const search = $('#searchInput');
    if (!search) return;
    let timer = null;
    search.oninput = () => {
      clearTimeout(timer);
      timer = setTimeout(renderReleases, 120);
    };
  }

  function normalizeWatchlist() {
    const clean = [...state.watchlist].map(String).filter(Boolean);
    state.watchlist = new Set(clean);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(clean));
  }

  window.addEventListener('offline', () => {
    updateHealth();
    showToast('Keine Netzwerkverbindung – StreamRadar bleibt mit lokalen Daten nutzbar.', 'warning');
    if (state.mode !== 'live') restoreCache({ allowStale:true });
  });
  window.addEventListener('online', () => {
    updateHealth();
    showToast('Verbindung wiederhergestellt – Live-Daten werden aktualisiert.');
    if (localStorage.getItem(TOKEN_KEY)) loadLiveData();
  });

  installFilterControls();
  installSettingsControls();
  installCalendarBridge();
  installSearchDebounce();
  normalizeWatchlist();
  updateHealth();
  updateSettingsSummary();

  if (localStorage.getItem(TOKEN_KEY) && parseCache()) restoreCache({ allowStale:false });

  window.StreamRadarStability = {
    VERSION,
    CACHE_TTL_MS,
    saveSnapshot,
    restoreCache,
    cacheIsFresh,
    getPreferredProviders: () => [...preferredProviders],
    isPreferredProvidersOnly: () => preferredProvidersOnly,
    getSortMode: () => sortMode
  };
})();
