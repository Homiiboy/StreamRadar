const tmdb = window.StreamRadarTMDB;
const tvmaze = window.StreamRadarTVMaze;
const APP_VERSION = '0.2.0';
const TOKEN_KEY = 'streamradar-tmdb-token';
const WATCHLIST_KEY = 'streamradar-watchlist';
const brandNames = tmdb.ORIGINAL_BRANDS.map(brand => brand.name);
const serviceNames = [...new Set([...tmdb.SERVICE_DEFINITIONS.map(service => service.name), ...brandNames])];

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const safeJSON = (value, fallback) => { try { return JSON.parse(value); } catch { return fallback; } };
const todayISO = () => { const date = new Date(); date.setHours(12, 0, 0, 0); return date.toISOString().slice(0, 10); };
const addDaysISO = days => { const date = new Date(); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10); };

const demoReleases = [
  { id:'demo-1', entityId:'demo-1', title:'Neon District', services:['Netflix'], type:'series', mediaType:'tv', releaseDate:todayISO(), eventKind:'series-premiere', eventLabel:'Neue Serie', eventSeason:1, eventEpisode:1, radarEligible:true, original:true, originalBrand:'Netflix', originalConfidence:'high', originalScore:96, originType:'platform', originLabel:'Original von', originalReason:'Network-Treffer: Netflix', studio:'Netflix Original', accent:'#ff3158', description:'Demo-Inhalt: Eine düstere Tech-Thriller-Serie über Macht, Erinnerung und eine Stadt, die niemals offline geht.', source:'demo' },
  { id:'demo-2', entityId:'demo-2', title:'Ashes of Europa', services:['HBO Max'], type:'series', mediaType:'tv', releaseDate:addDaysISO(3), eventKind:'season-premiere', eventLabel:'Neue Staffel 2', eventSeason:2, eventEpisode:1, radarEligible:true, original:true, originalBrand:'HBO', originalConfidence:'high', originalScore:96, originType:'network', originLabel:'Original von', originalReason:'Network-Treffer: HBO', studio:'HBO Original', accent:'#7c6dff', description:'Demo-Inhalt: Staffel 2 der Prestige-Sci-Fi-Serie startet in wenigen Tagen.', source:'demo' },
  { id:'demo-3', entityId:'demo-3', title:'Red Horizon', services:['Prime Video'], type:'movie', mediaType:'movie', releaseDate:addDaysISO(11), eventKind:'movie-premiere', eventLabel:'Digital-Premiere', radarEligible:true, original:true, originalBrand:'Prime Video', originalConfidence:'medium', originalScore:77, originType:'platform', originLabel:'Original von', originalReason:'Produktionsfirma: Amazon MGM Studios', studio:'Amazon MGM', accent:'#39a8ff', description:'Demo-Inhalt: Ein Survival-Thriller über die erste bemannte Mars-Mission und ein Signal aus dem Nichts.', source:'demo' },
  { id:'demo-4', entityId:'demo-4', title:'Moonblade', services:['Crunchyroll'], type:'anime', mediaType:'tv', releaseDate:addDaysISO(1), eventKind:'episode', eventLabel:'Neue Episode', eventSeason:1, eventEpisode:7, eventEpisodeName:'Moonlit Gate', eventChannel:'Crunchyroll', eventRuntime:24, radarEligible:true, original:true, originalBrand:'Crunchyroll', originalConfidence:'high', originalScore:96, originType:'platform', originLabel:'Original von', originalReason:'Network-Treffer: Crunchyroll', studio:'Crunchyroll', accent:'#ff8c31', description:'Demo-Inhalt: Morgen erscheint eine neue Episode.', source:'demo' },
  { id:'demo-5', entityId:'demo-5', title:'The Quiet Room', services:['Apple TV+'], type:'series', mediaType:'tv', releaseDate:addDaysISO(18), eventKind:'series-premiere', eventLabel:'Neue Serie', eventSeason:1, eventEpisode:1, radarEligible:true, original:true, originalBrand:'Apple TV+', originalConfidence:'high', originalScore:96, originType:'platform', originLabel:'Original von', originalReason:'Network-Treffer: Apple TV+', studio:'Apple Original', accent:'#d9e2ef', description:'Demo-Inhalt: Psychologisches Mystery-Drama über einen Raum, in dem niemand länger als 17 Minuten bleiben kann.', source:'demo' },
  { id:'demo-6', entityId:'demo-6', title:'Blackwater', services:['Paramount+'], type:'series', mediaType:'tv', releaseDate:addDaysISO(7), eventKind:'episode', eventLabel:'Neue Episode', eventSeason:3, eventEpisode:2, eventEpisodeName:'Low Tide', eventChannel:'Paramount+', eventRuntime:52, radarEligible:true, original:true, originalBrand:'Paramount+', originalConfidence:'high', originalScore:96, originType:'platform', originLabel:'Original von', originalReason:'Network-Treffer: Paramount+', studio:'Paramount+ Original', accent:'#4386ff', description:'Demo-Inhalt: Eine weitere Episode der dritten Staffel erscheint.', source:'demo' },
  { id:'demo-7', entityId:'demo-7', title:'Glass Cities', services:['Disney+'], type:'movie', mediaType:'movie', releaseDate:addDaysISO(27), eventKind:'movie-premiere', eventLabel:'Film-Premiere', radarEligible:true, original:false, originalBrand:'Marvel Studios', originalConfidence:'medium', originalScore:76, originType:'studio', originLabel:'Studio / Brand', originalReason:'Produktionsfirma: Marvel Studios', accent:'#2a7cff', description:'Demo-Inhalt: Beispiel dafür, dass ein Studio-Treffer nicht automatisch als Streaming-Original gilt.', source:'demo' },
  { id:'demo-8', entityId:'demo-8', title:'Signal Fire', services:['Disney+'], type:'series', mediaType:'tv', releaseDate:addDaysISO(5), eventKind:'episode', eventLabel:'Neue Episode', eventSeason:2, eventEpisode:4, eventEpisodeName:'The Beacon', eventChannel:'FX', eventRuntime:46, radarEligible:true, original:true, originalBrand:'FX', originalConfidence:'high', originalScore:96, originType:'network', originLabel:'Original von', originalReason:'Network-Treffer: FX', studio:'FX Original', accent:'#ff7a59', description:'Demo-Inhalt: Ein FX Original, das in Österreich über Disney+ verfügbar ist.', source:'demo' }
];

const state = {
  service: 'all',
  view: 'discover',
  mode: 'demo',
  releases: [],
  providerMap: [],
  loading: false,
  enriching: false,
  scheduleSyncing: false,
  scheduleStats: { days:0, matchedShows:0, events:0, errors:0 },
  watchlist: new Set(safeJSON(localStorage.getItem(WATCHLIST_KEY) || '[]', []).map(String)),
  detailCache: new Map(),
  tvmazeCache: new Map()
};

function parseDate(value) {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}
function dayDistance(value) {
  const date = parseDate(value);
  if (!date) return 99999;
  const now = new Date(); now.setHours(12, 0, 0, 0);
  return Math.round((date - now) / 86400000);
}
function periodFor(value) {
  const days = dayDistance(value);
  if (days === 0) return 'today';
  if (days >= -7 && days <= 7) return 'week';
  if (days > 7) return 'upcoming';
  return 'month';
}
function formatReleaseDate(value) {
  const days = dayDistance(value);
  if (days === 0) return 'Heute';
  if (days === 1) return 'Morgen';
  if (days === -1) return 'Gestern';
  const date = parseDate(value);
  return date ? new Intl.DateTimeFormat('de-AT', { day:'2-digit', month:'short', year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined }).format(date) : 'Datum offen';
}
function accentFor(service) {
  return ({
    'Netflix':'#ff3158','Disney+':'#2a7cff','Prime Video':'#39a8ff','HBO Max':'#7c6dff','HBO':'#a89cff',
    'Apple TV+':'#d9e2ef','Paramount+':'#4386ff','Crunchyroll':'#ff8c31','Sky / WOW':'#ff5dcc','Sky':'#ff5dcc',
    'Joyn':'#f4d44d','RTL+':'#38d59f','ORF':'#e84855','FX':'#ff7a59','Hulu':'#55e58a','Peacock':'#8f7aff',
    'AMC+':'#ffb45a','AMC':'#ffb45a','BBC':'#e6e6e6','Showtime':'#ff4a4a','CBS':'#5a83ff','NBC':'#d8d8d8',
    'ABC':'#d8d8d8','FOX':'#f0b34c','Starz':'#e8e8e8','CANAL+':'#e8e8e8','Marvel Studios':'#ef5350','Lucasfilm':'#e9e3d4',
    'Pixar':'#63a8ff','Walt Disney Studios':'#6f8fff','National Geographic':'#ffd447','Warner Bros.':'#4e82ff','Sony Pictures':'#77b4ff','A24':'#f5f5f5'
  })[service] || '#62f7c7';
}
function escapeHTML(value = '') {
  return String(value).replace(/[&<>'\"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[char]);
}
function normalizeTitle(value = '') {
  return String(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();
}
function enrichRelease(item) {
  return {
    ...item,
    entityId: item.entityId || item.id,
    period: periodFor(item.releaseDate),
    date: formatReleaseDate(item.releaseDate),
    accent: item.accent || accentFor(item.services?.[0] || item.originalBrand || '')
  };
}
function labelType(type) {
  return ({ series:'SERIE', movie:'FILM', anime:'ANIME' })[type] || String(type).toUpperCase();
}
function eventLabel(item) {
  if (item.eventLabel) return item.eventLabel;
  return ({ 'movie-premiere':'Film-Premiere', 'series-premiere':'Neue Serie', 'season-premiere':'Neue Staffel', episode:'Neue Episode' })[item.eventKind] || labelType(item.type);
}
function eventDetail(item) {
  if (item.eventKind === 'season-premiere' && item.eventSeason) return `Staffel ${item.eventSeason}`;
  if (item.eventKind === 'episode' && (item.eventSeason || item.eventEpisode)) return `S${item.eventSeason || '?'}E${item.eventEpisode || '?'}`;
  if (item.eventKind === 'series-premiere') return 'S1E1';
  return labelType(item.type);
}
function watchKey(item) { return String(item.entityId || item.id); }
function isTVMazeEvent(item) { return String(item.eventSource || '').startsWith('tvmaze-'); }
function originBadgeLabel(item) {
  if (!item.originalBrand) return '';
  if (item.overrideApplied) return `${item.originalBrand} · MANUELL`;
  if (item.original) return `${item.originalBrand} ORIGINAL`;
  if (item.originType === 'studio') return `${item.originalBrand} STUDIO`;
  return `${item.originalBrand} BRAND`;
}
function confidenceText(item) {
  if (item.overrideApplied || item.originalConfidence === 'manual') return 'manuell geprüft';
  if (item.originalConfidence === 'high') return 'hohe Sicherheit';
  if (item.originalConfidence === 'medium') return 'mittlere Sicherheit';
  if (item.originalConfidence === 'low') return 'niedrige Sicherheit';
  return 'nicht bewertet';
}
function sortByRadarRelevance(a, b) {
  const score = days => Math.abs(days) + (days < 0 ? 4 : 0);
  const eventPriority = { 'series-premiere':0, 'season-premiere':1, 'movie-premiere':2, episode:3 };
  const distance = score(dayDistance(a.releaseDate)) - score(dayDistance(b.releaseDate));
  if (distance) return distance;
  const kind = (eventPriority[a.eventKind] ?? 9) - (eventPriority[b.eventKind] ?? 9);
  return kind || (b.popularity || 0) - (a.popularity || 0);
}

function mergeDuplicate(existing, incoming) {
  const preferred = (incoming.popularity || 0) > (existing.popularity || 0) ? incoming : existing;
  const other = preferred === incoming ? existing : incoming;
  preferred.services = [...new Set([...(preferred.services || []), ...(other.services || [])])];
  preferred.serviceLogos = { ...(other.serviceLogos || {}), ...(preferred.serviceLogos || {}) };
  preferred.originalBrand ||= other.originalBrand;
  preferred.originalLogoPath ||= other.originalLogoPath;
  preferred.originalConfidence ||= other.originalConfidence;
  preferred.originType ||= other.originType;
  preferred.originLabel ||= other.originLabel;
  preferred.originalScore ||= other.originalScore;
  preferred.originalReason ||= other.originalReason;
  preferred.overrideApplied ||= other.overrideApplied;
  preferred.original ||= other.original;
  preferred.description ||= other.description;
  preferred.posterPath ||= other.posterPath;
  preferred.backdropPath ||= other.backdropPath;
  preferred.eventEpisodeName ||= other.eventEpisodeName;
  preferred.eventRuntime ||= other.eventRuntime;
  preferred.eventAirtime ||= other.eventAirtime;
  preferred.eventAirstamp ||= other.eventAirstamp;
  preferred.eventChannel ||= other.eventChannel;
  preferred.tvmazeEpisodeId ||= other.tvmazeEpisodeId;
  preferred.tvmazeShowId ||= other.tvmazeShowId;
  preferred.tvmazeUrl ||= other.tvmazeUrl;
  if (isTVMazeEvent(other) && !isTVMazeEvent(preferred)) preferred.scheduleConfirmed = true;
  if (isTVMazeEvent(preferred)) preferred.scheduleConfirmed = true;
  return preferred;
}

function dedupeReleaseEvents(items) {
  const exact = new Map();
  items.forEach(item => {
    if (!item?.title || item.radarEligible === false) return;
    const primaryKey = item.tmdbId
      ? `${item.mediaType}:${item.tmdbId}:${item.eventKind}:${item.eventSeason || 0}:${item.eventEpisode || 0}:${item.releaseDate || ''}`
      : `${item.entityId || item.id}:${item.eventKind}:${item.releaseDate || ''}`;
    const current = exact.get(primaryKey);
    exact.set(primaryKey, current ? mergeDuplicate(current, item) : item);
  });

  const secondary = new Map();
  [...exact.values()].forEach(item => {
    const fingerprint = [item.type, normalizeTitle(item.originalTitle || item.title), item.releaseDate || '', item.eventKind || '', item.eventSeason || 0, item.eventEpisode || 0].join('|');
    const current = secondary.get(fingerprint);
    secondary.set(fingerprint, current ? mergeDuplicate(current, item) : item);
  });
  return [...secondary.values()].map(enrichRelease).sort(sortByRadarRelevance);
}

state.releases = demoReleases.map(enrichRelease);

function setDataStatus(kind, label, text) {
  $('#dataStatus').dataset.state = kind;
  $('#dataStatusLabel').textContent = label;
  $('#dataStatusText').textContent = text;
  $('#radarState').textContent = kind === 'live' ? 'Origin Intelligence' : kind === 'loading' ? 'Synchronisiere …' : 'Radar aktiv';
  $('#statusAction').textContent = kind === 'live' ? 'Einstellungen' : 'TMDB verbinden';
}
function setLoading(value) {
  state.loading = value;
  $('#loadingGrid').hidden = !value;
  $('#releaseGrid').classList.toggle('is-loading', value);
  $('#refreshData').classList.toggle('spinning', value);
  $('#refreshData').disabled = value;
}
function providerFor(name) { return state.providerMap.find(provider => provider.name === name); }
function brandLogoPath(name) { return state.releases.find(item => item.originalBrand === name && item.originalLogoPath)?.originalLogoPath || providerFor(name)?.logoPath || null; }
function logoMarkup(path, className = 'brand-logo') { return path ? `<img class="${className}" src="${tmdb.image(path, 'w185')}" alt="" loading="lazy"/>` : ''; }
function useDemo(message = 'TMDB noch nicht verbunden.') {
  state.mode = 'demo';
  state.releases = demoReleases.map(enrichRelease);
  state.providerMap = [];
  state.scheduleSyncing = false;
  state.scheduleStats = { days:0, matchedShows:0, events:0, errors:0 };
  state.detailCache.clear();
  state.tvmazeCache.clear();
  setDataStatus('demo', 'Demo-Modus', message);
  renderServices();
  renderReleases();
}

function renderBrandFilter() {
  const select = $('#brandFilter');
  const current = select.value;
  select.innerHTML = '<option value="all">Alle Herkunftsmarken</option>' + brandNames.map(brand => `<option value="${escapeHTML(brand)}">${escapeHTML(brand)}</option>`).join('');
  select.value = brandNames.includes(current) ? current : 'all';
}
function renderServices() {
  $('#serviceStrip').innerHTML = serviceNames.map(name => {
    const provider = providerFor(name);
    const path = provider?.logoPath || brandLogoPath(name);
    const logo = path ? logoMarkup(path, 'service-logo') : '<span class="service-dot"></span>';
    const sourceOnly = state.mode === 'live' && (!provider || !provider.available);
    const kind = brandNames.includes(name) ? 'Herkunftsmarke / Network / Studio' : 'Streaming-Provider';
    return `<button class="service-chip ${state.service === name ? 'active' : ''} ${sourceOnly ? 'source-only' : ''}" data-service="${escapeHTML(name)}" title="${escapeHTML(kind)}: ${escapeHTML(name)}">${logo}<span>${escapeHTML(name)}</span></button>`;
  }).join('');
  $$('.service-chip').forEach(button => button.onclick = () => {
    state.service = state.service === button.dataset.service ? 'all' : button.dataset.service;
    renderServices();
    renderReleases();
  });
}

function matchesView(item) {
  if (state.view === 'today') return dayDistance(item.releaseDate) === 0;
  if (state.view === 'seasons') return item.eventKind === 'season-premiere';
  if (state.view === 'episodes') return item.eventKind === 'episode';
  if (state.view === 'premieres') return item.eventKind === 'series-premiere' || item.eventKind === 'movie-premiere';
  if (state.view === 'upcoming') {
    const days = dayDistance(item.releaseDate);
    return days >= 0 && days <= 30;
  }
  if (state.view === 'watchlist') return state.watchlist.has(watchKey(item));
  return true;
}

function radarCounts() {
  const eligible = state.releases.filter(item => item.radarEligible !== false);
  return {
    today: eligible.filter(item => dayDistance(item.releaseDate) === 0).length,
    seasons: eligible.filter(item => item.eventKind === 'season-premiere').length,
    episodes: eligible.filter(item => item.eventKind === 'episode' && dayDistance(item.releaseDate) >= 0 && dayDistance(item.releaseDate) <= 14).length,
    premieres: eligible.filter(item => (item.eventKind === 'series-premiere' || item.eventKind === 'movie-premiere') && dayDistance(item.releaseDate) >= 0 && dayDistance(item.releaseDate) <= 30).length
  };
}

function renderRadarSummary() {
  const root = $('#radarSummary');
  if (!root) return;
  const counts = radarCounts();
  const cards = [
    ['today', 'Heute', counts.today, 'Events heute'],
    ['seasons', 'Staffelstarts', counts.seasons, 'im Radar'],
    ['episodes', 'Episoden', counts.episodes, 'nächste 14 Tage'],
    ['premieres', 'Premieren', counts.premieres, 'nächste 30 Tage']
  ];
  root.innerHTML = cards.map(([view, label, count, copy]) => `<button class="radar-summary-card ${state.view === view ? 'active' : ''}" data-summary-view="${view}"><span>${escapeHTML(label)}</span><strong>${count}</strong><small>${escapeHTML(copy)}</small></button>`).join('');
  $$('[data-summary-view]').forEach(button => button.onclick = () => setView(button.dataset.summaryView));
}

function renderReleases() {
  const query = $('#searchInput').value.trim().toLowerCase();
  const type = $('#typeFilter').value;
  const event = $('#eventFilter').value;
  const period = $('#periodFilter').value;
  const originals = $('#originalsOnly').checked;
  const brand = $('#brandFilter').value;

  const filtered = state.releases.filter(item => {
    if (item.radarEligible === false) return false;
    const haystack = `${item.title} ${item.originalTitle || ''} ${(item.services || []).join(' ')} ${item.originalBrand || ''} ${item.originType || ''} ${item.originLabel || ''} ${item.studio || ''} ${eventLabel(item)} ${item.eventEpisodeName || ''} ${item.eventChannel || ''}`.toLowerCase();
    return matchesView(item)
      && (state.service === 'all' || item.services?.includes(state.service) || item.originalBrand === state.service)
      && (type === 'all' || item.type === type)
      && (event === 'all' || item.eventKind === event)
      && (period === 'all' || item.period === period)
      && (!originals || item.original === true)
      && (brand === 'all' || item.originalBrand === brand)
      && (!query || haystack.includes(query));
  });

  const eligibleCount = state.releases.filter(item => item.radarEligible !== false).length;
  $('#heroReleaseCount').textContent = eligibleCount;
  $('#watchlistCount').textContent = state.watchlist.size;
  $('#resultSummary').textContent = state.loading
    ? 'TMDB-Daten werden geladen …'
    : `${filtered.length} Release-Events ${state.mode === 'live' ? 'für Österreich' : 'im Demo-Modus'}${state.enriching ? ' · Herkunft wird bewertet …' : ''}${state.scheduleSyncing ? ' · TVmaze-Schedule wird synchronisiert …' : ''}`;
  $('#releaseGrid').innerHTML = filtered.map(cardTemplate).join('');
  $('#emptyState').hidden = filtered.length > 0 || state.loading || state.enriching || state.scheduleSyncing;
  renderRadarSummary();

  $$('.release-card').forEach(card => card.onclick = eventClick => {
    if (!eventClick.target.closest('.save-button')) openDetails(card.dataset.id);
  });
  $$('.save-button').forEach(button => button.onclick = eventClick => {
    eventClick.stopPropagation();
    toggleWatchlist(button.dataset.watchKey);
  });
}

function cardTemplate(item) {
  const saved = state.watchlist.has(watchKey(item));
  const poster = item.posterPath
    ? `<img class="poster-image" src="${tmdb.image(item.posterPath, 'w500')}" alt="Poster von ${escapeHTML(item.title)}" loading="lazy"/>`
    : `<span class="poster-monogram">${escapeHTML(item.title.split(' ').map(part => part[0]).join('').slice(0, 3))}</span>`;
  const primary = item.services?.[0] || 'Unbekannt';
  const extra = Math.max(0, (item.services?.length || 1) - 1);
  const rating = item.rating > 0 ? `<span class="rating">★ ${item.rating.toFixed(1)}</span>` : '';
  const brandLogo = item.originalBrand ? logoMarkup(item.originalLogoPath || brandLogoPath(item.originalBrand), 'original-badge-logo') : '';
  const badgeClass = item.original ? 'original-brand' : 'original-brand origin-studio';
  const rightBadge = item.originalBrand
    ? `<span class="badge ${badgeClass}" title="${escapeHTML(confidenceText(item))}${item.originalScore ? ` · Score ${item.originalScore}` : ''}">${brandLogo}<span>${escapeHTML(originBadgeLabel(item))}</span></span>`
    : (state.mode === 'demo' ? '<span class="badge demo">DEMO</span>' : '');
  const episodeCopy = item.eventKind === 'episode' && item.eventEpisodeName ? ` · ${escapeHTML(item.eventEpisodeName)}` : '';
  const sourceChip = isTVMazeEvent(item) || item.scheduleConfirmed ? '<span class="schedule-source">TVMAZE ✓</span>' : '';
  const overrideChip = item.overrideApplied ? '<span class="origin-override-chip">OVERRIDE</span>' : '';
  const channelCopy = item.eventChannel ? ` · ${escapeHTML(item.eventChannel)}` : '';
  const originCopy = item.originalBrand ? `${escapeHTML(item.originLabel || (item.original ? 'Original von' : 'Herkunft'))}: ${escapeHTML(item.originalBrand)} · ` : '';
  return `<article class="release-card" data-id="${escapeHTML(item.id)}" style="--card-accent:${item.accent}">
    <div class="poster">${poster}<div class="poster-shade"></div><div class="badge-row"><span class="badge">${escapeHTML(primary)}${extra ? ` +${extra}` : ''}</span>${rightBadge}</div>${rating}<span class="event-ribbon event-${escapeHTML(item.eventKind || 'unknown')}">${escapeHTML(eventLabel(item))}</span>${sourceChip}${overrideChip}</div>
    <button class="save-button ${saved ? 'saved' : ''}" data-watch-key="${escapeHTML(watchKey(item))}" aria-label="${saved ? 'Von Merkliste entfernen' : 'Zur Merkliste hinzufügen'}">${saved ? '✓' : '+'}</button>
    <div class="card-body"><div class="card-meta"><span>${escapeHTML(eventDetail(item))}</span><span>${escapeHTML(item.date)}</span></div><h3>${escapeHTML(item.title)}</h3><p>${originCopy}${escapeHTML(item.services?.join(' · ') || 'Streaming')}${channelCopy}${episodeCopy}</p></div>
  </article>`;
}

function toggleWatchlist(key) {
  const value = String(key);
  state.watchlist.has(value) ? state.watchlist.delete(value) : state.watchlist.add(value);
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify([...state.watchlist]));
  renderReleases();
}

async function syncGlobalEpisodeRadar() {
  state.scheduleSyncing = true;
  renderReleases();
  try {
    const result = await tvmaze.getGlobalEpisodeEvents(state.releases, (done, total) => {
      setDataStatus('live', 'TVmaze Schedule', `Globale Streaming-Episoden ${done}/${total} Tage …`);
    }, { pastDays:1, futureDays:14, maxPerSeries:4 });
    state.scheduleStats = result.stats;
    state.releases = dedupeReleaseEvents([...state.releases, ...result.events]);
  } catch (error) {
    console.warn('StreamRadar: globaler TVmaze-Episodenradar konnte nicht vollständig geladen werden.', error);
    state.scheduleStats = { days:0, matchedShows:0, events:0, errors:1 };
  } finally {
    state.scheduleSyncing = false;
  }
}

async function enrichRadarMetadata(token) {
  if (state.mode !== 'live') return;
  state.enriching = true;
  renderReleases();
  const candidates = [...state.releases].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  try {
    await tmdb.enrichRadarMetadata(candidates, token, (done, total) => {
      setDataStatus('live', 'Origin Intelligence', `Bewerte Herkunft & Originals ${done}/${total} …`);
      if (done % 8 === 0 || done === total) {
        renderServices();
        renderReleases();
      }
    });
    state.enriching = false;
    await syncGlobalEpisodeRadar();
  } finally {
    state.releases = dedupeReleaseEvents(state.releases);
    state.enriching = false;
    state.scheduleSyncing = false;
    const counts = state.releases.reduce((acc, item) => {
      acc[item.eventKind] = (acc[item.eventKind] || 0) + 1;
      if (item.original) acc.originals = (acc.originals || 0) + 1;
      if (item.originType === 'studio') acc.studios = (acc.studios || 0) + 1;
      if (item.overrideApplied) acc.overrides = (acc.overrides || 0) + 1;
      return acc;
    }, {});
    const scheduleText = state.scheduleStats.events ? ` · ${state.scheduleStats.events} TVmaze-Events` : '';
    const overrideText = counts.overrides ? ` · ${counts.overrides} Overrides` : '';
    setDataStatus('live', 'TMDB + TVmaze', `${state.releases.length} Events · ${counts.originals || 0} Originals · ${counts.studios || 0} Studio-Brands${scheduleText}${overrideText} · AT.`);
    renderServices();
    renderReleases();
  }
}

async function loadLiveData({ closeSettings = false } = {}) {
  const token = localStorage.getItem(TOKEN_KEY)?.trim();
  if (!token) return useDemo();
  setLoading(true);
  setDataStatus('loading', 'TMDB wird geladen', 'Provider und Kandidaten für Österreich werden synchronisiert …');
  $('#settingsStatus').textContent = 'Verbindung wird geprüft …';
  try {
    const result = await tmdb.loadRadar(token, (done, total) => setDataStatus('loading', 'TMDB wird geladen', `Datenquellen ${done}/${total} …`));
    state.mode = 'live';
    state.providerMap = result.providers;
    state.releases = result.releases.map(enrichRelease).filter(item => item.title).sort(sortByRadarRelevance);
    state.scheduleStats = { days:0, matchedShows:0, events:0, errors:0 };
    state.detailCache.clear();
    state.tvmazeCache.clear();
    setDataStatus('live', 'TMDB live', `${state.releases.length} Kandidaten · Herkunftsbewertung startet …`);
    $('#settingsStatus').textContent = 'Verbunden. Live-Daten sind aktiv.';
    renderServices();
    renderReleases();
    if (closeSettings && $('#settingsDialog').open) $('#settingsDialog').close();
    enrichRadarMetadata(token);
  } catch (error) {
    console.error(error);
    const auth = error.status === 401 || error.status === 403;
    useDemo(auth ? 'TMDB-Token ungültig oder nicht autorisiert.' : 'TMDB ist gerade nicht erreichbar – Demo-Daten werden angezeigt.');
    $('#settingsStatus').textContent = auth ? 'Token konnte nicht authentifiziert werden.' : 'Verbindung fehlgeschlagen.';
    if (auth) openSettings();
  } finally {
    setLoading(false);
  }
}

async function openDetails(id) {
  const item = state.releases.find(release => String(release.id) === String(id));
  if (!item) return;
  renderDetail(item, null, null, true);
  $('#detailDialog').showModal();
  if (state.mode !== 'live' || !item.tmdbId) return;

  const key = `${item.mediaType}-${item.tmdbId}`;
  let details = state.detailCache.get(key);
  try {
    if (!details) {
      details = await tmdb.getDetails(item.mediaType, item.tmdbId, localStorage.getItem(TOKEN_KEY));
      if (item.eventKind === 'season-premiere' && item.eventSeason) {
        details.seasonProviders = await tmdb.getSeasonProviders(item.tmdbId, item.eventSeason, localStorage.getItem(TOKEN_KEY));
      }
      state.detailCache.set(key, details);
      if (details.inferredOriginalBrand) {
        item.originalBrand = details.inferredOriginalBrand;
        item.originalConfidence = details.originalConfidence;
        item.originalLogoPath = details.inferredOriginalLogoPath || item.originalLogoPath;
        item.originalLogoSource = details.originalLogoSource || item.originalLogoSource;
        item.originType = details.originType || item.originType;
        item.originLabel = details.originLabel || item.originLabel;
        item.originalScore = details.originalScore ?? item.originalScore;
        item.originalReason = details.originalReason || item.originalReason;
        item.overrideApplied = Boolean(details.overrideApplied);
        item.original = Boolean(details.qualifiesAsOriginal);
      }
      if (!isTVMazeEvent(item) && details.classification?.radarEligible) Object.assign(item, enrichRelease({ ...item, ...details.classification }));
      renderServices();
      renderReleases();
    }

    renderDetail(item, details, null, item.mediaType === 'tv');
    if (item.mediaType === 'tv') {
      let maze = state.tvmazeCache.get(key);
      if (!maze) {
        maze = await tvmaze.getSeriesRadar(details.external_ids || item.externalIds || {}, item.originalTitle || item.title);
        state.tvmazeCache.set(key, maze);
      }
      renderDetail(item, details, maze, false);
    } else {
      renderDetail(item, details, null, false);
    }
  } catch (error) {
    console.warn('Detail enrichment failed', error);
    renderDetail(item, details, { loadError:true }, false);
  }
}

function renderDetail(item, details, maze, loading) {
  const backdrop = item.backdropPath ? tmdb.image(item.backdropPath, 'w1280') : '';
  const genres = details?.genres?.map(genre => genre.name) || [];
  const runtime = item.eventRuntime || (item.mediaType === 'movie' ? details?.runtime : details?.episode_run_time?.[0]);
  const seasonProviders = details?.seasonProviders?.providers || [];
  const providers = seasonProviders.length ? seasonProviders : (details?.providers || []);
  const providerPills = providers.slice(0, 8).map(provider => `<span class="provider-pill">${provider.logo_path ? `<img src="${tmdb.image(provider.logo_path, 'w92')}" alt=""/>` : ''}${escapeHTML(provider.provider_name)}</span>`).join('');
  const tmdbUrl = item.tmdbId ? `https://www.themoviedb.org/${item.mediaType}/${item.tmdbId}` : null;
  const style = backdrop ? `--detail-bg:url('${backdrop}');--card-accent:${item.accent}` : `--card-accent:${item.accent}`;
  const brand = item.originalBrand || details?.inferredOriginalBrand;
  const confidence = item.originalConfidence || details?.originalConfidence;
  const originType = item.originType || details?.originType;
  const originLabel = item.originLabel || details?.originLabel || (item.original ? 'Original von' : 'Herkunft');
  const originScore = item.originalScore ?? details?.originalScore;
  const originReason = item.originalReason || details?.originalReason || details?.originalEvidence;
  const overrideApplied = item.overrideApplied || details?.overrideApplied;
  const originalLogo = item.originalLogoPath || details?.inferredOriginalLogoPath || brandLogoPath(brand);
  const originLogo = brand && originalLogo ? `<div class="origin-logo-wrap">${logoMarkup(originalLogo, 'origin-logo')}</div>` : '';
  const eventInfo = item.eventKind === 'episode'
    ? `S${item.eventSeason || '?'}E${item.eventEpisode || '?'}${item.eventEpisodeName ? ` · ${escapeHTML(item.eventEpisodeName)}` : ''}`
    : item.eventKind === 'season-premiere' ? `Staffel ${item.eventSeason || '?'}` : item.eventKind === 'series-premiere' ? 'S1E1' : labelType(item.type);
  const eventExtras = [item.eventChannel, runtime ? `${runtime} Min.` : null, item.eventAirtime ? `${item.eventAirtime} Uhr` : null].filter(Boolean).map(escapeHTML).join(' · ');
  const scheduleConfirmed = isTVMazeEvent(item) || item.scheduleConfirmed ? '<span class="schedule-confirmed">TVmaze Schedule bestätigt</span>' : '';
  const eventPanel = `<div class="release-event-panel event-${escapeHTML(item.eventKind || 'unknown')}"><span class="section-kicker">RELEASE-TYP</span><div><strong>${escapeHTML(eventLabel(item))}</strong><span>${escapeHTML(eventInfo)} · ${escapeHTML(item.date)}${eventExtras ? ` · ${eventExtras}` : ''}</span>${scheduleConfirmed}</div></div>`;

  const episode = maze?.nextEpisode;
  const sameEpisode = episode && item.eventEpisode && Number(episode.season) === Number(item.eventSeason) && Number(episode.number) === Number(item.eventEpisode) && episode.airdate === item.releaseDate;
  const episodePanel = episode && !sameEpisode
    ? `<div class="tvmaze-panel"><div><span class="section-kicker">${maze.nextIsNewSeason ? 'KOMMENDER STAFFELSTART' : 'NÄCHSTE EPISODE'} · TVMAZE</span><h3>${maze.nextIsNewSeason ? `Staffel ${episode.season} startet` : `S${episode.season || '?'}E${episode.number || '?'} · ${escapeHTML(episode.name)}`}</h3><p>${escapeHTML(formatReleaseDate(episode.airdate))}${episode.runtime ? ` · ${episode.runtime} Min.` : ''}${maze.network ? ` · ${escapeHTML(maze.network)}` : ''}</p></div>${episode.image ? `<img src="${escapeHTML(episode.image)}" alt=""/>` : ''}</div>`
    : (maze && !maze.loadError && !sameEpisode ? '<div class="tvmaze-panel compact">Keine weitere kommende Episode in den nächsten 120 Tagen bei TVmaze hinterlegt.</div>' : '');

  const providerHeading = seasonProviders.length && item.eventSeason ? `Staffel ${item.eventSeason} läuft in Österreich bei` : 'Läuft in Österreich bei';
  const watchLink = details?.seasonProviders?.watchLink || details?.watchLink;
  const originQuality = brand ? `<div class="origin-quality"><span class="quality-pill quality-${escapeHTML(overrideApplied ? 'manual' : confidence || 'unknown')}">${escapeHTML(overrideApplied ? 'MANUELL' : String(confidence || 'unbekannt').toUpperCase())}${originScore ? ` · ${originScore}` : ''}</span><span>${escapeHTML(originReason || 'Keine zusätzliche Evidenz hinterlegt.')}</span>${originType ? `<span>Typ: ${escapeHTML(originType)}</span>` : ''}</div>` : '';

  $('#dialogContent').innerHTML = `<div class="detail-hero ${backdrop ? 'has-backdrop' : ''}" style="${style}"><div><span class="section-kicker">${escapeHTML(item.services?.join(' · ') || 'STREAMRADAR')}</span><h2>${escapeHTML(item.title)}</h2><span>${escapeHTML(eventLabel(item))} · ${escapeHTML(item.date)}</span></div></div><div class="detail-content"><p>${escapeHTML(details?.overview || item.description || 'Keine Beschreibung verfügbar.')}</p>${eventPanel}${brand ? `<div class="origin-line ${item.original ? '' : 'origin-line-studio'}">${originLogo}<div class="origin-copy"><strong>${escapeHTML(originLabel)} ${escapeHTML(brand)}</strong><span>${escapeHTML(overrideApplied ? 'manuell geprüft' : confidenceText({ originalConfidence:confidence }))}${originScore ? ` · Score ${originScore}` : ''}</span></div></div>${originQuality}` : ''}<div class="detail-facts">${item.rating > 0 ? `<span>★ ${item.rating.toFixed(1)} TMDB</span>` : ''}${runtime ? `<span>${runtime} Min.</span>` : ''}${details?.number_of_seasons ? `<span>${details.number_of_seasons} Staffeln</span>` : ''}${genres.slice(0, 3).map(genre => `<span>${escapeHTML(genre)}</span>`).join('')}<span>Region AT</span></div>${episodePanel}${providerPills ? `<div class="provider-list"><strong>${escapeHTML(providerHeading)}</strong><div>${providerPills}</div></div>` : `<div class="provider-list"><strong>${escapeHTML(providerHeading)}</strong><p>Keine aktuellen Providerdaten gefunden.</p></div>`}${loading ? '<div class="inline-loading">Release-, Herkunfts- und Episodendaten werden geladen …</div>' : ''}${maze?.loadError ? '<div class="inline-error">TVmaze-Zusatzdaten konnten nicht geladen werden.</div>' : ''}<div class="detail-actions">${tmdbUrl ? `<a class="ghost-button link-button" href="${tmdbUrl}" target="_blank" rel="noopener">Auf TMDB ansehen ↗</a>` : ''}${watchLink ? `<a class="primary-button link-button" href="${escapeHTML(watchLink)}" target="_blank" rel="noopener">Streamingoptionen ↗</a>` : ''}${item.tvmazeUrl ? `<a class="ghost-button link-button" href="${escapeHTML(item.tvmazeUrl)}" target="_blank" rel="noopener">Episode auf TVmaze ↗</a>` : ''}${maze?.url && maze.url !== item.tvmazeUrl ? `<a class="ghost-button link-button" href="${escapeHTML(maze.url)}" target="_blank" rel="noopener">Serie auf TVmaze ↗</a>` : ''}</div><p class="attribution">Release-Klassifizierung, Herkunfts-Scoring, Metadaten & Network-/Studio-Logos: TMDB · Streaming-Verfügbarkeit: JustWatch via TMDB · globaler Web-/Streaming-Episodenplan und Episodendaten: TVmaze. Studio-/Brand-Treffer werden nicht automatisch als Streaming-Original behandelt; manuelle Korrekturen laufen über die Override-Schicht.</p></div>`;
}

function setView(view) {
  state.view = view;
  $$('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.view === view));
  if (view === 'today') { $('#viewKicker').textContent = 'HEUTE'; $('#viewTitle').textContent = 'Heute erschienen'; }
  else if (view === 'seasons') { $('#viewKicker').textContent = 'STAFFEL-RADAR'; $('#viewTitle').textContent = 'Neue Staffeln'; }
  else if (view === 'episodes') { $('#viewKicker').textContent = 'EPISODEN-RADAR'; $('#viewTitle').textContent = 'Neue Episoden'; }
  else if (view === 'premieres') { $('#viewKicker').textContent = 'PREMIEREN'; $('#viewTitle').textContent = 'Neue Filme & Serien'; }
  else if (view === 'upcoming') { $('#viewKicker').textContent = 'KOMMENDE 30 TAGE'; $('#viewTitle').textContent = 'Demnächst'; }
  else if (view === 'watchlist') { $('#viewKicker').textContent = 'GESPEICHERT'; $('#viewTitle').textContent = 'Deine Merkliste'; }
  else { $('#viewKicker').textContent = 'DEIN FEED'; $('#viewTitle').textContent = 'Neu & relevant'; }
  renderReleases();
  $('#releases').scrollIntoView({ behavior:'smooth' });
}
function resetFilters() {
  state.service = 'all';
  state.view = 'discover';
  $$('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.view === 'discover'));
  $('#searchInput').value = '';
  $('#typeFilter').value = 'all';
  $('#eventFilter').value = 'all';
  $('#periodFilter').value = 'all';
  $('#brandFilter').value = 'all';
  $('#originalsOnly').checked = false;
  $('#viewKicker').textContent = 'DEIN FEED';
  $('#viewTitle').textContent = 'Neu & relevant';
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
  if (!token) return $('#settingsStatus').textContent = 'Bitte zuerst einen Token eintragen.';
  $('#saveToken').disabled = true;
  try {
    await tmdb.validateToken(token);
    localStorage.setItem(TOKEN_KEY, token);
    await loadLiveData({ closeSettings:true });
  } catch (error) {
    $('#settingsStatus').textContent = error.status === 401 || error.status === 403 ? 'Dieser Token ist ungültig oder nicht autorisiert.' : 'TMDB konnte nicht erreicht werden.';
  } finally {
    $('#saveToken').disabled = false;
  }
}
function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  $('#tmdbToken').value = '';
  useDemo('TMDB-Verbindung wurde entfernt.');
  $('#settingsStatus').textContent = 'Token entfernt.';
}

renderBrandFilter();
$$('.nav-link').forEach(button => button.onclick = () => setView(button.dataset.view));
$('#searchInput').oninput = renderReleases;
$('#typeFilter').onchange = renderReleases;
$('#eventFilter').onchange = renderReleases;
$('#periodFilter').onchange = renderReleases;
$('#brandFilter').onchange = renderReleases;
$('#originalsOnly').onchange = renderReleases;
$('#resetServices').onclick = () => { state.service = 'all'; renderServices(); renderReleases(); };
$('#clearFilters').onclick = resetFilters;
$('#showUpcoming').onclick = () => setView('upcoming');
$('[data-jump="releases"]').onclick = () => $('#releases').scrollIntoView({ behavior:'smooth' });
$('#dialogClose').onclick = () => $('#detailDialog').close();
$('#detailDialog').onclick = event => { if (event.target === $('#detailDialog')) $('#detailDialog').close(); };
$('#openSettings').onclick = openSettings;
$('#statusAction').onclick = openSettings;
$('#settingsClose').onclick = () => $('#settingsDialog').close();
$('#settingsDialog').onclick = event => { if (event.target === $('#settingsDialog')) $('#settingsDialog').close(); };
$('#saveToken').onclick = saveToken;
$('#clearToken').onclick = clearToken;
$('#refreshData').onclick = () => localStorage.getItem(TOKEN_KEY) ? loadLiveData() : openSettings();
$('#themePulse').onclick = () => {
  const current = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  document.documentElement.style.setProperty('--accent', current === '#62f7c7' ? '#7c6dff' : '#62f7c7');
};
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
