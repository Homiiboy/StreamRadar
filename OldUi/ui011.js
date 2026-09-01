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
