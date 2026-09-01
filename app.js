const tmdb = window.StreamRadarTMDB;
const TOKEN_KEY = 'streamradar-tmdb-token';
const WATCHLIST_KEY = 'streamradar-watchlist';

const serviceNames = [
  ...tmdb.SERVICE_DEFINITIONS.map(service => service.name),
  'FX', 'Hulu', 'Peacock', 'AMC+', 'BBC'
];

const demoReleases = [
  {id:'demo-1',title:'Neon District',services:['Netflix'],type:'series',releaseDate:todayISO(),original:true,studio:'Netflix Original',accent:'#ff3158',description:'Demo-Inhalt: Eine düstere Tech-Thriller-Serie über Macht, Erinnerung und eine Stadt, die niemals offline geht.',source:'demo'},
  {id:'demo-2',title:'Ashes of Europa',services:['HBO Max'],type:'series',releaseDate:addDaysISO(3),original:true,studio:'HBO Original',accent:'#7c6dff',description:'Demo-Inhalt: Prestige-Sci-Fi über eine Expedition, die unter Europas Eisschicht etwas Unmögliches findet.',source:'demo'},
  {id:'demo-3',title:'Red Horizon',services:['Prime Video'],type:'movie',releaseDate:addDaysISO(11),original:true,studio:'Amazon MGM',accent:'#39a8ff',description:'Demo-Inhalt: Ein Survival-Thriller über die erste bemannte Mars-Mission und ein Signal aus dem Nichts.',source:'demo'},
  {id:'demo-4',title:'Moonblade',services:['Crunchyroll'],type:'anime',releaseDate:addDaysISO(1),original:false,studio:'Crunchyroll',accent:'#ff8c31',description:'Demo-Inhalt: Neue Anime-Serie über einen gefallenen Wächter und eine Klinge, die Erinnerungen schneiden kann.',source:'demo'},
  {id:'demo-5',title:'The Quiet Room',services:['Apple TV+'],type:'series',releaseDate:addDaysISO(18),original:true,studio:'Apple Original',accent:'#d9e2ef',description:'Demo-Inhalt: Psychologisches Mystery-Drama über einen Raum, in dem niemand länger als 17 Minuten bleiben kann.',source:'demo'},
  {id:'demo-6',title:'Blackwater',services:['Paramount+'],type:'series',releaseDate:addDaysISO(22),original:true,studio:'Paramount+ Original',accent:'#4386ff',description:'Demo-Inhalt: Crime-Serie über eine Küstenstadt, einen verschwundenen Ermittler und ein Netzwerk aus alten Schulden.',source:'demo'},
  {id:'demo-7',title:'Glass Cities',services:['Disney+'],type:'movie',releaseDate:addDaysISO(27),original:true,studio:'Disney+ Original',accent:'#2a7cff',description:'Demo-Inhalt: Visuell opulentes Abenteuer über zwei Geschwister in einer Stadt aus lebendem Glas.',source:'demo'},
  {id:'demo-8',title:'Signal Fire',services:['FX'],type:'series',releaseDate:addDaysISO(5),original:true,studio:'FX Original',accent:'#ff7a59',description:'Demo-Inhalt: Ein Ensemble-Drama über ein Bergdorf, dessen Notsignal nach zwanzig Jahren plötzlich wieder aktiv wird.',source:'demo'}
].map(enrichRelease);

const state = {
  service: 'all',
  view: 'discover',
  mode: 'demo',
  releases: demoReleases,
  providerMap: [],
  loading: false,
  watchlist: new Set((JSON.parse(localStorage.getItem(WATCHLIST_KEY) || '[]')).map(String)),
  detailCache: new Map()
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function todayISO() {
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  return now.toISOString().slice(0, 10);
}

function addDaysISO(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dayDistance(value) {
  const date = parseDate(value);
  if (!date) return 9999;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.round((date - today) / 86400000);
}

function periodFor(value) {
  const days = dayDistance(value);
  if (days === 0) return 'today';
  if (days >= -7 && days <= 7) return 'week';
  if (days > 7) return 'upcoming';
  return 'month';
}

function enrichRelease(item) {
  return {
    ...item,
    period: periodFor(item.releaseDate),
    date: formatReleaseDate(item.releaseDate),
    accent: item.accent || accentFor(item.services?.[0] || '')
  };
}

function formatReleaseDate(value) {
  const days = dayDistance(value);
  if (days === 0) return 'Heute';
  if (days === 1) return 'Morgen';
  if (days === -1) return 'Gestern';
  const date = parseDate(value);
  return date ? new Intl.DateTimeFormat('de-AT', { day: '2-digit', month: 'short', year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined }).format(date) : 'Datum offen';
}

function accentFor(service) {
  const accents = {
    'Netflix':'#ff3158','Disney+':'#2a7cff','Prime Video':'#39a8ff','HBO Max':'#7c6dff','Apple TV+':'#d9e2ef',
    'Paramount+':'#4386ff','Crunchyroll':'#ff8c31','Sky / WOW':'#ff5dcc','Joyn':'#f4d44d','RTL+':'#38d59f','ORF':'#e84855',
    'FX':'#ff7a59','Hulu':'#55e58a','Peacock':'#8f7aff','AMC+':'#ffb45a','BBC':'#e6e6e6'
  };
  return accents[service] || '#62f7c7';
}

function escapeHTML(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

function useDemo(message = 'TMDB noch nicht verbunden.') {
  state.mode = 'demo';
  state.releases = demoReleases;
  state.providerMap = [];
  state.detailCache.clear();
  setDataStatus('demo', 'Demo-Modus', message);
  renderServices();
  renderReleases();
}

function setDataStatus(kind, label, text) {
  const root = $('#dataStatus');
  root.dataset.state = kind;
  $('#dataStatusLabel').textContent = label;
  $('#dataStatusText').textContent = text;
  $('#radarState').textContent = kind === 'live' ? 'TMDB live' : kind === 'loading' ? 'Synchronisiere …' : 'Radar aktiv';
  $('#statusAction').textContent = kind === 'live' ? 'Einstellungen' : 'TMDB verbinden';
}

function setLoading(loading) {
  state.loading = loading;
  $('#loadingGrid').hidden = !loading;
  $('#releaseGrid').classList.toggle('is-loading', loading);
  $('#refreshData').classList.toggle('spinning', loading);
  $('#refreshData').disabled = loading;
}

async function loadLiveData({ closeSettings = false } = {}) {
  const token = localStorage.getItem(TOKEN_KEY)?.trim();
  if (!token) {
    useDemo();
    return;
  }

  setLoading(true);
  setDataStatus('loading', 'TMDB wird geladen', 'Provider und Releases für Österreich werden synchronisiert …');
  $('#settingsStatus').textContent = 'Verbindung wird geprüft …';

  try {
    const result = await tmdb.loadRadar(token, (done, total) => {
      setDataStatus('loading', 'TMDB wird geladen', `Synchronisiere Datenquellen ${done}/${total} …`);
    });

    state.mode = 'live';
    state.providerMap = result.providers;
    state.releases = result.releases
      .map(enrichRelease)
      .filter(item => item.title)
      .sort(sortByRadarRelevance);
    state.detailCache.clear();

    setDataStatus('live', 'TMDB live', `${state.releases.length} reale Titel · Providerregion Österreich.`);
    $('#settingsStatus').textContent = 'Verbunden. Live-Daten sind aktiv.';
    renderServices();
    renderReleases();
    if (closeSettings && $('#settingsDialog').open) $('#settingsDialog').close();
  } catch (error) {
    console.error('StreamRadar TMDB sync failed', error);
    const authError = error.status === 401 || error.status === 403;
    useDemo(authError ? 'TMDB-Token ungültig oder nicht autorisiert.' : 'TMDB ist gerade nicht erreichbar – Demo-Daten werden angezeigt.');
    $('#settingsStatus').textContent = authError ? 'Token konnte nicht authentifiziert werden.' : 'Verbindung fehlgeschlagen. Bitte später erneut versuchen.';
    if (authError) openSettings();
  } finally {
    setLoading(false);
  }
}

function sortByRadarRelevance(a, b) {
  const aDays = dayDistance(a.releaseDate);
  const bDays = dayDistance(b.releaseDate);
  const score = days => Math.abs(days) + (days < 0 ? 4 : 0);
  const distance = score(aDays) - score(bDays);
  return distance || (b.popularity || 0) - (a.popularity || 0);
}

function providerFor(name) {
  return state.providerMap.find(provider => provider.name === name);
}

function renderServices() {
  const root = $('#serviceStrip');
  root.innerHTML = serviceNames.map(name => {
    const provider = providerFor(name);
    const logo = provider?.logoPath ? `<img src="${tmdb.image(provider.logoPath, 'w92')}" alt="" loading="lazy" />` : '<span class="service-dot"></span>';
    const unavailable = state.mode === 'live' && provider && !provider.available;
    const originOnly = state.mode === 'live' && !provider;
    const classes = ['service-chip', state.service === name ? 'active' : '', unavailable || originOnly ? 'source-only' : ''].filter(Boolean).join(' ');
    const title = unavailable || originOnly ? 'In v0.0.2 noch keine direkte AT-Providerquelle; Original-Marken folgen.' : `${name} filtern`;
    return `<button class="${classes}" data-service="${escapeHTML(name)}" title="${escapeHTML(title)}">${logo}${escapeHTML(name)}</button>`;
  }).join('');

  $$('.service-chip').forEach(button => button.addEventListener('click', () => {
    state.service = state.service === button.dataset.service ? 'all' : button.dataset.service;
    renderServices();
    renderReleases();
  }));
}

function matchesView(item) {
  if (state.view === 'upcoming') {
    const days = dayDistance(item.releaseDate);
    return days >= 0 && days <= 30;
  }
  if (state.view === 'watchlist') return state.watchlist.has(String(item.id));
  return true;
}

function renderReleases() {
  const query = $('#searchInput').value.trim().toLowerCase();
  const type = $('#typeFilter').value;
  const period = $('#periodFilter').value;
  const originalsOnly = $('#originalsOnly').checked;

  const filtered = state.releases.filter(item => {
    const haystack = `${item.title} ${item.originalTitle || ''} ${(item.services || []).join(' ')} ${item.studio || ''}`.toLowerCase();
    return matchesView(item)
      && (state.service === 'all' || item.services?.includes(state.service))
      && (type === 'all' || item.type === type)
      && (period === 'all' || item.period === period)
      && (!originalsOnly || item.original === true)
      && (!query || haystack.includes(query));
  });

  $('#heroReleaseCount').textContent = state.releases.length;
  $('#watchlistCount').textContent = state.watchlist.size;
  $('#resultSummary').textContent = state.loading
    ? 'TMDB-Daten werden geladen …'
    : `${filtered.length} ${filtered.length === 1 ? 'Treffer' : 'Treffer'} ${state.mode === 'live' ? 'aus TMDB für Österreich' : 'im Demo-Modus'}.`;
  $('#releaseGrid').innerHTML = filtered.map(cardTemplate).join('');
  $('#emptyState').hidden = filtered.length > 0 || state.loading;

  $$('.release-card').forEach(card => card.addEventListener('click', event => {
    if (!event.target.closest('.save-button')) openDetails(card.dataset.id);
  }));
  $$('.save-button').forEach(button => button.addEventListener('click', event => {
    event.stopPropagation();
    toggleWatchlist(button.dataset.id);
  }));
}

function cardTemplate(item) {
  const saved = state.watchlist.has(String(item.id));
  const poster = item.posterPath
    ? `<img class="poster-image" src="${tmdb.image(item.posterPath, 'w500')}" alt="Poster von ${escapeHTML(item.title)}" loading="lazy" />`
    : `<span class="poster-monogram">${escapeHTML(item.title.split(' ').map(part => part[0]).join('').slice(0, 3))}</span>`;
  const primaryService = item.services?.[0] || 'Unbekannt';
  const extraServices = Math.max(0, (item.services?.length || 1) - 1);
  const rating = item.rating > 0 ? `<span class="rating">★ ${item.rating.toFixed(1)}</span>` : '';
  const sourceBadge = state.mode === 'demo' ? '<span class="badge demo">DEMO</span>' : '';

  return `<article class="release-card" data-id="${escapeHTML(item.id)}" style="--card-accent:${item.accent}">
    <div class="poster">
      ${poster}
      <div class="poster-shade"></div>
      <div class="badge-row"><span class="badge">${escapeHTML(primaryService)}${extraServices ? ` +${extraServices}` : ''}</span>${sourceBadge}</div>
      ${rating}
    </div>
    <button class="save-button ${saved ? 'saved' : ''}" data-id="${escapeHTML(item.id)}" aria-label="${saved ? 'Von Merkliste entfernen' : 'Zur Merkliste hinzufügen'}">${saved ? '✓' : '+'}</button>
    <div class="card-body">
      <div class="card-meta"><span>${labelType(item.type)}</span><span>${escapeHTML(item.date)}</span></div>
      <h3>${escapeHTML(item.title)}</h3>
      <p>${escapeHTML(item.services?.join(' · ') || item.studio || 'Streaming')}</p>
    </div>
  </article>`;
}

function labelType(type) {
  return ({ series: 'SERIE', movie: 'FILM', anime: 'ANIME' })[type] || String(type).toUpperCase();
}

function toggleWatchlist(id) {
  const key = String(id);
  state.watchlist.has(key) ? state.watchlist.delete(key) : state.watchlist.add(key);
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify([...state.watchlist]));
  renderReleases();
}

async function openDetails(id) {
  const item = state.releases.find(release => String(release.id) === String(id));
  if (!item) return;

  renderDetail(item, null, false);
  $('#detailDialog').showModal();

  if (state.mode !== 'live' || !item.tmdbId || !item.mediaType) return;
  const cacheKey = `${item.mediaType}-${item.tmdbId}`;
  if (state.detailCache.has(cacheKey)) {
    renderDetail(item, state.detailCache.get(cacheKey), false);
    return;
  }

  renderDetail(item, null, true);
  try {
    const details = await tmdb.getDetails(item.mediaType, item.tmdbId, localStorage.getItem(TOKEN_KEY));
    state.detailCache.set(cacheKey, details);
    renderDetail(item, details, false);
  } catch (error) {
    console.warn('StreamRadar details failed', error);
    renderDetail(item, { loadError: true }, false);
  }
}

function renderDetail(item, details, loading) {
  const backdrop = item.backdropPath ? tmdb.image(item.backdropPath, 'w1280') : '';
  const genres = details?.genres?.map(genre => genre.name).filter(Boolean) || [];
  const runtime = item.mediaType === 'movie' ? details?.runtime : details?.episode_run_time?.[0];
  const providerNames = details?.providers?.map(provider => provider.provider_name).filter(Boolean) || item.services || [];
  const providerLogos = details?.providers?.slice(0, 8).map(provider => `<span class="provider-pill">${provider.logo_path ? `<img src="${tmdb.image(provider.logo_path, 'w92')}" alt="" />` : ''}${escapeHTML(provider.provider_name)}</span>`).join('') || '';
  const tmdbUrl = item.tmdbId ? `https://www.themoviedb.org/${item.mediaType}/${item.tmdbId}` : null;
  const style = backdrop ? `--detail-bg:url('${backdrop}');--card-accent:${item.accent}` : `--card-accent:${item.accent}`;

  $('#dialogContent').innerHTML = `<div class="detail-hero ${backdrop ? 'has-backdrop' : ''}" style="${style}">
      <div><span class="section-kicker">${escapeHTML(item.services?.join(' · ') || 'STREAMRADAR')}</span><h2>${escapeHTML(item.title)}</h2><span>${escapeHTML(item.date)} · ${labelType(item.type)}</span></div>
    </div>
    <div class="detail-content">
      <p>${escapeHTML(details?.overview || item.description || 'Keine Beschreibung verfügbar.')}</p>
      <div class="detail-facts">
        ${item.rating > 0 ? `<span>★ ${item.rating.toFixed(1)} TMDB</span>` : ''}
        ${runtime ? `<span>${runtime} Min.</span>` : ''}
        ${details?.number_of_seasons ? `<span>${details.number_of_seasons} Staffeln</span>` : ''}
        ${genres.slice(0, 3).map(genre => `<span>${escapeHTML(genre)}</span>`).join('')}
        <span>Region AT</span>
      </div>
      ${providerLogos ? `<div class="provider-list"><strong>Streaming in Österreich</strong><div>${providerLogos}</div></div>` : `<div class="provider-list"><strong>Provider</strong><p>${escapeHTML(providerNames.join(', ') || 'Keine Providerdaten geladen.')}</p></div>`}
      ${loading ? '<div class="inline-loading">TMDB-Details werden geladen …</div>' : ''}
      ${details?.loadError ? '<div class="inline-error">Zusatzdetails konnten nicht geladen werden.</div>' : ''}
      <div class="detail-actions">
        ${tmdbUrl ? `<a class="ghost-button link-button" href="${tmdbUrl}" target="_blank" rel="noopener">Auf TMDB ansehen ↗</a>` : ''}
        ${details?.watchLink ? `<a class="primary-button link-button" href="${escapeHTML(details.watchLink)}" target="_blank" rel="noopener">Streamingoptionen ↗</a>` : ''}
      </div>
      ${state.mode === 'live' ? '<p class="attribution">Streaming-Verfügbarkeitsdaten: JustWatch via TMDB. Die Original-Zuordnung von Networks/Studios folgt in v0.0.3.</p>' : '<p class="attribution"><strong>Demo-Modus:</strong> Verbinde TMDB in den Einstellungen, um echte Inhalte zu laden.</p>'}
    </div>`;
}

function setView(view) {
  state.view = view;
  $$('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.view === view));
  if (view === 'upcoming') {
    $('#viewKicker').textContent = 'KOMMENDE 30 TAGE';
    $('#viewTitle').textContent = 'Demnächst';
  } else if (view === 'watchlist') {
    $('#viewKicker').textContent = 'GESPEICHERT';
    $('#viewTitle').textContent = 'Deine Merkliste';
  } else {
    $('#viewKicker').textContent = 'DEIN FEED';
    $('#viewTitle').textContent = 'Neu & relevant';
  }
  renderReleases();
  $('#releases').scrollIntoView({ behavior: 'smooth' });
}

function resetFilters() {
  state.service = 'all';
  $('#searchInput').value = '';
  $('#typeFilter').value = 'all';
  $('#periodFilter').value = 'all';
  $('#originalsOnly').checked = false;
  renderServices();
  renderReleases();
}

function openSettings() {
  $('#tmdbToken').value = localStorage.getItem(TOKEN_KEY) || '';
  $('#settingsStatus').textContent = state.mode === 'live' ? 'Verbunden. Live-Daten sind aktiv.' : 'Füge deinen TMDB API Read Access Token ein.';
  if (!$('#settingsDialog').open) $('#settingsDialog').showModal();
}

async function saveToken() {
  const token = $('#tmdbToken').value.trim();
  if (!token) {
    $('#settingsStatus').textContent = 'Bitte zuerst einen Token eintragen.';
    return;
  }

  $('#saveToken').disabled = true;
  $('#settingsStatus').textContent = 'Token wird geprüft …';
  try {
    await tmdb.validateToken(token);
    localStorage.setItem(TOKEN_KEY, token);
    $('#settingsStatus').textContent = 'Token gültig. Releases werden geladen …';
    await loadLiveData({ closeSettings: true });
  } catch (error) {
    $('#settingsStatus').textContent = error.status === 401 || error.status === 403
      ? 'Dieser Token ist ungültig oder nicht autorisiert.'
      : 'TMDB konnte nicht erreicht werden.';
  } finally {
    $('#saveToken').disabled = false;
  }
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  $('#tmdbToken').value = '';
  $('#settingsStatus').textContent = 'Token entfernt. StreamRadar läuft wieder im Demo-Modus.';
  useDemo('TMDB-Verbindung wurde entfernt.');
}

$$('.nav-link').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
$('#searchInput').addEventListener('input', renderReleases);
$('#typeFilter').addEventListener('change', renderReleases);
$('#periodFilter').addEventListener('change', renderReleases);
$('#originalsOnly').addEventListener('change', renderReleases);
$('#resetServices').addEventListener('click', () => { state.service = 'all'; renderServices(); renderReleases(); });
$('#clearFilters').addEventListener('click', resetFilters);
$('#showUpcoming').addEventListener('click', () => setView('upcoming'));
$('[data-jump="releases"]').addEventListener('click', () => $('#releases').scrollIntoView({ behavior: 'smooth' }));
$('#dialogClose').addEventListener('click', () => $('#detailDialog').close());
$('#detailDialog').addEventListener('click', event => { if (event.target === $('#detailDialog')) $('#detailDialog').close(); });
$('#openSettings').addEventListener('click', openSettings);
$('#statusAction').addEventListener('click', openSettings);
$('#settingsClose').addEventListener('click', () => $('#settingsDialog').close());
$('#settingsDialog').addEventListener('click', event => { if (event.target === $('#settingsDialog')) $('#settingsDialog').close(); });
$('#saveToken').addEventListener('click', saveToken);
$('#clearToken').addEventListener('click', clearToken);
$('#refreshData').addEventListener('click', () => localStorage.getItem(TOKEN_KEY) ? loadLiveData() : openSettings());
$('#themePulse').addEventListener('click', () => {
  const current = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  document.documentElement.style.setProperty('--accent', current === '#62f7c7' ? '#7c6dff' : '#62f7c7');
});

document.addEventListener('keydown', event => {
  if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
    event.preventDefault();
    $('#searchInput').focus();
  }
});

renderServices();
renderReleases();

if (localStorage.getItem(TOKEN_KEY)) loadLiveData();
else useDemo();
