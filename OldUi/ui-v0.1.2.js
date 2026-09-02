/* StreamRadar consolidated UI runtime — current version 0.1.2 */
(() => {
  const VERSION = '0.1.1';
  const baseRenderReleases = renderReleases;
  const baseSetView = setView;

  const viewTitles = {
    discover: ['ENTDECKEN', 'Dein Streaming-Radar'],
    calendar: ['KALENDER', 'Release-Kalender'],
    seasons: ['STAFFEL-RADAR', 'Neue Staffeln'],
    episodes: ['EPISODEN-RADAR', 'Neue Episoden'],
    upcoming: ['DEMNÄCHST', 'Nächste 30 Tage'],
    watchlist: ['MERKLISTE', 'Gespeicherte Titel'],
    today: ['HEUTE', 'Heute erschienen'],
    premieres: ['PREMIEREN', 'Neue Filme & Serien']
  };

  function preferredFiltered(items) {
    const stability = window.StreamRadarStability;
    if (!stability?.isPreferredProvidersOnly?.()) return items;
    const preferred = new Set(stability.getPreferredProviders?.() || []);
    return items.filter(item => (item.services || []).some(service => preferred.has(service)));
  }

  function dashboardSource() {
    let items = state.releases.filter(item => item.radarEligible !== false);
    items = preferredFiltered(items);
    if (state.service !== 'all') {
      items = items.filter(item => item.services?.includes(state.service) || item.originalBrand === state.service);
    }
    return [...items].sort(sortByRadarRelevance);
  }

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 11) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  }

  function longDate() {
    return new Intl.DateTimeFormat('de-AT', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    }).format(new Date());
  }

  function hasAdvancedFilter() {
    return Boolean(
      $('#searchInput')?.value.trim()
      || $('#typeFilter')?.value !== 'all'
      || $('#eventFilter')?.value !== 'all'
      || $('#periodFilter')?.value !== 'all'
      || $('#brandFilter')?.value !== 'all'
      || $('#originalsOnly')?.checked
    );
  }

  function railCard(item) {
    const imagePath = item.backdropPath || item.posterPath;
    const image = imagePath
      ? `<img src="${tmdb.image(imagePath, item.backdropPath ? 'w780' : 'w500')}" alt="" loading="lazy" />`
      : `<span class="rail-monogram">${escapeHTML(item.title.split(' ').map(part => part[0]).join('').slice(0, 3))}</span>`;
    const saved = state.watchlist.has(watchKey(item));
    const provider = item.services?.[0] || item.originalBrand || 'Streaming';
    return `<article class="rail-card" tabindex="0" role="button" data-rail-id="${escapeHTML(item.id)}" style="--rail-accent:${item.accent}">
      <div class="rail-art">${image}<span class="rail-gradient"></span><span class="rail-event">${escapeHTML(eventLabel(item))}</span><button class="rail-save ${saved ? 'saved' : ''}" data-rail-watch="${escapeHTML(watchKey(item))}" aria-label="${saved ? 'Von Merkliste entfernen' : 'Zur Merkliste hinzufügen'}">${saved ? '✓' : '+'}</button></div>
      <div class="rail-copy"><strong>${escapeHTML(item.title)}</strong><span>${escapeHTML(provider)} · ${escapeHTML(formatReleaseDate(item.releaseDate))}${item.eventKind === 'episode' ? ` · ${escapeHTML(eventDetail(item))}` : ''}</span></div>
    </article>`;
  }

  function railSection(kicker, title, items, action, actionLabel = 'Alle anzeigen') {
    if (!items.length) return '';
    return `<section class="media-rail"><div class="rail-heading"><div><span class="section-kicker">${escapeHTML(kicker)}</span><h2>${escapeHTML(title)}</h2></div><button class="rail-more" data-rail-action="${escapeHTML(action)}">${escapeHTML(actionLabel)} <span>→</span></button></div><div class="rail-track">${items.slice(0, 10).map(railCard).join('')}</div></section>`;
  }

  function renderHomeDashboard() {
    const root = $('#homeRails');
    const dashboard = $('#homeDashboard');
    if (!root || !dashboard) return;

    const showDashboard = state.view === 'discover' && !hasAdvancedFilter();
    dashboard.hidden = !showDashboard;
    if (!showDashboard) return;

    const source = dashboardSource();
    const today = source.filter(item => dayDistance(item.releaseDate) === 0);
    const seasons = source.filter(item => item.eventKind === 'season-premiere' && dayDistance(item.releaseDate) >= 0 && dayDistance(item.releaseDate) <= 90);
    const upcoming = source.filter(item => dayDistance(item.releaseDate) >= 0 && dayDistance(item.releaseDate) <= 30 && item.eventKind !== 'episode');
    const originals = source.filter(item => item.original === true && dayDistance(item.releaseDate) >= 0 && dayDistance(item.releaseDate) <= 60);
    const episodes = source.filter(item => item.eventKind === 'episode' && dayDistance(item.releaseDate) >= 0 && dayDistance(item.releaseDate) <= 14);

    root.innerHTML = [
      railSection('HEUTE', 'Heute auf deinem Radar', today, 'today'),
      railSection('STAFFELSTARTS', 'Neue Staffeln', seasons, 'seasons'),
      railSection('DEMNÄCHST', 'Filme & Serien in den nächsten 30 Tagen', upcoming, 'upcoming'),
      railSection('ORIGINALS', 'Originals & exklusive Starts', originals, 'originals'),
      railSection('EPISODEN', 'Neue Episoden', episodes, 'episodes')
    ].join('');

    $$('.rail-card').forEach(card => {
      card.onclick = event => {
        if (event.target.closest('.rail-save')) return;
        openDetails(card.dataset.railId);
      };
      card.onkeydown = event => {
        if ((event.key === 'Enter' || event.key === ' ') && !event.target.closest('.rail-save')) {
          event.preventDefault();
          openDetails(card.dataset.railId);
        }
      };
    });
    $$('.rail-save').forEach(button => button.onclick = event => {
      event.stopPropagation();
      toggleWatchlist(button.dataset.railWatch);
    });
    $$('[data-rail-action]').forEach(button => button.onclick = () => {
      const action = button.dataset.railAction;
      if (action === 'originals') {
        $('#originalsOnly').checked = true;
        renderReleases();
        $('#releases').scrollIntoView({ behavior:'smooth' });
      } else {
        setView(action);
      }
    });
  }

  function renderWelcome() {
    const counts = radarCounts();
    const greetingNode = $('#welcomeGreeting');
    const dateNode = $('#welcomeDate');
    const stats = $('#homeQuickStats');
    if (greetingNode) greetingNode.textContent = greeting();
    if (dateNode) dateNode.textContent = longDate();
    if (stats) {
      stats.innerHTML = [
        ['today', counts.today, 'Heute'],
        ['seasons', counts.seasons, 'Staffelstarts'],
        ['episodes', counts.episodes, 'Episoden · 14 Tage'],
        ['upcoming', counts.premieres, 'Premieren · 30 Tage']
      ].map(([view, count, label]) => `<button class="home-stat" data-home-view="${view}"><strong>${count}</strong><span>${escapeHTML(label)}</span></button>`).join('');
      $$('[data-home-view]').forEach(button => button.onclick = () => setView(button.dataset.homeView));
    }
  }

  function updateFilterUX() {
    const values = [
      $('#typeFilter')?.value !== 'all',
      $('#eventFilter')?.value !== 'all',
      $('#periodFilter')?.value !== 'all',
      $('#brandFilter')?.value !== 'all',
      $('#originalsOnly')?.checked,
      Boolean($('#searchInput')?.value.trim()),
      state.service !== 'all'
    ];
    const count = values.filter(Boolean).length;
    const badge = $('#activeFilterCount');
    const toggle = $('#toggleAdvancedFilters');
    if (badge) {
      badge.textContent = count ? String(count) : '';
      badge.hidden = !count;
    }
    if (toggle) toggle.classList.toggle('has-active-filters', Boolean(count));
  }

  function updateSidebarStatus() {
    const source = $('#dataStatus');
    const label = $('#sidebarStatusLabel');
    const copy = $('#sidebarStatusCopy');
    if (!source || !label || !copy) return;
    const stateName = source.dataset.state || 'demo';
    label.textContent = stateName === 'live' ? 'Radar online' : stateName === 'loading' ? 'Synchronisiert' : 'Demo-Modus';
    copy.textContent = ($('#dataStatusLabel')?.textContent || 'StreamRadar').trim();
    $('#sidebarStatus')?.setAttribute('data-state', stateName);
  }

  function updateViewSurface(view = state.view) {
    const [kicker, title] = viewTitles[view] || viewTitles.discover;
    if ($('#topbarKicker')) $('#topbarKicker').textContent = kicker;
    if ($('#topbarTitle')) $('#topbarTitle').textContent = title;
    document.body.dataset.streamradarView = view;
    const hero = $('.hero');
    if (hero) hero.hidden = view !== 'discover';
    if ($('#homeDashboard')) $('#homeDashboard').hidden = view !== 'discover' || hasAdvancedFilter();
    $$('.sidebar-link').forEach(link => link.classList.toggle('active', link.dataset.view === view));
  }

  function installShellControls() {
    $('#sidebarSettings')?.addEventListener('click', openSettings);
    $('#mobileNavToggle')?.addEventListener('click', () => document.body.classList.toggle('sidebar-open'));
    $('#sidebarBackdrop')?.addEventListener('click', () => document.body.classList.remove('sidebar-open'));
    $$('.sidebar-link').forEach(link => link.addEventListener('click', () => document.body.classList.remove('sidebar-open')));

    const toggle = $('#toggleAdvancedFilters');
    if (toggle) toggle.onclick = () => {
      const release = $('.release-section');
      const open = !release.classList.contains('filter-panel-open');
      release.classList.toggle('filter-panel-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') document.body.classList.remove('sidebar-open');
    });

    const status = $('#dataStatus');
    if (status) new MutationObserver(updateSidebarStatus).observe(status, { attributes:true, childList:true, subtree:true });
  }

  renderReleases = function() {
    const result = baseRenderReleases();
    renderWelcome();
    renderHomeDashboard();
    updateFilterUX();
    updateSidebarStatus();
    updateViewSurface();
    return result;
  };

  setView = function(view) {
    const result = baseSetView(view);
    updateViewSurface(view);
    if (view === 'discover') requestAnimationFrame(() => window.scrollTo({ top:0, behavior:'smooth' }));
    return result;
  };

  document.documentElement.dataset.streamradarVersion = VERSION;
  window.StreamRadarVersion = VERSION;
  installShellControls();
  updateViewSurface();
  renderReleases();

  window.StreamRadarUI011 = Object.freeze({ VERSION, renderHomeDashboard, updateViewSurface });
})();

(() => {
  const VERSION = '0.1.2';
  const SEEN_KEY = 'streamradar-seen-events-v1';
  const LAST_VISIT_KEY = 'streamradar-last-visit-v1';
  const previousSeen = new Set(safeJSON(localStorage.getItem(SEEN_KEY) || '[]', []).map(String));
  const previousVisit = Number(localStorage.getItem(LAST_VISIT_KEY) || 0);
  const baseRenderReleases = renderReleases;

  const ICONS = {
    home:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.8 12 3l9 7.8v9.7a.5.5 0 0 1-.5.5h-5.2v-6.2H8.7V21H3.5a.5.5 0 0 1-.5-.5z"/></svg>',
    calendar:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2v3M18 2v3M3.5 8.5h17M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm3 8h3v3H8zm5 0h3v3h-3z"/></svg>',
    seasons:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="m9 8 7 4-7 4z"/></svg>',
    episodes:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="m10 8 6 4-6 4z"/></svg>',
    upcoming:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3.5 2"/></svg>',
    watch:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5 4.3 13A5.2 5.2 0 0 1 12 6.1 5.2 5.2 0 0 1 19.7 13z"/></svg>',
    settings:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.5 1A8 8 0 0 0 14.8 6L14.5 3h-5L9.2 6a8 8 0 0 0-1.6 1L5 6 3 9.5 5.1 11A7 7 0 0 0 5 12a7 7 0 0 0 .1 1L3 14.5 5 18l2.6-1a8 8 0 0 0 1.6 1l.3 3h5l.3-3a8 8 0 0 0 1.6-1l2.6 1 2-3.5-2.1-1.5a7 7 0 0 0 .1-1Z"/></svg>',
    search:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>',
    refresh:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5h-5M4 18v-5h5"/><path d="M18.5 10A7 7 0 0 0 6 7.5L4 11M5.5 14A7 7 0 0 0 18 16.5l2-3.5"/></svg>',
    palette:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="9" cy="9" r="1"/><circle cx="14" cy="8" r="1"/><circle cx="16" cy="13" r="1"/><path d="M8.5 16.5h2"/></svg>',
    chevron:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>'
  };

  function eventKey(item) {
    return [item.mediaType || item.type, item.tmdbId || item.entityId || item.id, item.eventKind || '', item.eventSeason || 0, item.eventEpisode || 0, item.releaseDate || ''].join(':');
  }

  function eligibleItems() {
    let items = state.releases.filter(item => item.radarEligible !== false);
    const stability = window.StreamRadarStability;
    if (stability?.isPreferredProvidersOnly?.()) {
      const preferred = new Set(stability.getPreferredProviders?.() || []);
      items = items.filter(item => (item.services || []).some(service => preferred.has(service)));
    }
    if (state.service !== 'all') items = items.filter(item => item.services?.includes(state.service) || item.originalBrand === state.service);
    return [...items].sort(sortByRadarRelevance);
  }

  function installIcons() {
    const viewIcons = { discover:'home', calendar:'calendar', seasons:'seasons', episodes:'episodes', upcoming:'upcoming', watchlist:'watch' };
    $$('.sidebar-link').forEach(link => {
      const slot = link.querySelector('.sidebar-icon');
      if (slot && viewIcons[link.dataset.view]) slot.innerHTML = ICONS[viewIcons[link.dataset.view]];
    });
    const settingsSlot = $('#sidebarSettings .sidebar-icon');
    if (settingsSlot) settingsSlot.innerHTML = ICONS.settings;
    const searchMark = $('.search-box > span');
    if (searchMark) searchMark.innerHTML = ICONS.search;
    if ($('#refreshData')) $('#refreshData').innerHTML = ICONS.refresh;
    if ($('#openSettings')) $('#openSettings').innerHTML = ICONS.settings;
    if ($('#themePulse')) $('#themePulse').innerHTML = ICONS.palette;
  }

  function newSinceItems() {
    if (!previousSeen.size) return [];
    if (state.loading || state.enriching || state.scheduleSyncing) return [];
    if (localStorage.getItem('streamradar-tmdb-token') && state.mode !== 'live') return [];
    return eligibleItems().filter(item => !previousSeen.has(eventKey(item))).slice(0, 12);
  }

  function miniCard(item) {
    const imagePath = item.backdropPath || item.posterPath;
    const image = imagePath ? `<img src="${tmdb.image(imagePath, item.backdropPath ? 'w780' : 'w500')}" alt="" loading="lazy"/>` : '';
    return `<article class="rail-card new-since-card" tabindex="0" role="button" data-v012-id="${escapeHTML(item.id)}" style="--rail-accent:${item.accent}"><div class="rail-art">${image}<span class="rail-gradient"></span><span class="rail-event">NEU · ${escapeHTML(eventLabel(item))}</span></div><div class="rail-copy"><strong>${escapeHTML(item.title)}</strong><span>${escapeHTML(item.services?.[0] || item.originalBrand || 'Streaming')} · ${escapeHTML(formatReleaseDate(item.releaseDate))}</span></div></article>`;
  }

  function renderNewSince() {
    const root = $('#homeRails');
    if (!root) return;
    root.querySelector('.new-since-rail')?.remove();
    $('.new-since-pill')?.remove();
    const items = newSinceItems();
    if (!items.length || state.view !== 'discover') return;
    const since = previousVisit ? new Intl.DateTimeFormat('de-AT', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }).format(new Date(previousVisit)) : 'deinem letzten Besuch';
    root.insertAdjacentHTML('afterbegin', `<section class="media-rail new-since-rail"><div class="rail-heading"><div><span class="section-kicker">NEU SEIT DEINEM LETZTEN BESUCH</span><h2>${items.length} neue Radar-Events</h2></div><span class="new-since-time">Seit ${escapeHTML(since)}</span></div><div class="rail-track">${items.map(miniCard).join('')}</div></section>`);
    $('#welcomeDate')?.insertAdjacentHTML('afterend', `<span class="new-since-pill">+${items.length} neu</span>`);
    $$('.new-since-card').forEach(card => {
      card.onclick = () => openDetails(card.dataset.v012Id);
      card.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openDetails(card.dataset.v012Id); } };
    });
  }

  function enhanceRails() {
    $$('.media-rail').forEach((section, index) => {
      if (section.dataset.railEnhanced === '1') return;
      const heading = section.querySelector('.rail-heading');
      const track = section.querySelector('.rail-track');
      if (!heading || !track) return;
      section.dataset.railEnhanced = '1';
      const existingMore = heading.querySelector('.rail-more');
      const controls = document.createElement('div');
      controls.className = 'rail-heading-actions';
      if (existingMore) controls.append(existingMore);
      controls.insertAdjacentHTML('beforeend', `<div class="rail-nav" aria-label="Reihe scrollen"><button type="button" data-rail-dir="-1" aria-label="Nach links">${ICONS.chevron}</button><button type="button" data-rail-dir="1" aria-label="Nach rechts">${ICONS.chevron}</button></div>`);
      heading.append(controls);
      controls.querySelectorAll('[data-rail-dir]').forEach(button => button.onclick = () => {
        const direction = Number(button.dataset.railDir);
        track.scrollBy({ left: direction * Math.max(320, track.clientWidth * .82), behavior:'smooth' });
      });
      const [prev, next] = controls.querySelectorAll('[data-rail-dir]');
      if (prev) prev.classList.add('rail-prev');
      const sync = () => {
        if (prev) prev.disabled = track.scrollLeft < 8;
        if (next) next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
      };
      track.addEventListener('scroll', sync, { passive:true });
      requestAnimationFrame(sync);
    });
  }

  function createSearchOverlay() {
    if ($('#globalSearchOverlay')) return;
    document.body.insertAdjacentHTML('beforeend', `<div class="global-search-overlay" id="globalSearchOverlay" hidden><div class="global-search-panel" role="dialog" aria-modal="false" aria-label="StreamRadar Suche"><div class="global-search-head"><div><span class="section-kicker">GLOBALE SUCHE</span><strong>Titel, Anbieter oder Herkunft suchen</strong></div><kbd>ESC</kbd></div><div class="global-search-results" id="globalSearchResults"></div><div class="global-search-foot"><span>↵ Details öffnen</span><span>Ctrl K · Suche</span></div></div></div>`);
    $('#globalSearchOverlay').addEventListener('mousedown', event => { if (event.target === $('#globalSearchOverlay')) closeSearch(); });
  }

  function searchResults(query) {
    const normalized = query.trim().toLowerCase();
    const source = eligibleItems();
    if (!normalized) return source.filter(item => dayDistance(item.releaseDate) >= 0).slice(0, 8);
    return source.filter(item => `${item.title} ${item.originalTitle || ''} ${(item.services || []).join(' ')} ${item.originalBrand || ''} ${eventLabel(item)}`.toLowerCase().includes(normalized)).slice(0, 10);
  }

  function renderSearch(query = $('#searchInput')?.value || '') {
    const root = $('#globalSearchResults');
    if (!root) return;
    const results = searchResults(query);
    root.innerHTML = results.length ? results.map(item => {
      const art = item.posterPath ? `<img src="${tmdb.image(item.posterPath, 'w185')}" alt=""/>` : `<span>${escapeHTML(item.title.slice(0, 1))}</span>`;
      return `<button type="button" class="global-search-result" data-search-id="${escapeHTML(item.id)}"><span class="global-search-art">${art}</span><span class="global-search-copy"><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(eventLabel(item))} · ${escapeHTML(formatReleaseDate(item.releaseDate))} · ${escapeHTML(item.services?.[0] || item.originalBrand || 'Streaming')}</small></span><span class="search-arrow">${ICONS.chevron}</span></button>`;
    }).join('') : `<div class="global-search-empty"><strong>Keine Treffer</strong><span>Versuche einen anderen Titel oder Anbieter.</span></div>`;
    $$('.global-search-result').forEach(button => button.onclick = () => { const id = button.dataset.searchId; closeSearch(); openDetails(id); });
  }

  function openSearch() {
    createSearchOverlay();
    const overlay = $('#globalSearchOverlay');
    overlay.hidden = false;
    document.body.classList.add('search-open');
    renderSearch();
  }

  function closeSearch(clear = true) {
    const overlay = $('#globalSearchOverlay');
    if (overlay) overlay.hidden = true;
    document.body.classList.remove('search-open');
    if (clear && $('#searchInput')) {
      $('#searchInput').value = '';
      renderReleases();
    }
  }

  function providerTiles(providers) {
    return providers.slice(0, 10).map(provider => `<span class="detail-provider-tile">${provider.logo_path ? `<img src="${tmdb.image(provider.logo_path, 'w92')}" alt=""/>` : '<i></i>'}<span>${escapeHTML(provider.provider_name)}</span></span>`).join('');
  }

  function renderPremiumDetail(item, details, maze, loading) {
    const backdrop = item.backdropPath ? tmdb.image(item.backdropPath, 'w1280') : '';
    const poster = item.posterPath ? tmdb.image(item.posterPath, 'w500') : '';
    const genres = details?.genres?.map(genre => genre.name) || [];
    const runtime = item.eventRuntime || (item.mediaType === 'movie' ? details?.runtime : details?.episode_run_time?.[0]);
    const seasonProviders = details?.seasonProviders?.providers || [];
    const providers = seasonProviders.length ? seasonProviders : (details?.providers || []);
    const watchLink = details?.seasonProviders?.watchLink || details?.watchLink;
    const tmdbUrl = item.tmdbId ? `https://www.themoviedb.org/${item.mediaType}/${item.tmdbId}` : null;
    const brand = item.originalBrand || details?.inferredOriginalBrand;
    const score = item.originalScore ?? details?.originalScore;
    const reason = item.originalReason || details?.originalReason || details?.originalEvidence;
    const saved = state.watchlist.has(watchKey(item));
    const episode = maze?.nextEpisode;
    const eventCopy = item.eventKind === 'episode' ? `S${item.eventSeason || '?'}E${item.eventEpisode || '?'}${item.eventEpisodeName ? ` · ${escapeHTML(item.eventEpisodeName)}` : ''}` : item.eventKind === 'season-premiere' ? `Staffel ${item.eventSeason || '?'}` : eventLabel(item);
    const heroStyle = backdrop ? `--premium-backdrop:url('${backdrop}');--detail-accent:${item.accent}` : `--detail-accent:${item.accent}`;
    const posterMarkup = poster ? `<img src="${poster}" alt="Poster von ${escapeHTML(item.title)}"/>` : `<span>${escapeHTML(item.title.split(' ').map(part => part[0]).join('').slice(0,3))}</span>`;
    const nextEpisode = episode ? `<section class="premium-detail-section next-episode-panel"><div><span class="section-kicker">${maze.nextIsNewSeason ? 'KOMMENDER STAFFELSTART' : 'NÄCHSTE EPISODE'}</span><h3>${maze.nextIsNewSeason ? `Staffel ${episode.season}` : `S${episode.season || '?'}E${episode.number || '?'} · ${escapeHTML(episode.name || '')}`}</h3><p>${escapeHTML(formatReleaseDate(episode.airdate))}${episode.runtime ? ` · ${episode.runtime} Min.` : ''}${maze.network ? ` · ${escapeHTML(maze.network)}` : ''}</p></div>${episode.image ? `<img src="${escapeHTML(episode.image)}" alt=""/>` : ''}</section>` : '';
    const originBlock = brand ? `<section class="premium-detail-section"><span class="section-kicker">HERKUNFT</span><div class="premium-origin"><div><strong>${escapeHTML(item.originLabel || (item.original ? 'Original von' : 'Herkunft'))} ${escapeHTML(brand)}</strong><span>${escapeHTML(confidenceText(item))}${score ? ` · Score ${score}` : ''}</span></div>${score ? `<b>${score}</b>` : ''}</div>${reason ? `<p class="premium-muted">${escapeHTML(reason)}</p>` : ''}</section>` : '';

    $('#dialogContent').innerHTML = `<div class="premium-detail" style="${heroStyle}"><div class="premium-detail-backdrop"></div><div class="premium-detail-hero"><div class="premium-poster">${posterMarkup}</div><div class="premium-title"><div class="premium-kickers"><span>${escapeHTML(eventLabel(item))}</span>${item.original ? '<span>ORIGINAL</span>' : ''}${isTVMazeEvent(item) || item.scheduleConfirmed ? '<span>TVMAZE ✓</span>' : ''}</div><h2>${escapeHTML(item.title)}</h2><p>${escapeHTML(eventCopy)} · ${escapeHTML(item.date)}</p><div class="premium-facts">${item.rating > 0 ? `<span>★ ${item.rating.toFixed(1)}</span>` : ''}${runtime ? `<span>${runtime} Min.</span>` : ''}${details?.number_of_seasons ? `<span>${details.number_of_seasons} Staffeln</span>` : ''}${genres.slice(0,3).map(genre => `<span>${escapeHTML(genre)}</span>`).join('')}<span>AT</span></div><div class="premium-actions"><button type="button" class="primary-button detail-watch-toggle ${saved ? 'saved' : ''}" id="detailWatchToggle">${saved ? '✓ In Merkliste' : '+ Merkliste'}</button>${watchLink ? `<a class="primary-button link-button" href="${escapeHTML(watchLink)}" target="_blank" rel="noopener">Streamingoptionen ↗</a>` : ''}</div></div></div><div class="premium-detail-body"><div class="premium-main"><section class="premium-detail-section"><span class="section-kicker">ÜBERBLICK</span><p class="premium-overview">${escapeHTML(details?.overview || item.description || 'Keine Beschreibung verfügbar.')}</p></section><section class="premium-detail-section release-intel"><span class="section-kicker">RELEASE INTELLIGENCE</span><div class="intel-grid"><div><small>Release-Typ</small><strong>${escapeHTML(eventLabel(item))}</strong></div><div><small>Datum</small><strong>${escapeHTML(item.date)}</strong></div><div><small>Event</small><strong>${escapeHTML(eventCopy)}</strong></div><div><small>Quelle</small><strong>${isTVMazeEvent(item) || item.scheduleConfirmed ? 'TMDB + TVmaze' : 'TMDB'}</strong></div></div></section>${nextEpisode}${originBlock}</div><aside class="premium-aside"><section class="premium-detail-section"><span class="section-kicker">STREAMING IN ÖSTERREICH</span>${providers.length ? `<div class="detail-provider-grid">${providerTiles(providers)}</div>` : '<p class="premium-muted">Keine aktuellen Providerdaten gefunden.</p>'}</section><section class="premium-detail-section"><span class="section-kicker">LINKS</span><div class="premium-links">${tmdbUrl ? `<a href="${tmdbUrl}" target="_blank" rel="noopener">TMDB <span>↗</span></a>` : ''}${item.tvmazeUrl ? `<a href="${escapeHTML(item.tvmazeUrl)}" target="_blank" rel="noopener">TVmaze Episode <span>↗</span></a>` : ''}${maze?.url && maze.url !== item.tvmazeUrl ? `<a href="${escapeHTML(maze.url)}" target="_blank" rel="noopener">TVmaze Serie <span>↗</span></a>` : ''}</div></section>${loading ? '<div class="inline-loading">Zusatzdaten werden geladen …</div>' : ''}${maze?.loadError ? '<div class="inline-error">TVmaze-Zusatzdaten konnten nicht geladen werden.</div>' : ''}</aside></div></div>`;

    const watch = $('#detailWatchToggle');
    if (watch) watch.onclick = () => {
      toggleWatchlist(watchKey(item));
      const nowSaved = state.watchlist.has(watchKey(item));
      watch.classList.toggle('saved', nowSaved);
      watch.textContent = nowSaved ? '✓ In Merkliste' : '+ Merkliste';
    };
  }

  function persistVisit() {
    const keys = state.releases.filter(item => item.radarEligible !== false && !String(item.id || '').startsWith('demo-')).map(eventKey);
    if (keys.length) localStorage.setItem(SEEN_KEY, JSON.stringify([...new Set(keys)].slice(0, 800)));
    localStorage.setItem(LAST_VISIT_KEY, String(Date.now()));
  }

  renderDetail = renderPremiumDetail;
  renderReleases = function() {
    const result = baseRenderReleases();
    renderNewSince();
    enhanceRails();
    installIcons();
    if (!$('#globalSearchOverlay')?.hidden) renderSearch();
    return result;
  };

  function installSearch() {
    createSearchOverlay();
    const input = $('#searchInput');
    if (!input) return;
    input.placeholder = 'StreamRadar durchsuchen …';
    input.setAttribute('aria-label', 'StreamRadar global durchsuchen');
    input.onfocus = openSearch;
    input.oninput = () => { openSearch(); renderSearch(input.value); };
    document.addEventListener('keydown', event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); openSearch(); input.focus(); input.select();
      } else if (event.key === 'Escape' && document.body.classList.contains('search-open')) {
        event.preventDefault(); closeSearch();
      }
    });
  }

  document.documentElement.dataset.streamradarVersion = VERSION;
  window.StreamRadarVersion = VERSION;
  installIcons();
  installSearch();
  renderReleases();
  window.addEventListener('pagehide', persistVisit);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') persistVisit(); });

  window.StreamRadarUI012 = Object.freeze({ VERSION, openSearch, renderNewSince, persistVisit });
})();
