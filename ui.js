/* StreamRadar consolidated UI runtime — current version 0.2.0 */
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

/* StreamRadar v0.2.0 — Personalization & Settings */
(() => {
  const VERSION = '0.2.0';
  const CONFIG_KEY = 'streamradar-personalization-v2';
  const ONBOARDING_KEY = 'streamradar-onboarding-v2-complete';
  const LAST_VIEW_KEY = 'streamradar-last-view-v2';
  const TOKEN_STORAGE_KEY = 'streamradar-tmdb-token';
  const PROVIDERS_STORAGE_KEY = 'streamradar-preferred-providers';
  const PROVIDERS_ONLY_STORAGE_KEY = 'streamradar-preferred-providers-only';
  const defaultConfig = {
    rememberLastView: true,
    defaultView: 'discover',
    density: 'comfortable',
    mediaPreferences: ['movie', 'series', 'anime'],
    originalsBoost: true,
    showEpisodesHome: true,
    horizonDays: 30
  };
  let config = loadConfig();
  let settingsTab = 'general';
  const baseRenderReleases = renderReleases;
  const baseSetView = setView;

  const ICONS = {
    general:'<svg viewBox="0 0 24 24"><path d="M4 5h16M4 12h16M4 19h16"/><circle cx="8" cy="5" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="10" cy="19" r="2"/></svg>',
    providers:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3z"/></svg>',
    content:'<svg viewBox="0 0 24 24"><path d="M12 3 5 7v10l7 4 7-4V7z"/><path d="m8 10 4 2 4-2M12 12v5"/></svg>',
    data:'<svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>',
    about:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></svg>'
  };

  function loadConfig() {
    const saved = safeJSON(localStorage.getItem(CONFIG_KEY) || '{}', {});
    const merged = { ...defaultConfig, ...(saved && typeof saved === 'object' ? saved : {}) };
    merged.mediaPreferences = Array.isArray(merged.mediaPreferences) && merged.mediaPreferences.length ? merged.mediaPreferences.filter(value => ['movie','series','anime'].includes(value)) : [...defaultConfig.mediaPreferences];
    if (!['comfortable','compact'].includes(merged.density)) merged.density = 'comfortable';
    if (!['discover','calendar','upcoming','watchlist'].includes(merged.defaultView)) merged.defaultView = 'discover';
    if (![14,30,60,90].includes(Number(merged.horizonDays))) merged.horizonDays = 30;
    return merged;
  }

  function persistConfig({ render = true } = {}) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    applyConfigSurface();
    if (render) renderReleases();
  }

  function applyConfigSurface() {
    document.body.dataset.density = config.density;
    document.documentElement.dataset.streamradarVersion = VERSION;
    window.StreamRadarVersion = VERSION;
  }

  function providerNames() {
    return window.StreamRadarStability?.getAllProviders?.() || tmdb.SERVICE_DEFINITIONS.map(service => service.name);
  }

  function preferredProviders() {
    return window.StreamRadarStability?.getPreferredProviders?.() || safeJSON(localStorage.getItem(PROVIDERS_STORAGE_KEY) || '[]', []);
  }

  function providerLogo(name) {
    try {
      const provider = providerFor(name);
      return provider?.logoPath || provider?.logo_path || '';
    } catch {
      const service = tmdb.SERVICE_DEFINITIONS.find(item => item.name === name);
      return service?.logoPath || '';
    }
  }

  function setProviders(names, rerender = true) {
    const api = window.StreamRadarStability;
    if (api?.setPreferredProviders) api.setPreferredProviders(names, { render:rerender });
    else {
      localStorage.setItem(PROVIDERS_STORAGE_KEY, JSON.stringify(names));
      if (rerender) renderReleases();
    }
  }

  function setProvidersOnly(value, rerender = true) {
    const api = window.StreamRadarStability;
    if (api?.setPreferredProvidersOnly) api.setPreferredProvidersOnly(Boolean(value), { render:rerender });
    else {
      localStorage.setItem(PROVIDERS_ONLY_STORAGE_KEY, String(Boolean(value)));
      if (rerender) renderReleases();
    }
  }

  function providersOnly() {
    return window.StreamRadarStability?.isPreferredProvidersOnly?.() ?? localStorage.getItem(PROVIDERS_ONLY_STORAGE_KEY) === 'true';
  }

  function personalScore(item) {
    let score = 0;
    const prefs = new Set(config.mediaPreferences);
    const preferred = new Set(preferredProviders());
    if ((item.services || []).some(service => preferred.has(service))) score += 42;
    if (prefs.has(item.type)) score += 25;
    if (config.originalsBoost && item.original) score += 18;
    if (state.watchlist.has(watchKey(item))) score += 9;
    const distance = dayDistance(item.releaseDate);
    if (distance >= 0 && distance <= 7) score += 18 - distance * 2;
    else if (distance > 7 && distance <= config.horizonDays) score += Math.max(2, 12 - Math.floor(distance / 5));
    score += Math.min(12, Math.round((item.popularity || 0) / 20));
    return score;
  }

  function personalSource() {
    const selected = new Set(config.mediaPreferences);
    const horizon = Number(config.horizonDays) || 30;
    return state.releases
      .filter(item => item.radarEligible !== false)
      .filter(item => selected.has(item.type))
      .filter(item => config.showEpisodesHome || item.eventKind !== 'episode')
      .filter(item => dayDistance(item.releaseDate) >= -2 && dayDistance(item.releaseDate) <= horizon)
      .map(item => ({ item, score:personalScore(item) }))
      .sort((a,b) => b.score - a.score || sortByRadarRelevance(a.item,b.item));
  }

  function personalCard(entry) {
    const item = entry.item;
    const path = item.backdropPath || item.posterPath;
    const art = path ? `<img src="${tmdb.image(path, item.backdropPath ? 'w780' : 'w500')}" alt="" loading="lazy"/>` : `<span class="rail-monogram">${escapeHTML(item.title.slice(0,2))}</span>`;
    return `<article class="rail-card v020-personal-card" tabindex="0" role="button" data-v020-id="${escapeHTML(item.id)}" style="--rail-accent:${item.accent}"><div class="rail-art">${art}<span class="rail-gradient"></span><span class="personal-score">MATCH ${Math.min(99, Math.max(50, entry.score))}</span><span class="rail-event">${escapeHTML(eventLabel(item))}</span></div><div class="rail-copy"><strong>${escapeHTML(item.title)}</strong><span>${escapeHTML(item.services?.[0] || item.originalBrand || 'Streaming')} · ${escapeHTML(formatReleaseDate(item.releaseDate))}</span></div></article>`;
  }

  function renderPersonalizedHome() {
    const root = $('#homeRails');
    if (!root || state.view !== 'discover') return;
    root.querySelectorAll('.v020-personal-rail').forEach(node => node.remove());
    const blocked = Boolean($('#searchInput')?.value.trim() || $('#typeFilter')?.value !== 'all' || $('#eventFilter')?.value !== 'all' || $('#periodFilter')?.value !== 'all' || $('#brandFilter')?.value !== 'all' || $('#originalsOnly')?.checked || state.service !== 'all');
    if (blocked) return;
    const scored = personalSource();
    if (!scored.length) return;
    const preferred = new Set(preferredProviders());
    const forYou = scored.slice(0, 12);
    const atProviders = scored.filter(entry => (entry.item.services || []).some(service => preferred.has(service))).slice(0, 12);
    const selectedText = config.mediaPreferences.map(type => ({movie:'Filme',series:'Serien',anime:'Anime'})[type]).join(' · ');
    const rows = [`<section class="media-rail v020-personal-rail"><div class="rail-heading"><div><span class="section-kicker">PERSONALISIERT</span><h2>Dein Radar-Mix</h2><div class="personalization-summary"><b>${preferred.size}</b> Anbieter · ${escapeHTML(selectedText)} · ${config.originalsBoost ? 'Originals priorisiert' : 'neutrale Herkunft'}</div></div></div><div class="rail-track">${forYou.map(personalCard).join('')}</div></section>`];
    if (atProviders.length && preferred.size < providerNames().length) rows.push(`<section class="media-rail v020-personal-rail"><div class="rail-heading"><div><span class="section-kicker">DEINE ANBIETER</span><h2>Bei deinen Diensten</h2></div></div><div class="rail-track">${atProviders.map(personalCard).join('')}</div></section>`);
    const newSince = root.querySelector('.new-since-rail');
    if (newSince) newSince.insertAdjacentHTML('afterend', rows.join(''));
    else root.insertAdjacentHTML('afterbegin', rows.join(''));
    root.querySelectorAll('.v020-personal-card').forEach(card => {
      card.onclick = () => openDetails(card.dataset.v020Id);
      card.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openDetails(card.dataset.v020Id); } };
    });
  }

  function notify(message, type = 'info') {
    let root = $('#toastStack');
    if (!root) {
      root = document.createElement('div'); root.id = 'toastStack'; root.className = 'toast-stack'; document.body.appendChild(root);
    }
    const toast = document.createElement('div'); toast.className = `radar-toast ${type}`; toast.textContent = message; root.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 220); }, 3200);
  }

  function providerGridMarkup(scope = 'settings') {
    const selected = new Set(preferredProviders());
    return providerNames().map(name => {
      const logo = providerLogo(name);
      return `<label class="settings-provider ${scope === 'onboarding' ? 'onboarding-provider' : ''}">${logo ? `<img src="${tmdb.image(logo,'w92')}" alt="" loading="lazy"/>` : '<i></i>'}<span>${escapeHTML(name)}</span><input type="checkbox" value="${escapeHTML(name)}" ${selected.has(name) ? 'checked' : ''}/></label>`;
    }).join('');
  }

  function settingsMarkup() {
    return `<div class="settings-center">
      <aside class="settings-nav"><div class="settings-nav-brand"><strong>StreamRadar</strong><span>PERSONALIZATION CENTER</span></div><nav class="settings-tabs">
        <button class="settings-tab" data-settings-tab="general">${ICONS.general}<span>Allgemein</span></button>
        <button class="settings-tab" data-settings-tab="providers">${ICONS.providers}<span>Anbieter</span></button>
        <button class="settings-tab" data-settings-tab="content">${ICONS.content}<span>Inhalte</span></button>
        <button class="settings-tab" data-settings-tab="data">${ICONS.data}<span>Daten & Backup</span></button>
        <button class="settings-tab" data-settings-tab="about">${ICONS.about}<span>Über</span></button>
      </nav><div class="settings-nav-foot">Einstellungen werden lokal auf diesem Gerät gespeichert.<br/>Version ${VERSION}</div></aside>
      <div class="settings-main">
        <section class="settings-page" data-settings-page="general"><div class="settings-page-head"><span class="section-kicker">ALLGEMEIN</span><h2>StreamRadar für dich</h2><p>Lege fest, wie die Desktop-App startet und wie dicht Informationen dargestellt werden.</p></div>
          <div class="settings-group"><div class="setting-row"><div class="setting-copy"><strong>Letzte Ansicht merken</strong><span>Öffnet StreamRadar dort, wo du zuletzt gearbeitet hast.</span></div><label class="setting-switch"><input id="prefRememberView" type="checkbox" ${config.rememberLastView?'checked':''}/><span></span></label></div>
          <div class="setting-row"><div class="setting-copy"><strong>Standardansicht</strong><span>Wird verwendet, wenn die letzte Ansicht nicht gemerkt wird.</span></div><select class="setting-select" id="prefDefaultView"><option value="discover">Entdecken</option><option value="calendar">Kalender</option><option value="upcoming">Demnächst</option><option value="watchlist">Merkliste</option></select></div>
          <div class="setting-row"><div class="setting-copy"><strong>Informationsdichte</strong><span>Kompakt zeigt mehr Inhalte gleichzeitig.</span></div><select class="setting-select" id="prefDensity"><option value="comfortable">Komfortabel</option><option value="compact">Kompakt</option></select></div></div>
        </section>
        <section class="settings-page" data-settings-page="providers"><div class="settings-page-head"><span class="section-kicker">MEINE ANBIETER</span><h2>Deine Streaming-Dienste</h2><p>Diese Auswahl fließt in deinen persönlichen Home-Feed ein und kann den gesamten Radar auf abonnierte Dienste begrenzen.</p></div><div class="settings-group"><div class="setting-row"><div class="setting-copy"><strong>Nur meine Anbieter im Radar</strong><span>Blendet andere Streaming-Dienste aus Feed und Kalender aus.</span></div><label class="setting-switch"><input id="settingsProvidersOnly" type="checkbox" ${providersOnly()?'checked':''}/><span></span></label></div><div class="settings-provider-actions"><button class="text-button" id="settingsProvidersAll">Alle wählen</button><button class="text-button" id="settingsProvidersNone">Keine wählen</button></div><div class="settings-provider-grid" id="settingsProviderGrid">${providerGridMarkup()}</div></div></section>
        <section class="settings-page" data-settings-page="content"><div class="settings-page-head"><span class="section-kicker">INHALTE</span><h2>Was soll wichtiger sein?</h2><p>Diese Präferenzen verändern die Gewichtung auf der Startseite, ohne Inhalte aus der Datenbank zu löschen.</p></div><div class="settings-group"><h3>Medienarten</h3><p>Wähle mindestens eine Medienart für deinen persönlichen Mix.</p><div class="pref-chip-grid"><label class="pref-chip"><input type="checkbox" data-media-pref="movie" ${config.mediaPreferences.includes('movie')?'checked':''}/><span>🎬 Filme</span></label><label class="pref-chip"><input type="checkbox" data-media-pref="series" ${config.mediaPreferences.includes('series')?'checked':''}/><span>▣ Serien</span></label><label class="pref-chip"><input type="checkbox" data-media-pref="anime" ${config.mediaPreferences.includes('anime')?'checked':''}/><span>◈ Anime</span></label></div></div><div class="settings-group"><div class="setting-row"><div class="setting-copy"><strong>Originals stärker gewichten</strong><span>Originals deiner bevorzugten Plattformen bekommen mehr Relevanz.</span></div><label class="setting-switch"><input id="prefOriginalsBoost" type="checkbox" ${config.originalsBoost?'checked':''}/><span></span></label></div><div class="setting-row"><div class="setting-copy"><strong>Episoden auf Home anzeigen</strong><span>Deaktivieren, wenn Home stärker auf Filme und Staffelstarts fokussieren soll.</span></div><label class="setting-switch"><input id="prefEpisodesHome" type="checkbox" ${config.showEpisodesHome?'checked':''}/><span></span></label></div><div class="setting-row"><div class="setting-copy"><strong>Persönlicher Zeitraum</strong><span>Wie weit der „Für dich“-Mix in die Zukunft schauen soll.</span></div><select class="setting-select" id="prefHorizon"><option value="14">14 Tage</option><option value="30">30 Tage</option><option value="60">60 Tage</option><option value="90">90 Tage</option></select></div></div></section>
        <section class="settings-page" data-settings-page="data"><div class="settings-page-head"><span class="section-kicker">DATEN & BACKUP</span><h2>Verbindung und Sicherung</h2><p>TMDB bleibt lokal verbunden. Backups enthalten bewusst keinen API-Token.</p></div><div class="settings-group"><h3>TMDB API Read Access Token</h3><p>Der Token wird nur im lokalen Browser-/App-Speicher hinterlegt.</p><div class="token-inline"><input type="password" id="tmdbToken" placeholder="eyJhbGciOiJIUzI1NiJ9…" autocomplete="off" spellcheck="false"/><button class="primary-button" id="saveToken">Verbinden</button></div><div class="settings-inline-status" id="settingsStatus"></div><button class="text-button" id="clearToken" type="button">Token entfernen</button></div><div class="settings-group"><h3>StreamRadar Backup</h3><p>Exportiert Personalisierung, Anbieter und Merkliste in eine portable JSON-Datei. Der TMDB-Token ist ausgeschlossen.</p><div class="backup-grid"><div class="backup-card"><strong>Backup exportieren</strong><p>Für Umzug, Neuinstallation oder Versionswechsel.</p><button class="ghost-button" id="exportStreamRadarBackup">Backup speichern</button></div><div class="backup-card"><strong>Backup importieren</strong><p>Stellt Einstellungen und Merkliste aus einem StreamRadar-Backup wieder her.</p><button class="ghost-button" id="importStreamRadarBackup">Backup auswählen</button><input type="file" id="streamRadarBackupFile" accept="application/json,.json" hidden/></div></div></div></section>
        <section class="settings-page" data-settings-page="about"><div class="settings-page-head"><span class="section-kicker">ÜBER STREAMRADAR</span><h2>Personal Streaming Release Intelligence</h2><p>Privater Release-Radar für Österreich mit TMDB, JustWatch-Providern und TVmaze-Schedule.</p></div><div class="about-version-card"><div class="about-version-mark">SR</div><div><strong>StreamRadar ${VERSION}</strong><span>Personalization & Settings · Windows Desktop / Web</span></div></div><div class="settings-group"><div class="setting-row"><div class="setting-copy"><strong>Aktive UI-Dateien</strong><span>styles.css + ui.js · historische Snapshots liegen ausschließlich im Archiv.</span></div></div><div class="setting-row"><div class="setting-copy"><strong>Datenregion</strong><span>Österreich (AT) · Sprache de-DE/de-AT.</span></div></div><div class="setting-row"><div class="setting-copy"><strong>Installer</strong><span>Windows x64 MSI · für persönliche Nutzung aktuell unsigniert.</span></div></div></div></section>
      </div></div>`;
  }

  function activateSettingsTab(tab) {
    settingsTab = tab;
    $$('.settings-tab').forEach(button => button.classList.toggle('active', button.dataset.settingsTab === tab));
    $$('.settings-page').forEach(page => page.classList.toggle('active', page.dataset.settingsPage === tab));
  }

  function syncConfigFromSettings() {
    config.rememberLastView = Boolean($('#prefRememberView')?.checked);
    config.defaultView = $('#prefDefaultView')?.value || config.defaultView;
    config.density = $('#prefDensity')?.value || config.density;
    config.originalsBoost = Boolean($('#prefOriginalsBoost')?.checked);
    config.showEpisodesHome = Boolean($('#prefEpisodesHome')?.checked);
    config.horizonDays = Number($('#prefHorizon')?.value || config.horizonDays);
    const media = $$('[data-media-pref]:checked').map(input => input.dataset.mediaPref);
    if (media.length) config.mediaPreferences = media;
    persistConfig();
  }

  async function connectToken() {
    const input = $('#tmdbToken');
    const status = $('#settingsStatus');
    const button = $('#saveToken');
    const token = input?.value.trim() || '';
    if (!token) { if (status) { status.textContent = 'Bitte zuerst einen Token eintragen.'; status.className = 'settings-inline-status warning'; } return; }
    if (button) button.disabled = true;
    try {
      await tmdb.validateToken(token);
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      if (status) { status.textContent = 'TMDB verbunden. Live-Daten werden aktualisiert …'; status.className = 'settings-inline-status success'; }
      await loadLiveData({ closeSettings:false });
    } catch (error) {
      if (status) { status.textContent = error?.status === 401 || error?.status === 403 ? 'Token ungültig oder nicht autorisiert.' : 'TMDB konnte nicht erreicht werden.'; status.className = 'settings-inline-status warning'; }
    } finally { if (button) button.disabled = false; }
  }

  function removeToken() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    if ($('#tmdbToken')) $('#tmdbToken').value = '';
    useDemo('TMDB-Verbindung wurde entfernt.');
    if ($('#settingsStatus')) { $('#settingsStatus').textContent = 'Token entfernt.'; $('#settingsStatus').className = 'settings-inline-status'; }
  }

  function exportBackup() {
    const payload = {
      app:'StreamRadar', format:2, version:VERSION, exportedAt:new Date().toISOString(),
      personalization:config,
      preferredProviders:preferredProviders(),
      preferredProvidersOnly:providersOnly(),
      watchlist:[...state.watchlist]
    };
    const blob = new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href=url; link.download=`streamradar-backup-${new Date().toISOString().slice(0,10)}.json`; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    notify('StreamRadar-Backup wurde erstellt.');
  }

  async function importBackup(event) {
    const file = event.target.files?.[0]; event.target.value=''; if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (data?.app !== 'StreamRadar' || !data.personalization || !Array.isArray(data.watchlist)) throw new Error('FORMAT');
      localStorage.setItem(CONFIG_KEY, JSON.stringify({ ...defaultConfig, ...data.personalization }));
      config = loadConfig();
      if (Array.isArray(data.preferredProviders)) setProviders(data.preferredProviders, false);
      if (typeof data.preferredProvidersOnly === 'boolean') setProvidersOnly(data.preferredProvidersOnly, false);
      state.watchlist = new Set(data.watchlist.map(String).filter(Boolean)); localStorage.setItem(WATCHLIST_KEY, JSON.stringify([...state.watchlist]));
      applyConfigSurface(); installSettingsCenter(); renderReleases(); notify('Backup erfolgreich wiederhergestellt.');
    } catch { notify('Diese Datei ist kein gültiges StreamRadar-Backup.', 'warning'); }
  }

  function installSettingsCenter() {
    const dialog = $('#settingsDialog'); const root = dialog?.querySelector('.settings-content'); if (!dialog || !root) return;
    dialog.classList.add('v020-settings'); root.innerHTML = settingsMarkup();
    $$('.settings-tab').forEach(button => button.onclick = () => activateSettingsTab(button.dataset.settingsTab));
    activateSettingsTab(settingsTab);
    $('#prefDefaultView').value = config.defaultView; $('#prefDensity').value = config.density; $('#prefHorizon').value = String(config.horizonDays);
    ['prefRememberView','prefDefaultView','prefDensity','prefOriginalsBoost','prefEpisodesHome','prefHorizon'].forEach(id => { const node=$(`#${id}`); if (node) node.onchange=syncConfigFromSettings; });
    $$('[data-media-pref]').forEach(input => input.onchange = event => { const checked=$$('[data-media-pref]:checked'); if (!checked.length) { event.target.checked=true; notify('Mindestens eine Medienart muss aktiv bleiben.', 'warning'); return; } syncConfigFromSettings(); });
    $('#settingsProvidersOnly').onchange = event => setProvidersOnly(event.target.checked);
    $('#settingsProvidersAll').onclick = () => { setProviders(providerNames(), false); installSettingsCenter(); renderReleases(); };
    $('#settingsProvidersNone').onclick = () => { setProviders([], false); installSettingsCenter(); renderReleases(); };
    $$('#settingsProviderGrid input').forEach(input => input.onchange = () => setProviders($$('#settingsProviderGrid input:checked').map(node => node.value)));
    $('#tmdbToken').value = localStorage.getItem(TOKEN_STORAGE_KEY) || '';
    $('#settingsStatus').textContent = state.mode === 'live' ? 'Verbunden. Live-Daten sind aktiv.' : 'Noch nicht mit TMDB verbunden.';
    $('#saveToken').onclick = connectToken; $('#clearToken').onclick = removeToken;
    $('#exportStreamRadarBackup').onclick = exportBackup; $('#importStreamRadarBackup').onclick = () => $('#streamRadarBackupFile').click(); $('#streamRadarBackupFile').onchange = importBackup;
  }

  function onboardingMarkup() {
    const tokenExists = Boolean(localStorage.getItem(TOKEN_STORAGE_KEY));
    return `<div class="onboarding-overlay" id="onboardingOverlay"><div class="onboarding-card"><aside class="onboarding-aside"><div class="onboarding-logo">Stream<span>Radar</span></div><div class="onboarding-progress"><div data-progress="0"><i>1</i><span>Willkommen</span></div><div data-progress="1"><i>2</i><span>TMDB</span></div><div data-progress="2"><i>3</i><span>Anbieter</span></div><div data-progress="3"><i>4</i><span>Für dich</span></div></div></aside><main class="onboarding-main">
      <section class="onboarding-step" data-onboarding-step="0"><span class="section-kicker">V0.2.0 · PERSONALIZATION</span><h1>Dein Radar.<br/><span>Deine Regeln.</span></h1><p>In wenigen Schritten richtet StreamRadar deinen persönlichen Release-Radar ein. Alles wird lokal auf diesem Gerät gespeichert.</p><div class="onboarding-feature-grid"><div class="onboarding-feature"><strong>Deine Anbieter</strong><span>Priorisiere nur die Dienste, die für dich relevant sind.</span></div><div class="onboarding-feature"><strong>Deine Inhalte</strong><span>Filme, Serien, Anime und Originals nach deinen Präferenzen.</span></div><div class="onboarding-feature"><strong>Deine Daten</strong><span>Token und Einstellungen bleiben lokal.</span></div></div></section>
      <section class="onboarding-step" data-onboarding-step="1"><span class="section-kicker">DATENQUELLE</span><h1>TMDB <span>verbinden</span></h1><p>${tokenExists?'Dein vorhandener TMDB-Token wurde erkannt. Du kannst direkt fortfahren oder ihn ersetzen.':'Für Live-Daten benötigt StreamRadar deinen TMDB API Read Access Token. Du kannst diesen Schritt auch überspringen und zunächst den Demo-Modus verwenden.'}</p><div class="onboarding-token"><input type="password" id="onboardingToken" placeholder="${tokenExists?'Vorhandener Token wird beibehalten':'TMDB API Read Access Token'}" autocomplete="off"/><div class="onboarding-hint">Der Token wird nicht in Backups oder das GitHub-Repository geschrieben.</div><div class="onboarding-error" id="onboardingTokenError"></div></div></section>
      <section class="onboarding-step" data-onboarding-step="2"><span class="section-kicker">MEINE ANBIETER</span><h1>Was nutzt <span>du?</span></h1><p>Wähle deine Streaming-Dienste. Du kannst diese Auswahl später jederzeit im Einstellungs-Center ändern.</p><div class="settings-provider-actions"><button class="text-button" id="onboardingProvidersAll">Alle wählen</button><button class="text-button" id="onboardingProvidersNone">Keine wählen</button></div><div class="onboarding-provider-grid" id="onboardingProviderGrid">${providerGridMarkup('onboarding')}</div></section>
      <section class="onboarding-step" data-onboarding-step="3"><span class="section-kicker">DEIN MIX</span><h1>Was ist dir <span>wichtig?</span></h1><p>Diese Auswahl beeinflusst die Reihenfolge im persönlichen Home-Feed. Nichts wird dauerhaft ausgeblendet.</p><div class="pref-chip-grid"><label class="pref-chip"><input type="checkbox" data-onboarding-media="movie" ${config.mediaPreferences.includes('movie')?'checked':''}/><span>🎬 Filme</span></label><label class="pref-chip"><input type="checkbox" data-onboarding-media="series" ${config.mediaPreferences.includes('series')?'checked':''}/><span>▣ Serien</span></label><label class="pref-chip"><input type="checkbox" data-onboarding-media="anime" ${config.mediaPreferences.includes('anime')?'checked':''}/><span>◈ Anime</span></label></div><div class="settings-group"><div class="setting-row"><div class="setting-copy"><strong>Originals priorisieren</strong><span>Gibt Originals im persönlichen Mix mehr Gewicht.</span></div><label class="setting-switch"><input id="onboardingOriginals" type="checkbox" ${config.originalsBoost?'checked':''}/><span></span></label></div><div class="setting-row"><div class="setting-copy"><strong>Neue Episoden auf Home</strong><span>Zeigt episodische Releases auch im persönlichen Mix.</span></div><label class="setting-switch"><input id="onboardingEpisodes" type="checkbox" ${config.showEpisodesHome?'checked':''}/><span></span></label></div></div></section>
      <div class="onboarding-actions"><button class="text-button" id="onboardingSkip" type="button">Später einrichten</button><div class="onboarding-actions-right"><button class="ghost-button" id="onboardingBack" type="button">Zurück</button><button class="primary-button" id="onboardingNext" type="button">Weiter</button></div></div></main></div></div>`;
  }

  function showOnboarding() {
    if (localStorage.getItem(ONBOARDING_KEY) === 'true' || $('#onboardingOverlay')) return;
    document.body.insertAdjacentHTML('beforeend', onboardingMarkup());
    let step = 0;
    const render = () => {
      $$('[data-onboarding-step]').forEach(node => node.classList.toggle('active', Number(node.dataset.onboardingStep) === step));
      $$('[data-progress]').forEach(node => { const index=Number(node.dataset.progress); node.classList.toggle('active', index===step); node.classList.toggle('done', index<step); });
      $('#onboardingBack').style.visibility = step ? 'visible' : 'hidden'; $('#onboardingNext').textContent = step === 3 ? 'StreamRadar starten' : 'Weiter';
    };
    const finish = async () => {
      const token = $('#onboardingToken')?.value.trim();
      if (token) {
        try { $('#onboardingNext').disabled=true; await tmdb.validateToken(token); localStorage.setItem(TOKEN_STORAGE_KEY,token); }
        catch { $('#onboardingTokenError').textContent='Dieser Token konnte nicht validiert werden.'; step=1; render(); $('#onboardingNext').disabled=false; return; }
      }
      const selectedProviders = $$('#onboardingProviderGrid input:checked').map(input => input.value); setProviders(selectedProviders,false);
      const media = $$('[data-onboarding-media]:checked').map(input => input.dataset.onboardingMedia); if (media.length) config.mediaPreferences=media;
      config.originalsBoost=Boolean($('#onboardingOriginals')?.checked); config.showEpisodesHome=Boolean($('#onboardingEpisodes')?.checked); persistConfig({render:false});
      localStorage.setItem(ONBOARDING_KEY,'true'); $('#onboardingOverlay')?.remove(); installSettingsCenter(); renderReleases(); if (localStorage.getItem(TOKEN_STORAGE_KEY)) loadLiveData(); notify('Dein persönlicher StreamRadar ist eingerichtet.');
    };
    $('#onboardingNext').onclick = async () => { if (step < 3) { step += 1; render(); } else await finish(); };
    $('#onboardingBack').onclick = () => { step=Math.max(0,step-1); render(); };
    $('#onboardingSkip').onclick = () => { localStorage.setItem(ONBOARDING_KEY,'true'); $('#onboardingOverlay').remove(); notify('Einrichtung übersprungen. Du kannst sie in den Einstellungen nachholen.'); };
    $('#onboardingProvidersAll').onclick = () => $$('#onboardingProviderGrid input').forEach(input => input.checked=true);
    $('#onboardingProvidersNone').onclick = () => $$('#onboardingProviderGrid input').forEach(input => input.checked=false);
    render();
  }

  renderReleases = function() {
    const result = baseRenderReleases();
    renderPersonalizedHome();
    return result;
  };

  setView = function(view) {
    if (config.rememberLastView && ['discover','calendar','seasons','episodes','upcoming','watchlist'].includes(view)) localStorage.setItem(LAST_VIEW_KEY, view);
    return baseSetView(view);
  };

  function restoreStartupView() {
    const view = config.rememberLastView ? localStorage.getItem(LAST_VIEW_KEY) : config.defaultView;
    const target = ['discover','calendar','seasons','episodes','upcoming','watchlist'].includes(view) ? view : config.defaultView;
    if (target && target !== state.view) baseSetView(target);
  }

  applyConfigSurface();
  installSettingsCenter();
  restoreStartupView();
  renderReleases();
  queueMicrotask(showOnboarding);

  window.StreamRadarPersonalization = Object.freeze({
    VERSION,
    getConfig: () => ({...config}),
    openSettings: tab => { settingsTab = tab || 'general'; installSettingsCenter(); openSettings(); activateSettingsTab(settingsTab); },
    exportBackup,
    renderPersonalizedHome
  });
})();
