(() => {
  const VERSION = '0.0.10';
  const CACHE_KEY = 'streamradar-radar-cache-v1';
  const PROVIDERS_KEY = 'streamradar-preferred-providers';
  const WATCHLIST_KEY = 'streamradar-watchlist';
  const MAX_CACHE_EVENTS = 350;
  const CACHE_LIMITS = [350, 250, 160, 100, 60];

  const baseRenderReleases = renderReleases;
  const baseLoadLiveData = loadLiveData;
  const baseEnrichRadarMetadata = enrichRadarMetadata;
  const baseSetView = setView;
  let syncPromise = null;
  let lastSyncStart = 0;

  const cacheFields = [
    'id','entityId','tmdbId','mediaType','type','title','originalTitle','description','releaseDate',
    'eventKind','eventLabel','eventSeason','eventEpisode','eventEpisodeName','eventChannel','eventRuntime',
    'eventAirtime','eventAirstamp','posterPath','backdropPath','rating','popularity','services','serviceLogos',
    'original','originalBrand','originalConfidence','originalScore','originType','originLabel','originalReason',
    'originalLogoPath','originalLogoSource','overrideApplied','radarEligible','source','eventSource','scheduleConfirmed',
    'tvmazeEpisodeId','tvmazeShowId','tvmazeUrl','externalIds','accent'
  ];

  function showToast(message, type = 'info') {
    let root = $('#toastStack');
    if (!root) {
      root = document.createElement('div');
      root.id = 'toastStack';
      root.className = 'toast-stack';
      root.setAttribute('aria-live', 'polite');
      root.setAttribute('aria-atomic', 'false');
      document.body.appendChild(root);
    }
    const toast = document.createElement('div');
    toast.className = `radar-toast ${type}`;
    toast.setAttribute('role', type === 'warning' ? 'alert' : 'status');
    toast.textContent = message;
    root.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 220);
    }, 3200);
  }

  function eventCacheKey(item) {
    return [
      item?.mediaType || item?.type || '',
      item?.tmdbId || item?.entityId || item?.id || '',
      item?.eventKind || '',
      item?.eventSeason || 0,
      item?.eventEpisode || 0,
      item?.releaseDate || ''
    ].join('|');
  }

  function validCachedEvent(item) {
    return Boolean(item && typeof item === 'object' && item.title && item.releaseDate && (item.id || item.entityId || item.tmdbId));
  }

  function compactEvent(item) {
    const compact = {};
    cacheFields.forEach(key => {
      if (item[key] !== undefined && item[key] !== null) compact[key] = item[key];
    });
    if (typeof compact.description === 'string' && compact.description.length > 1200) compact.description = `${compact.description.slice(0, 1197)}…`;
    if (Array.isArray(compact.services)) compact.services = [...new Set(compact.services.map(String).filter(Boolean))].slice(0, 12);
    if (compact.serviceLogos && typeof compact.serviceLogos === 'object') {
      const allowed = new Set(compact.services || []);
      compact.serviceLogos = Object.fromEntries(Object.entries(compact.serviceLogos).filter(([name, path]) => allowed.has(name) && path));
    }
    return compact;
  }

  function normalizedCachedEvents(items = []) {
    const map = new Map();
    items.filter(validCachedEvent).forEach(item => {
      const compact = compactEvent(item);
      const key = eventCacheKey(compact);
      const existing = map.get(key);
      if (!existing || (compact.popularity || 0) > (existing.popularity || 0)) map.set(key, compact);
    });
    return [...map.values()].sort((a, b) => String(a.releaseDate).localeCompare(String(b.releaseDate)) || (b.popularity || 0) - (a.popularity || 0));
  }

  function writeCache(payload, events) {
    for (const limit of CACHE_LIMITS) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ...payload, releases: events.slice(0, Math.min(limit, MAX_CACHE_EVENTS)) }));
        return Math.min(limit, events.length);
      } catch (error) {
        if (limit === CACHE_LIMITS.at(-1)) console.warn('StreamRadar: kompakter Cache konnte nicht gespeichert werden.', error);
      }
    }
    return 0;
  }

  function saveCompactSnapshot() {
    if (state.mode !== 'live' || !Array.isArray(state.releases) || !state.releases.length) return 0;
    const events = normalizedCachedEvents(state.releases);
    return writeCache({
      version: VERSION,
      savedAt: Date.now(),
      providerMap: Array.isArray(state.providerMap) ? state.providerMap : [],
      scheduleStats: state.scheduleStats || {},
      region: tmdb.REGION || 'AT'
    }, events);
  }

  function sanitizeExistingCache() {
    let cached;
    try {
      cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    } catch {
      localStorage.removeItem(CACHE_KEY);
      return { changed:true, events:0 };
    }
    if (!cached) return { changed:false, events:0 };
    if (!Array.isArray(cached.releases) || !cached.savedAt || (cached.region && cached.region !== (tmdb.REGION || 'AT'))) {
      localStorage.removeItem(CACHE_KEY);
      return { changed:true, events:0 };
    }
    const events = normalizedCachedEvents(cached.releases);
    const changed = events.length !== cached.releases.length || cached.version !== VERSION;
    if (changed) writeCache({ ...cached, version:VERSION, region:tmdb.REGION || 'AT' }, events);
    return { changed, events:events.length };
  }

  function sanitizePreferences() {
    const allowedProviders = new Set(tmdb.SERVICE_DEFINITIONS.map(item => item.name));
    try {
      const stored = JSON.parse(localStorage.getItem(PROVIDERS_KEY) || 'null');
      if (Array.isArray(stored)) {
        const cleaned = [...new Set(stored.map(String).filter(name => allowedProviders.has(name)))];
        if (JSON.stringify(cleaned) !== JSON.stringify(stored)) localStorage.setItem(PROVIDERS_KEY, JSON.stringify(cleaned));
      }
    } catch {
      localStorage.removeItem(PROVIDERS_KEY);
    }

    try {
      const list = JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]');
      const cleaned = Array.isArray(list) ? [...new Set(list.map(value => String(value).trim()).filter(Boolean))] : [];
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(cleaned));
      state.watchlist = new Set(cleaned);
    } catch {
      localStorage.setItem(WATCHLIST_KEY, '[]');
      state.watchlist = new Set();
    }
  }

  function setSyncBusy(busy) {
    const button = $('#refreshData');
    if (!button) return;
    button.disabled = busy;
    button.classList.toggle('is-syncing', busy);
    button.setAttribute('aria-busy', String(busy));
    button.title = busy ? 'Synchronisierung läuft …' : 'Daten aktualisieren';
  }

  loadLiveData = async function(options = {}) {
    if (syncPromise || state.loading || state.enriching || state.scheduleSyncing) {
      showToast('Synchronisierung läuft bereits.');
      return syncPromise;
    }
    const now = Date.now();
    if (now - lastSyncStart < 1000) return syncPromise;
    lastSyncStart = now;
    setSyncBusy(true);
    syncPromise = Promise.resolve(baseLoadLiveData(options)).finally(() => {
      syncPromise = null;
      if (!state.enriching && !state.scheduleSyncing) setSyncBusy(false);
    });
    return syncPromise;
  };

  enrichRadarMetadata = async function(token) {
    setSyncBusy(true);
    try {
      return await baseEnrichRadarMetadata(token);
    } finally {
      saveCompactSnapshot();
      setSyncBusy(false);
      updatePolishHints();
    }
  };

  function updateVersionSurface() {
    document.documentElement.dataset.streamradarVersion = VERSION;
    window.StreamRadarVersion = VERSION;
    const radarVersion = document.querySelector('.radar-footer > span:last-child');
    if (radarVersion) radarVersion.textContent = `v${VERSION}`;
    $$('.footer-meta span').forEach(span => {
      if (/^Version\s/i.test(span.textContent || '')) span.textContent = `Version ${VERSION}`;
    });
  }

  function currentPreferredFilter(items) {
    const stability = window.StreamRadarStability;
    if (!stability?.isPreferredProvidersOnly?.()) return items;
    const preferred = new Set(stability.getPreferredProviders?.() || []);
    return items.filter(item => (item.services || []).some(service => preferred.has(service)));
  }

  function withCalendarPersonalization(callback) {
    if (!Array.isArray(state.releases)) return callback();
    const full = state.releases;
    state.releases = currentPreferredFilter(full);
    try {
      return callback();
    } finally {
      state.releases = full;
    }
  }

  setView = function(view) {
    if (view === 'calendar') {
      const result = withCalendarPersonalization(() => baseSetView(view));
      updateCalendarLayout();
      return result;
    }
    return baseSetView(view);
  };

  function updateCalendarLayout() {
    const panel = $('#calendarPanel');
    if (!panel) return;
    const mode = $('[data-calendar-mode].active')?.dataset.calendarMode || 'month';
    panel.dataset.mode = mode;
    const grid = $('#calendarGrid');
    if (grid) {
      grid.hidden = mode !== 'month';
      grid.setAttribute('aria-hidden', String(mode !== 'month'));
    }
    let hint = $('#calendarModeHint');
    if (!hint) {
      hint = document.createElement('div');
      hint.id = 'calendarModeHint';
      hint.className = 'calendar-mode-hint';
      $('#calendarTimeline')?.before(hint);
    }
    const labels = {
      day:'Tagesansicht · alle Events des gewählten Tages',
      week:'Wochenansicht · chronologische Timeline',
      month:'Monatsraster · darunter die chronologische Timeline',
      '90':'90-Tage-Ansicht · chronologische Timeline'
    };
    if (hint) hint.textContent = labels[mode] || labels.month;
  }

  function updatePolishHints() {
    const stability = window.StreamRadarStability;
    const empty = $('#emptyState');
    const preferredOnly = Boolean(stability?.isPreferredProvidersOnly?.());
    const preferred = stability?.getPreferredProviders?.() || [];
    if (empty) {
      const copy = empty.querySelector('p');
      if (copy) copy.textContent = preferredOnly && preferred.length === 0 && !empty.hidden
        ? 'Unter „Meine Anbieter“ ist aktuell kein Streaming-Dienst ausgewählt.'
        : 'Ändere deine Filter oder suche nach einem anderen Titel.';
    }
    updateCalendarLayout();
  }

  renderReleases = function() {
    const result = baseRenderReleases();
    updatePolishHints();
    return result;
  };

  function rebindFilterHandlers() {
    ['#typeFilter','#eventFilter','#periodFilter','#brandFilter','#originalsOnly'].forEach(selector => {
      const element = $(selector);
      if (!element) return;
      element.onchange = () => renderReleases();
    });
  }

  function installImageFallback() {
    document.addEventListener('error', event => {
      const image = event.target;
      if (!(image instanceof HTMLImageElement)) return;
      image.hidden = true;
      image.closest('.poster,.provider-pill,.provider-pref-item,.timeline-provider,.timeline-origin,.calendar-mini-event,.origin-logo-wrap')?.classList.add('image-failed');
    }, true);
  }

  function installImprovedWatchlistImport() {
    const input = $('#watchlistImportFile');
    if (!input) return;
    input.onchange = async event => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        const list = Array.isArray(data) ? data : data?.watchlist;
        if (!Array.isArray(list)) throw new Error('WATCHLIST_FORMAT');
        const incoming = [...new Set(list.map(value => String(value).trim()).filter(Boolean))];
        const before = state.watchlist.size;
        incoming.forEach(value => state.watchlist.add(value));
        const added = state.watchlist.size - before;
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify([...state.watchlist]));
        renderReleases();
        showToast(added ? `${added} neue Merkliste-Einträge importiert.` : 'Merkliste war bereits vollständig enthalten.');
      } catch {
        showToast('Die Merkliste-Datei ist ungültig oder beschädigt.', 'warning');
      }
    };
  }

  function installCalendarModeObservers() {
    document.addEventListener('click', event => {
      if (event.target.closest('[data-calendar-mode],[data-calendar-date],#calendarPrev,#calendarNext,#calendarToday')) {
        queueMicrotask(updateCalendarLayout);
      }
    });
  }

  sanitizePreferences();
  const cacheResult = sanitizeExistingCache();
  updateVersionSurface();
  rebindFilterHandlers();
  installImageFallback();
  installImprovedWatchlistImport();
  installCalendarModeObservers();
  updatePolishHints();
  setSyncBusy(Boolean(state.loading || state.enriching || state.scheduleSyncing));

  if (cacheResult.changed && cacheResult.events) console.info(`StreamRadar: Cache für v${VERSION} normalisiert (${cacheResult.events} Events).`);

  window.StreamRadarPolish = {
    VERSION,
    saveCompactSnapshot,
    sanitizeExistingCache,
    isSyncing: () => Boolean(syncPromise || state.loading || state.enriching || state.scheduleSyncing)
  };
})();
