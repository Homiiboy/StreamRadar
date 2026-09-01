from pathlib import Path
import json
import re
import shutil

ROOT = Path('.')
VERSION = '0.4.0'
PREVIOUS = '0.3.0'


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def write(path, text):
    (ROOT / path).write_text(text, encoding='utf-8', newline='\n')


def replace_once(text, old, new, label):
    if old not in text:
        if new in text:
            return text
        raise SystemExit(f'Missing marker in {label}: {old[:120]!r}')
    return text.replace(old, new, 1)

# Stable snapshots before the v0.4.0 catalog redesign.
css_archive = ROOT / 'OldCss' / 'styles-v0.3.0.css'
ui_archive = ROOT / 'OldUi' / 'ui-v0.3.0.js'
if not css_archive.exists():
    shutil.copyfile(ROOT / 'styles.css', css_archive)
if not ui_archive.exists():
    shutil.copyfile(ROOT / 'js/ui.js', ui_archive)

# Version files.
write('VERSION', VERSION + '\n')
package = json.loads(read('package.json'))
package['version'] = VERSION
write('package.json', json.dumps(package, ensure_ascii=False, indent=2) + '\n')

tauri = json.loads(read('src-tauri/tauri.conf.json'))
tauri['version'] = VERSION
write('src-tauri/tauri.conf.json', json.dumps(tauri, ensure_ascii=False, indent=2) + '\n')

cargo = re.sub(r'(?m)^version = "0\.3\.0"$', 'version = "0.4.0"', read('src-tauri/Cargo.toml'), count=1)
write('src-tauri/Cargo.toml', cargo)

# TMDB: keep release discovery unchanged and add a separate catalog data path without date limits.
tmdb = read('js/tmdb.js')
insert_marker = "  function mergeReleases(groups) {\n"
catalog_api = r'''  function normalizeCatalogItem(item, mediaType, service) {
    const baseDate = mediaType === 'movie' ? item.release_date : item.first_air_date;
    const isAnime = mediaType === 'tv' && item.genre_ids?.includes(16) && item.original_language === 'ja';
    return {
      id: `catalog-${mediaType}-${item.id}`,
      entityId: `${mediaType}-${item.id}`,
      tmdbId: item.id,
      mediaType,
      type: mediaType === 'movie' ? 'movie' : (isAnime ? 'anime' : 'series'),
      title: mediaType === 'movie' ? item.title : item.name,
      originalTitle: mediaType === 'movie' ? item.original_title : item.original_name,
      description: item.overview || 'Für diesen Titel ist derzeit keine deutsche Beschreibung hinterlegt.',
      releaseDate: baseDate || '',
      posterPath: item.poster_path || null,
      backdropPath: item.backdrop_path || null,
      rating: Number(item.vote_average || 0),
      voteCount: Number(item.vote_count || 0),
      popularity: Number(item.popularity || 0),
      genreIds: item.genre_ids || [],
      originalLanguage: item.original_language || '',
      services: [service.name],
      serviceLogos: service.logoPath ? { [service.name]: service.logoPath } : {},
      catalogAvailable: true,
      radarEligible: false,
      eventKind: null,
      eventLabel: null,
      source: 'tmdb-catalog'
    };
  }

  function mergeCatalogItems(groups) {
    const merged = new Map();
    groups.flat().forEach(item => {
      if (!item?.entityId || !item?.title) return;
      const current = merged.get(item.entityId);
      if (!current) {
        merged.set(item.entityId, item);
        return;
      }
      item.services.forEach(service => { if (!current.services.includes(service)) current.services.push(service); });
      current.serviceLogos = { ...current.serviceLogos, ...item.serviceLogos };
      current.posterPath ||= item.posterPath;
      current.backdropPath ||= item.backdropPath;
      current.description ||= item.description;
      current.rating = Math.max(current.rating || 0, item.rating || 0);
      current.voteCount = Math.max(current.voteCount || 0, item.voteCount || 0);
      current.popularity = Math.max(current.popularity || 0, item.popularity || 0);
    });
    return [...merged.values()].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }

  async function discoverCatalogForProvider(service, mediaType, token, options = {}) {
    const providerId = mediaType === 'movie' ? service.movieProviderId : service.tvProviderId;
    if (!providerId) return { items:[], page:Number(options.page || 1), totalPages:0, totalResults:0, service:service.name };
    const page = Math.max(1, Math.min(500, Number(options.page || 1)));
    const params = {
      language: LANGUAGE,
      watch_region: REGION,
      with_watch_providers: providerId,
      with_watch_monetization_types: 'flatrate|free|ads',
      include_adult: false,
      page,
      sort_by: options.sortBy || 'popularity.desc'
    };
    if (mediaType === 'movie') params.region = REGION;
    if (options.anime) {
      params.with_genres = '16';
      params.with_original_language = 'ja';
    }
    const data = await request(`/discover/${mediaType}`, token, params);
    return {
      items: (data.results || []).map(item => normalizeCatalogItem(item, mediaType, service)),
      page: Number(data.page || page),
      totalPages: Math.min(500, Number(data.total_pages || 0)),
      totalResults: Number(data.total_results || 0),
      service: service.name
    };
  }

  async function loadCatalogPage(token, providerMap, options = {}) {
    const mediaType = options.mediaType === 'tv' ? 'tv' : 'movie';
    const requested = new Set((options.providerNames || []).map(String));
    const services = (providerMap || []).filter(service => service.available && (!requested.size || requested.has(service.name)));
    const jobs = services
      .filter(service => mediaType === 'movie' ? service.movieProviderId : service.tvProviderId)
      .map(service => ({ service, mediaType }));
    const groups = [];
    const pageStats = [];
    const queue = [...jobs];
    const workers = Array.from({ length: Math.min(5, Math.max(1, queue.length)) }, async () => {
      while (queue.length) {
        const job = queue.shift();
        try {
          const result = await discoverCatalogForProvider(job.service, mediaType, token, options);
          groups.push(result.items);
          pageStats.push({ service:result.service, page:result.page, totalPages:result.totalPages, totalResults:result.totalResults });
        } catch (error) {
          console.warn(`StreamRadar Catalog: ${job.service.name}/${mediaType} konnte nicht geladen werden.`, error);
          pageStats.push({ service:job.service.name, page:Number(options.page || 1), totalPages:0, totalResults:0, error:true });
        }
      }
    });
    await Promise.all(workers);
    return {
      items: mergeCatalogItems(groups),
      page: Number(options.page || 1),
      providers: services,
      pageStats,
      hasMore: pageStats.some(stat => stat.totalPages > stat.page)
    };
  }

'''
if 'async function loadCatalogPage(' not in tmdb:
    tmdb = replace_once(tmdb, insert_marker, catalog_api + insert_marker, 'js/tmdb.js catalog api')
exports_old = "    loadRadar,\n    enrichRadarMetadata,\n"
exports_new = "    loadRadar,\n    loadCatalogPage,\n    discoverCatalogForProvider,\n    mergeCatalogItems,\n    enrichRadarMetadata,\n"
tmdb = replace_once(tmdb, exports_old, exports_new, 'js/tmdb.js exports')
write('js/tmdb.js', tmdb)

# Dedicated catalog UI layer loaded after the existing release/personalization layers.
catalog_js = r'''(() => {
  const VERSION = '0.4.0';
  const TOKEN_KEY = 'streamradar-tmdb-token';
  const PROVIDERS_KEY = 'streamradar-preferred-providers';
  const CATALOG_META_KEY = 'streamradar-catalog-watchlist-v1';
  const CATALOG_VIEWS = new Set(['catalog-home','catalog-movies','catalog-series','catalog-anime','catalog-watchlist']);
  const releaseSetView = setView;
  const releaseLoadLiveData = loadLiveData;
  const releaseUseDemo = useDemo;
  const searchInput = $('#searchInput');
  const releaseSearchInput = searchInput?.oninput || null;
  const releaseSearchFocus = searchInput?.onfocus || null;

  const themes = {
    'Netflix': { accent:'#e50914', glow:'rgba(229,9,20,.34)', label:'NETFLIX' },
    'Disney+': { accent:'#4b79ff', glow:'rgba(75,121,255,.34)', label:'DISNEY+' },
    'Prime Video': { accent:'#00a8e1', glow:'rgba(0,168,225,.30)', label:'PRIME VIDEO' },
    'HBO Max': { accent:'#8b5cf6', glow:'rgba(139,92,246,.32)', label:'HBO MAX' },
    'Apple TV+': { accent:'#f4f5f7', glow:'rgba(225,230,238,.22)', label:'APPLE TV+' },
    'Paramount+': { accent:'#1b64f2', glow:'rgba(27,100,242,.32)', label:'PARAMOUNT+' },
    'Crunchyroll': { accent:'#f47521', glow:'rgba(244,117,33,.30)', label:'CRUNCHYROLL' },
    'Sky / WOW': { accent:'#ff4fd8', glow:'rgba(255,79,216,.28)', label:'SKY / WOW' },
    'Joyn': { accent:'#f4d44d', glow:'rgba(244,212,77,.25)', label:'JOYN' },
    'RTL+': { accent:'#36d49b', glow:'rgba(54,212,155,.25)', label:'RTL+' },
    'ORF': { accent:'#ef4f5c', glow:'rgba(239,79,92,.26)', label:'ORF' }
  };

  const demoCatalog = [
    {id:'catalog-movie-1001',entityId:'movie-1001',tmdbId:null,mediaType:'movie',type:'movie',title:'Midnight Protocol',description:'Demo-Katalogfilm.',releaseDate:'2024-03-14',rating:7.8,popularity:98,services:['Netflix'],catalogAvailable:true,source:'demo-catalog'},
    {id:'catalog-movie-1002',entityId:'movie-1002',tmdbId:null,mediaType:'movie',type:'movie',title:'Northern Lights',description:'Demo-Katalogfilm.',releaseDate:'2022-11-02',rating:7.2,popularity:91,services:['Netflix'],catalogAvailable:true,source:'demo-catalog'},
    {id:'catalog-tv-2001',entityId:'tv-2001',tmdbId:null,mediaType:'tv',type:'series',title:'Terminal Zero',description:'Demo-Katalogserie.',releaseDate:'2023-07-11',rating:8.1,popularity:96,services:['Netflix'],catalogAvailable:true,source:'demo-catalog'},
    {id:'catalog-movie-1003',entityId:'movie-1003',tmdbId:null,mediaType:'movie',type:'movie',title:'Atlas Run',description:'Demo-Katalogfilm.',releaseDate:'2021-09-20',rating:7.4,popularity:89,services:['Prime Video'],catalogAvailable:true,source:'demo-catalog'},
    {id:'catalog-tv-2002',entityId:'tv-2002',tmdbId:null,mediaType:'tv',type:'series',title:'The Long Signal',description:'Demo-Katalogserie.',releaseDate:'2024-01-19',rating:8.0,popularity:88,services:['Prime Video'],catalogAvailable:true,source:'demo-catalog'},
    {id:'catalog-movie-1004',entityId:'movie-1004',tmdbId:null,mediaType:'movie',type:'movie',title:'Blue Kingdom',description:'Demo-Katalogfilm.',releaseDate:'2020-12-01',rating:7.5,popularity:86,services:['Disney+'],catalogAvailable:true,source:'demo-catalog'},
    {id:'catalog-tv-2003',entityId:'tv-2003',tmdbId:null,mediaType:'tv',type:'series',title:'Harbor Nine',description:'Demo-Katalogserie.',releaseDate:'2022-05-09',rating:7.9,popularity:84,services:['Disney+'],catalogAvailable:true,source:'demo-catalog'},
    {id:'catalog-tv-3001',entityId:'tv-3001',tmdbId:null,mediaType:'tv',type:'anime',title:'Starlight Blade',description:'Demo-Anime.',releaseDate:'2023-10-06',rating:8.4,popularity:92,services:['Crunchyroll'],catalogAvailable:true,source:'demo-catalog'},
    {id:'catalog-tv-2004',entityId:'tv-2004',tmdbId:null,mediaType:'tv',type:'series',title:'White Room',description:'Demo-Katalogserie.',releaseDate:'2024-02-23',rating:8.2,popularity:87,services:['Apple TV+'],catalogAvailable:true,source:'demo-catalog'},
    {id:'catalog-movie-1005',entityId:'movie-1005',tmdbId:null,mediaType:'movie',type:'movie',title:'After the Rain',description:'Demo-Katalogfilm.',releaseDate:'2022-08-16',rating:7.7,popularity:82,services:['Apple TV+'],catalogAvailable:true,source:'demo-catalog'},
    {id:'catalog-tv-2005',entityId:'tv-2005',tmdbId:null,mediaType:'tv',type:'series',title:'Black Meridian',description:'Demo-Katalogserie.',releaseDate:'2021-06-08',rating:8.0,popularity:80,services:['HBO Max'],catalogAvailable:true,source:'demo-catalog'},
    {id:'catalog-movie-1006',entityId:'movie-1006',tmdbId:null,mediaType:'movie',type:'movie',title:'Silent Avenue',description:'Demo-Katalogfilm.',releaseDate:'2023-04-10',rating:7.1,popularity:78,services:['Paramount+'],catalogAvailable:true,source:'demo-catalog'}
  ];

  const catalogState = {
    view:'catalog-home', provider:null, page:1, loading:false, hasMore:false,
    items:[], allItems:new Map(), providerMap:[], error:null, query:'', requestSerial:0
  };

  const slug = value => String(value || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const isCatalogView = view => CATALOG_VIEWS.has(view) || String(view || '').startsWith('provider-');
  const providerFromView = view => String(view || '').startsWith('provider-')
    ? (catalogState.providerMap.find(provider => `provider-${slug(provider.name)}` === view)?.name || null)
    : null;
  const storedProviders = () => safeJSON(localStorage.getItem(PROVIDERS_KEY) || '[]', []);
  const themeFor = provider => themes[provider] || { accent:'#62f7c7', glow:'rgba(98,247,199,.24)', label:String(provider || 'STREAMING').toUpperCase() };
  const catalogSurface = () => $('#catalogSurface');

  function compactMeta(item) {
    return {
      id:item.id, entityId:item.entityId, tmdbId:item.tmdbId || null, mediaType:item.mediaType, type:item.type,
      title:item.title, originalTitle:item.originalTitle || '', description:item.description || '', releaseDate:item.releaseDate || '',
      posterPath:item.posterPath || null, backdropPath:item.backdropPath || null, rating:item.rating || 0, popularity:item.popularity || 0,
      genreIds:item.genreIds || [], originalLanguage:item.originalLanguage || '', services:[...(item.services || [])], serviceLogos:{...(item.serviceLogos || {})},
      catalogAvailable:true, source:item.source || 'tmdb-catalog'
    };
  }

  function catalogMetaMap() {
    const raw = safeJSON(localStorage.getItem(CATALOG_META_KEY) || '{}', {});
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  }

  function saveCatalogMeta(map) {
    try { localStorage.setItem(CATALOG_META_KEY, JSON.stringify(map)); }
    catch (error) { console.warn('StreamRadar Catalog: Merkliste-Metadaten konnten nicht gespeichert werden.', error); }
  }

  function syncWatchCount() {
    if ($('#watchlistCount')) $('#watchlistCount').textContent = state.watchlist.size;
  }

  function toggleCatalogWatch(item) {
    const key = String(item.entityId || item.id);
    const meta = catalogMetaMap();
    if (state.watchlist.has(key)) {
      state.watchlist.delete(key);
      delete meta[key];
    } else {
      state.watchlist.add(key);
      meta[key] = compactMeta(item);
    }
    localStorage.setItem('streamradar-watchlist', JSON.stringify([...state.watchlist]));
    saveCatalogMeta(meta);
    syncWatchCount();
    renderCurrent();
  }

  function preferredAvailableProviders() {
    const available = catalogState.providerMap.filter(provider => provider.available);
    const preferred = new Set(storedProviders());
    const selected = available.filter(provider => preferred.has(provider.name));
    return (selected.length ? selected : available).slice(0, 8);
  }

  async function ensureProviderMap() {
    if (state.providerMap?.length) catalogState.providerMap = state.providerMap;
    if (catalogState.providerMap.length) return catalogState.providerMap;
    const token = localStorage.getItem(TOKEN_KEY)?.trim();
    if (!token) {
      catalogState.providerMap = tmdb.SERVICE_DEFINITIONS.map(service => ({...service,available:true,movieProviderId:null,tvProviderId:null,logoPath:null}));
      return catalogState.providerMap;
    }
    catalogState.providerMap = await tmdb.getProviderMap(token);
    return catalogState.providerMap;
  }

  function providerLogo(provider, size='w185') {
    return provider?.logoPath ? `<img src="${tmdb.image(provider.logoPath,size)}" alt="" loading="lazy"/>` : `<strong>${escapeHTML(themeFor(provider?.name).label)}</strong>`;
  }

  function buildProviderNav() {
    const root = $('#providerNav');
    if (!root) return;
    const preferred = preferredAvailableProviders().slice(0,6);
    root.innerHTML = preferred.map(provider => `<button class="nav-link sidebar-link provider-nav-link" data-view="provider-${slug(provider.name)}" data-provider-name="${escapeHTML(provider.name)}"><span class="provider-nav-logo">${providerLogo(provider,'w92')}</span><span>${escapeHTML(provider.name)}</span></button>`).join('');
    root.querySelectorAll('[data-provider-name]').forEach(button => button.onclick = () => setView(button.dataset.view));
  }

  function setCatalogChrome(view) {
    const providerName = providerFromView(view);
    catalogState.provider = providerName;
    const theme = themeFor(providerName);
    const surface = catalogSurface();
    if (surface) {
      surface.hidden = false;
      surface.style.setProperty('--provider-accent', theme.accent);
      surface.style.setProperty('--provider-glow', theme.glow);
      surface.dataset.provider = providerName ? slug(providerName) : 'all';
    }
    $('.hero')?.setAttribute('hidden','');
    $('#homeDashboard')?.setAttribute('hidden','');
    $('.services-section')?.setAttribute('hidden','');
    $('#releases')?.setAttribute('hidden','');
    document.body.dataset.streamradarView = view;
    document.body.dataset.catalogProvider = providerName ? slug(providerName) : 'all';
    $$('.sidebar-link').forEach(link => link.classList.toggle('active', link.dataset.view === view));
    const titles = {
      'catalog-home':['ENTDECKEN','Dein Streaming-Katalog'],
      'catalog-movies':['FILME','Filme streamen'],
      'catalog-series':['SERIEN','Serien streamen'],
      'catalog-anime':['ANIME','Anime streamen'],
      'catalog-watchlist':['MERKLISTE','Deine gespeicherten Titel']
    };
    const pair = providerName ? ['ANBIETER', providerName] : (titles[view] || titles['catalog-home']);
    if ($('#topbarKicker')) $('#topbarKicker').textContent = pair[0];
    if ($('#topbarTitle')) $('#topbarTitle').textContent = pair[1];
  }

  function hideCatalog() {
    catalogSurface()?.setAttribute('hidden','');
    document.body.dataset.catalogProvider = 'all';
    $('#releases')?.removeAttribute('hidden');
    $('.services-section')?.removeAttribute('hidden');
  }

  function imageMarkup(item, kind='poster') {
    const path = kind === 'backdrop' ? (item.backdropPath || item.posterPath) : (item.posterPath || item.backdropPath);
    if (!path) return `<div class="catalog-monogram">${escapeHTML(item.title.split(' ').map(part => part[0]).join('').slice(0,3))}</div>`;
    return `<img src="${tmdb.image(path, kind === 'backdrop' ? 'w780' : 'w500')}" alt="${escapeHTML(item.title)}" loading="lazy"/>`;
  }

  function providerBand(item) {
    const primaryName = item.services?.[0] || 'Streaming';
    const provider = catalogState.providerMap.find(entry => entry.name === primaryName);
    const theme = themeFor(primaryName);
    const logo = provider?.logoPath ? `<img src="${tmdb.image(provider.logoPath,'w185')}" alt=""/>` : `<b>${escapeHTML(theme.label)}</b>`;
    const more = Math.max(0,(item.services?.length || 1)-1);
    return `<div class="catalog-provider-band" style="--item-provider:${theme.accent};--item-glow:${theme.glow}"><span>${logo}</span><strong>JETZT AUF ${escapeHTML(theme.label)}</strong>${more ? `<i>+${more}</i>` : ''}</div>`;
  }

  function catalogCard(item, layout='poster') {
    const key = String(item.entityId || item.id);
    const saved = state.watchlist.has(key);
    const year = String(item.releaseDate || '').slice(0,4);
    const type = item.type === 'movie' ? 'FILM' : item.type === 'anime' ? 'ANIME' : 'SERIE';
    return `<article class="catalog-card catalog-${layout}" data-catalog-id="${escapeHTML(item.id)}" tabindex="0">
      <div class="catalog-art">${imageMarkup(item,layout === 'backdrop' ? 'backdrop' : 'poster')}<div class="catalog-art-shade"></div>${providerBand(item)}<button class="catalog-save ${saved?'saved':''}" data-catalog-watch="${escapeHTML(key)}" aria-label="${saved?'Von Merkliste entfernen':'Zur Merkliste hinzufügen'}">${saved?'✓':'+'}</button>${item.rating>0?`<span class="catalog-rating">★ ${item.rating.toFixed(1)}</span>`:''}</div>
      <div class="catalog-card-copy"><div><span>${type}</span>${year?`<span>${escapeHTML(year)}</span>`:''}</div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML((item.services || []).join(' · ') || 'Streaming')}</p></div>
    </article>`;
  }

  function rail(title, kicker, items, action='') {
    if (!items.length) return '';
    return `<section class="catalog-rail"><div class="catalog-section-head"><div><span class="section-kicker">${escapeHTML(kicker)}</span><h2>${escapeHTML(title)}</h2></div>${action?`<button class="text-button" data-catalog-action="${escapeHTML(action)}">Alle anzeigen →</button>`:''}</div><div class="catalog-rail-track">${items.slice(0,12).map(item => catalogCard(item,'backdrop')).join('')}</div></section>`;
  }

  function headerMarkup(providerName=null) {
    if (providerName) {
      const provider = catalogState.providerMap.find(entry => entry.name === providerName);
      const theme = themeFor(providerName);
      return `<header class="catalog-provider-hero"><div class="provider-hero-logo">${providerLogo(provider,'w300')}</div><div class="provider-hero-copy"><span class="section-kicker">DEIN KATALOG</span><h1>${escapeHTML(providerName)}</h1><p>Filme, Serien und verfügbare Titel von ${escapeHTML(providerName)} in Österreich – unabhängig davon, wann sie erschienen sind.</p><div class="provider-hero-pills"><span>FILME</span><span>SERIEN</span><span>AT</span></div></div><div class="provider-hero-orb" style="--provider-accent:${theme.accent}"></div></header>`;
    }
    return `<header class="catalog-main-hero"><div><span class="section-kicker">STREAMING-KATALOG · ÖSTERREICH</span><h1>Alles, was du<br/><em>streamen kannst.</em></h1><p>Durchsuche das verfügbare Angebot deiner Dienste. Release-Daten sind Zusatzinformationen – der Katalog zeigt auch ältere Filme und Serien.</p></div><div class="catalog-hero-stat"><strong>${catalogState.allItems.size || demoCatalog.length}</strong><span>geladene Titel</span><small>weitere Seiten jederzeit nachladen</small></div></header>`;
  }

  function loadingMarkup() {
    return `<div class="catalog-loading"><span></span><span></span><span></span><div><strong>Katalog wird geladen</strong><p>TMDB & JustWatch Provider · Region AT</p></div></div>`;
  }

  function filterLoaded(items) {
    const query = catalogState.query.trim().toLowerCase();
    if (!query) return items;
    return items.filter(item => `${item.title} ${item.originalTitle || ''} ${(item.services || []).join(' ')}`.toLowerCase().includes(query));
  }

  function renderHome(items) {
    const source = filterLoaded(items);
    const movies = source.filter(item => item.type === 'movie');
    const series = source.filter(item => item.type === 'series');
    const anime = source.filter(item => item.type === 'anime');
    const providers = preferredAvailableProviders().slice(0,5);
    const providerRows = providers.map(provider => rail(provider.name, 'ANBIETER', source.filter(item => item.services?.includes(provider.name)), `provider-${slug(provider.name)}`)).join('');
    return `${headerMarkup()}<div class="catalog-provider-picker">${preferredAvailableProviders().map(provider => `<button data-catalog-action="provider-${slug(provider.name)}">${providerLogo(provider,'w92')}<span>${escapeHTML(provider.name)}</span></button>`).join('')}</div>${rail('Beliebt bei deinen Diensten','FÜR DICH',source,'catalog-all')}${rail('Filme','FILME',movies,'catalog-movies')}${rail('Serien','SERIEN',series,'catalog-series')}${anime.length?rail('Anime','ANIME',anime,'catalog-anime'):''}${providerRows}`;
  }

  function renderGrid(title, kicker, items, copy) {
    const filtered = filterLoaded(items);
    return `${headerMarkup()}<section class="catalog-grid-section"><div class="catalog-section-head catalog-grid-heading"><div><span class="section-kicker">${escapeHTML(kicker)}</span><h2>${escapeHTML(title)}</h2><p>${escapeHTML(copy)}</p></div><div class="catalog-count"><strong>${filtered.length}</strong><span>geladen</span></div></div><div class="catalog-grid">${filtered.map(item => catalogCard(item)).join('')}</div>${catalogState.hasMore?'<button class="catalog-load-more" id="catalogLoadMore"><span>Mehr aus dem Katalog laden</span><small>Nächste TMDB-Seite pro Anbieter</small></button>':''}</section>`;
  }

  function renderProvider(providerName, items) {
    const filtered = filterLoaded(items);
    const movies = filtered.filter(item => item.type === 'movie');
    const series = filtered.filter(item => item.type === 'series' || item.type === 'anime');
    return `${headerMarkup(providerName)}${rail('Filme','JETZT VERFÜGBAR',movies)}${rail('Serien & Anime','JETZT VERFÜGBAR',series)}<section class="catalog-grid-section provider-all"><div class="catalog-section-head"><div><span class="section-kicker">GESAMTES ANGEBOT</span><h2>Mehr von ${escapeHTML(providerName)}</h2></div><div class="catalog-count"><strong>${filtered.length}</strong><span>geladen</span></div></div><div class="catalog-grid">${filtered.map(item => catalogCard(item)).join('')}</div>${catalogState.hasMore?'<button class="catalog-load-more" id="catalogLoadMore"><span>Mehr von diesem Anbieter laden</span><small>Nächste Katalogseite</small></button>':''}</section>`;
  }

  function watchlistItems() {
    const meta = catalogMetaMap();
    const releases = state.releases.filter(item => state.watchlist.has(String(item.entityId || item.id)));
    const catalog = Object.entries(meta).filter(([key]) => state.watchlist.has(String(key))).map(([,item]) => item);
    const merged = new Map();
    [...catalog,...releases].forEach(item => merged.set(String(item.entityId || item.id), item));
    return [...merged.values()];
  }

  function renderCurrent() {
    const surface = catalogSurface();
    if (!surface || !isCatalogView(state.view)) return;
    setCatalogChrome(state.view);
    if (catalogState.loading) {
      surface.innerHTML = headerMarkup(catalogState.provider) + loadingMarkup();
      return;
    }
    if (catalogState.error) {
      surface.innerHTML = `${headerMarkup(catalogState.provider)}<div class="catalog-error"><strong>Katalog konnte nicht vollständig geladen werden.</strong><p>${escapeHTML(catalogState.error)}</p><button class="ghost-button" id="catalogRetry">Erneut versuchen</button></div>`;
      $('#catalogRetry')?.addEventListener('click', () => loadView(state.view,true));
      return;
    }
    let html = '';
    if (state.view === 'catalog-home') html = renderHome(catalogState.items);
    else if (state.view === 'catalog-movies') html = renderGrid('Filme aus deinen Streaming-Diensten','FILME',catalogState.items,'Nicht nur Premieren: verfügbare Filme aus dem gesamten geladenen Katalog deiner Anbieter.');
    else if (state.view === 'catalog-series') html = renderGrid('Serien aus deinen Streaming-Diensten','SERIEN',catalogState.items,'Laufende und ältere Serien, solange sie bei deinen Diensten in Österreich verfügbar sind.');
    else if (state.view === 'catalog-anime') html = renderGrid('Anime streamen','ANIME',catalogState.items,'Anime-Angebot deiner verfügbaren Streaming-Dienste in Österreich.');
    else if (state.view === 'catalog-watchlist') html = renderGrid('Deine Merkliste','GESPEICHERT',watchlistItems(),'Gespeicherte Titel aus Katalog und Release-Radar.');
    else if (catalogState.provider) html = renderProvider(catalogState.provider,catalogState.items);
    surface.innerHTML = html;
    installInteractions();
  }

  function mergeIntoCatalog(items, reset=false) {
    if (reset) catalogState.allItems.clear();
    items.forEach(item => {
      const key = String(item.entityId || item.id);
      const current = catalogState.allItems.get(key);
      if (!current) catalogState.allItems.set(key,item);
      else {
        current.services = [...new Set([...(current.services || []),...(item.services || [])])];
        current.serviceLogos = {...(current.serviceLogos || {}),...(item.serviceLogos || {})};
        current.popularity = Math.max(current.popularity || 0,item.popularity || 0);
      }
    });
  }

  async function loadKinds(providerNames,page,anime=false) {
    const token = localStorage.getItem(TOKEN_KEY)?.trim();
    if (!token) {
      let items = demoCatalog.filter(item => !providerNames.length || item.services.some(service => providerNames.includes(service)));
      if (anime) items = items.filter(item => item.type === 'anime');
      return {items,hasMore:false};
    }
    const map = await ensureProviderMap();
    if (anime) return tmdb.loadCatalogPage(token,map,{mediaType:'tv',providerNames,page,anime:true});
    const [movies,tv] = await Promise.all([
      tmdb.loadCatalogPage(token,map,{mediaType:'movie',providerNames,page}),
      tmdb.loadCatalogPage(token,map,{mediaType:'tv',providerNames,page})
    ]);
    return {items:tmdb.mergeCatalogItems([movies.items,tv.items]),hasMore:movies.hasMore || tv.hasMore};
  }

  async function loadView(view,reset=false) {
    if (!isCatalogView(view)) return;
    const serial = ++catalogState.requestSerial;
    catalogState.view = view;
    catalogState.provider = providerFromView(view);
    if (view === 'catalog-watchlist') { catalogState.loading=false; catalogState.error=null; renderCurrent(); return; }
    if (reset) { catalogState.page=1; catalogState.items=[]; catalogState.allItems.clear(); }
    catalogState.loading = true; catalogState.error = null; renderCurrent();
    try {
      await ensureProviderMap();
      buildProviderNav();
      const preferred = preferredAvailableProviders().map(provider => provider.name);
      const providerNames = catalogState.provider ? [catalogState.provider] : preferred;
      let result;
      if (view === 'catalog-movies') {
        const token = localStorage.getItem(TOKEN_KEY)?.trim();
        result = token ? await tmdb.loadCatalogPage(token,catalogState.providerMap,{mediaType:'movie',providerNames,page:catalogState.page}) : {items:demoCatalog.filter(item => item.type==='movie'),hasMore:false};
      } else if (view === 'catalog-series') {
        const token = localStorage.getItem(TOKEN_KEY)?.trim();
        result = token ? await tmdb.loadCatalogPage(token,catalogState.providerMap,{mediaType:'tv',providerNames,page:catalogState.page}) : {items:demoCatalog.filter(item => item.type==='series'),hasMore:false};
        result.items = result.items.filter(item => item.type !== 'anime');
      } else if (view === 'catalog-anime') {
        result = await loadKinds(providerNames,catalogState.page,true);
      } else {
        result = await loadKinds(providerNames,catalogState.page,false);
      }
      if (serial !== catalogState.requestSerial) return;
      mergeIntoCatalog(result.items, reset || catalogState.page === 1);
      const currentProvider = catalogState.provider;
      catalogState.items = [...catalogState.allItems.values()].filter(item => !currentProvider || item.services?.includes(currentProvider));
      if (view === 'catalog-movies') catalogState.items = catalogState.items.filter(item => item.type === 'movie');
      if (view === 'catalog-series') catalogState.items = catalogState.items.filter(item => item.type === 'series');
      if (view === 'catalog-anime') catalogState.items = catalogState.items.filter(item => item.type === 'anime');
      catalogState.hasMore = Boolean(result.hasMore);
    } catch (error) {
      console.error('StreamRadar Catalog:',error);
      catalogState.error = error?.message || 'Unbekannter Fehler';
    } finally {
      if (serial === catalogState.requestSerial) { catalogState.loading=false; renderCurrent(); }
    }
  }

  async function loadMore() {
    if (catalogState.loading || !catalogState.hasMore) return;
    catalogState.page += 1;
    await loadView(state.view,false);
  }

  async function openCatalogDetails(item) {
    const dialog = $('#detailDialog');
    const root = $('#dialogContent');
    if (!dialog || !root) return;
    const theme = themeFor(item.services?.[0]);
    root.innerHTML = `<div class="catalog-detail-loading" style="--provider-accent:${theme.accent}"><span class="section-kicker">STREAMING-KATALOG</span><h2>${escapeHTML(item.title)}</h2><p>Verfügbarkeit und Details werden geladen …</p></div>`;
    if (!dialog.open) dialog.showModal();
    let details = null;
    const token = localStorage.getItem(TOKEN_KEY)?.trim();
    if (token && item.tmdbId) {
      try { details = await tmdb.getDetails(item.mediaType,item.tmdbId,token); }
      catch (error) { console.warn('StreamRadar Catalog details:',error); }
    }
    const providers = details?.providers || [];
    const backdrop = item.backdropPath ? tmdb.image(item.backdropPath,'w1280') : '';
    const saved = state.watchlist.has(String(item.entityId || item.id));
    root.innerHTML = `<div class="catalog-detail-hero" style="--provider-accent:${theme.accent};${backdrop?`--catalog-detail-bg:url('${backdrop}')`:''}"><div class="catalog-detail-provider">${providerBand(item)}</div><div><span class="section-kicker">${item.type==='movie'?'FILM':item.type==='anime'?'ANIME':'SERIE'} · STREAMING-KATALOG</span><h2>${escapeHTML(item.title)}</h2><p>${escapeHTML(String(item.releaseDate || '').slice(0,4) || 'Verfügbar')} ${item.rating>0?`· ★ ${item.rating.toFixed(1)}`:''}</p></div></div><div class="detail-content catalog-detail-content"><p>${escapeHTML(details?.overview || item.description || 'Keine Beschreibung verfügbar.')}</p><div class="catalog-availability"><strong>Aktuell in Österreich verfügbar bei</strong><div>${providers.length?providers.map(provider=>`<span class="provider-pill">${provider.logo_path?`<img src="${tmdb.image(provider.logo_path,'w92')}" alt=""/>`:''}${escapeHTML(provider.provider_name)}</span>`).join(''):(item.services||[]).map(name=>`<span class="provider-pill">${escapeHTML(name)}</span>`).join('')}</div></div><div class="detail-facts">${details?.genres?.slice(0,4).map(genre=>`<span>${escapeHTML(genre.name)}</span>`).join('')||''}${details?.runtime?`<span>${details.runtime} Min.</span>`:''}${details?.number_of_seasons?`<span>${details.number_of_seasons} Staffeln</span>`:''}<span>Region AT</span></div><div class="detail-actions"><button class="${saved?'ghost-button':'primary-button'}" id="catalogDetailWatch">${saved?'✓ Auf Merkliste':'＋ Zur Merkliste'}</button>${details?.watchLink?`<a class="primary-button link-button" href="${escapeHTML(details.watchLink)}" target="_blank" rel="noopener">Streamingoptionen ↗</a>`:''}</div><p class="attribution">Katalog und Metadaten: TMDB · Streaming-Verfügbarkeit: JustWatch via TMDB · Region Österreich (AT).</p></div>`;
    $('#catalogDetailWatch')?.addEventListener('click',()=>{ toggleCatalogWatch(item); openCatalogDetails(item); });
  }

  function installInteractions() {
    catalogSurface()?.querySelectorAll('[data-catalog-action]').forEach(button => button.onclick = () => setView(button.dataset.catalogAction));
    catalogSurface()?.querySelectorAll('.catalog-card').forEach(card => {
      const item = catalogState.items.find(entry => String(entry.id) === String(card.dataset.catalogId)) || watchlistItems().find(entry => String(entry.id) === String(card.dataset.catalogId));
      if (!item) return;
      card.onclick = event => { if (!event.target.closest('.catalog-save')) openCatalogDetails(item); };
      card.onkeydown = event => { if ((event.key==='Enter'||event.key===' ')&&!event.target.closest('.catalog-save')) { event.preventDefault(); openCatalogDetails(item); } };
    });
    catalogSurface()?.querySelectorAll('.catalog-save').forEach(button => button.onclick = event => {
      event.stopPropagation();
      const item = catalogState.items.find(entry => String(entry.entityId || entry.id) === String(button.dataset.catalogWatch)) || watchlistItems().find(entry => String(entry.entityId || entry.id) === String(button.dataset.catalogWatch));
      if (item) toggleCatalogWatch(item);
    });
    $('#catalogLoadMore')?.addEventListener('click',loadMore);
  }

  setView = function(view) {
    if (isCatalogView(view)) {
      state.view = view;
      localStorage.setItem('streamradar-last-view-v2',view);
      setCatalogChrome(view);
      catalogState.page=1;
      catalogState.items=[];
      catalogState.allItems.clear();
      loadView(view,true);
      window.scrollTo({top:0,behavior:'smooth'});
      return;
    }
    catalogState.requestSerial += 1;
    hideCatalog();
    return releaseSetView(view);
  };

  loadLiveData = async function(...args) {
    const result = await releaseLoadLiveData(...args);
    catalogState.providerMap = state.providerMap || [];
    buildProviderNav();
    if (isCatalogView(state.view)) await loadView(state.view,true);
    return result;
  };

  useDemo = function(...args) {
    const result = releaseUseDemo(...args);
    if (isCatalogView(state.view)) loadView(state.view,true);
    return result;
  };

  if (searchInput) {
    searchInput.placeholder = 'Katalog oder Radar durchsuchen …';
    searchInput.onfocus = event => {
      if (isCatalogView(state.view)) {
        document.body.classList.remove('search-open');
        const overlay = $('#globalSearchOverlay'); if (overlay) overlay.hidden = true;
      } else if (releaseSearchFocus) releaseSearchFocus.call(searchInput,event);
    };
    searchInput.oninput = event => {
      if (isCatalogView(state.view)) {
        catalogState.query = searchInput.value || '';
        renderCurrent();
      } else if (releaseSearchInput) releaseSearchInput.call(searchInput,event);
    };
  }

  document.documentElement.dataset.streamradarVersion = VERSION;
  window.StreamRadarVersion = VERSION;
  ensureProviderMap().then(() => { buildProviderNav(); if (isCatalogView(state.view)) loadView(state.view,true); }).catch(console.warn);
  if (!isCatalogView(state.view) && state.view === 'discover') setView('catalog-home');
  else if (isCatalogView(state.view)) setView(state.view);
  syncWatchCount();

  window.StreamRadarCatalog = Object.freeze({
    VERSION,
    getState: () => ({view:state.view,provider:catalogState.provider,page:catalogState.page,items:catalogState.items.length,hasMore:catalogState.hasMore}),
    refresh: () => loadView(state.view,true),
    isCatalogView
  });
})();
'''
write('js/catalog.js', catalog_js)

# Runtime versions and personalization-aware catalog views.
app = read('js/app.js').replace("APP_VERSION = '0.3.0'", "APP_VERSION = '0.4.0'")
write('js/app.js', app)

polish = read('js/polish.js').replace("const VERSION = '0.0.10';", "const VERSION = '0.4.0';", 1)
write('js/polish.js', polish)

desktop = read('js/desktop.js').replace("const VERSION = '0.3.0';", "const VERSION = '0.4.0';", 1)
write('js/desktop.js', desktop)

ui = read('js/ui.js')
ui = ui.replace("const VERSION = '0.3.0';", "const VERSION = '0.4.0';")
ui = ui.replace("discover: ['ENTDECKEN', 'Dein Streaming-Radar']", "discover: ['RADAR', 'Neu & aktuell']")
ui = ui.replace("defaultView: 'discover'", "defaultView: 'catalog-home'", 1)
ui = ui.replace("if (!['discover','movies','calendar','upcoming','watchlist'].includes(merged.defaultView)) merged.defaultView = 'discover';", "if (!['catalog-home','catalog-movies','catalog-series','catalog-anime','catalog-watchlist','discover','calendar','upcoming','watchlist'].includes(merged.defaultView)) merged.defaultView = 'catalog-home';")
ui = ui.replace('<option value="discover">Entdecken</option><option value="movies">Filme</option><option value="calendar">Kalender</option><option value="upcoming">Demnächst</option><option value="watchlist">Merkliste</option>', '<option value="catalog-home">Entdecken</option><option value="catalog-movies">Filme</option><option value="catalog-series">Serien</option><option value="catalog-anime">Anime</option><option value="discover">Neu & aktuell</option><option value="calendar">Kalender</option><option value="upcoming">Demnächst</option><option value="catalog-watchlist">Merkliste</option>')
ui = ui.replace("if (config.rememberLastView && ['discover','movies','calendar','seasons','episodes','upcoming','watchlist'].includes(view))", "if (config.rememberLastView && ['catalog-home','catalog-movies','catalog-series','catalog-anime','catalog-watchlist','discover','calendar','seasons','episodes','upcoming','watchlist'].includes(view))")
ui = ui.replace("const target = ['discover','movies','calendar','seasons','episodes','upcoming','watchlist'].includes(view) ? view : config.defaultView;", "const target = ['catalog-home','catalog-movies','catalog-series','catalog-anime','catalog-watchlist','discover','calendar','seasons','episodes','upcoming','watchlist'].includes(view) ? view : config.defaultView;")
ui = ui.replace('V0.2.2 · MOVIES & PERSONALIZATION', 'V0.4.0 · STREAMING CATALOG')
ui = ui.replace('In wenigen Schritten richtet StreamRadar deinen persönlichen Release-Radar ein.', 'In wenigen Schritten richtet StreamRadar deinen Streaming-Katalog und Release-Radar ein.')
ui = ui.replace('Privater Release-Radar für Österreich mit TMDB, JustWatch-Providern und TVmaze-Schedule.', 'Streaming-Katalog und Release-Radar für Österreich mit TMDB, JustWatch-Providern und TVmaze-Schedule.')
ui = ui.replace('Personalization & Settings · Windows Desktop / Web', 'Streaming Catalog & Provider Experience · Windows Desktop / Web')
write('js/ui.js', ui)

# Navigation and catalog surface.
index = read('index.html')
index = index.replace('data-streamradar-view="discover"', 'data-streamradar-view="catalog-home"', 1)
index = index.replace('RELEASE INTELLIGENCE</small>', 'STREAMING CATALOG</small>', 1)
old_nav = '''    <span class="sidebar-section-label">RADAR</span>
    <nav class="sidebar-nav" aria-label="Hauptnavigation">
      <button class="nav-link sidebar-link active" data-view="discover"><span class="sidebar-icon">⌂</span><span>Entdecken</span></button>
      <button class="nav-link sidebar-link" data-view="movies"><span class="sidebar-icon">◆</span><span>Filme</span></button>
      <button class="nav-link sidebar-link" data-view="calendar"><span class="sidebar-icon">▦</span><span>Kalender</span></button>
      <button class="nav-link sidebar-link" data-view="seasons"><span class="sidebar-icon">◫</span><span>Staffeln</span></button>
      <button class="nav-link sidebar-link" data-view="episodes"><span class="sidebar-icon">◉</span><span>Episoden</span></button>
      <button class="nav-link sidebar-link" data-view="upcoming"><span class="sidebar-icon">◷</span><span>Demnächst</span></button>
    </nav>
'''
new_nav = '''    <span class="sidebar-section-label">KATALOG</span>
    <nav class="sidebar-nav" aria-label="Streaming-Katalog">
      <button class="nav-link sidebar-link active" data-view="catalog-home"><span class="sidebar-icon">⌂</span><span>Entdecken</span></button>
      <button class="nav-link sidebar-link" data-view="catalog-movies"><span class="sidebar-icon">◆</span><span>Filme</span></button>
      <button class="nav-link sidebar-link" data-view="catalog-series"><span class="sidebar-icon">▣</span><span>Serien</span></button>
      <button class="nav-link sidebar-link" data-view="catalog-anime"><span class="sidebar-icon">◈</span><span>Anime</span></button>
    </nav>

    <span class="sidebar-section-label provider-section-label">ANBIETER</span>
    <nav class="sidebar-nav provider-nav" id="providerNav" aria-label="Streaming-Anbieter"></nav>

    <span class="sidebar-section-label">RADAR</span>
    <nav class="sidebar-nav" aria-label="Release-Radar">
      <button class="nav-link sidebar-link" data-view="discover"><span class="sidebar-icon">◎</span><span>Neu & aktuell</span></button>
      <button class="nav-link sidebar-link" data-view="calendar"><span class="sidebar-icon">▦</span><span>Kalender</span></button>
      <button class="nav-link sidebar-link" data-view="seasons"><span class="sidebar-icon">◫</span><span>Staffeln</span></button>
      <button class="nav-link sidebar-link" data-view="episodes"><span class="sidebar-icon">◉</span><span>Episoden</span></button>
      <button class="nav-link sidebar-link" data-view="upcoming"><span class="sidebar-icon">◷</span><span>Demnächst</span></button>
    </nav>
'''
index = replace_once(index, old_nav, new_nav, 'index navigation')
index = index.replace('data-view="watchlist"', 'data-view="catalog-watchlist"', 1)
index = index.replace('<span id="topbarKicker">ENTDECKEN</span><strong id="topbarTitle">Dein Streaming-Radar</strong>', '<span id="topbarKicker">ENTDECKEN</span><strong id="topbarTitle">Dein Streaming-Katalog</strong>')
insert_surface = '      <section class="catalog-surface shell" id="catalogSurface" hidden aria-label="StreamRadar Streaming-Katalog"></section>\n\n      <section class="home-dashboard shell"'
index = replace_once(index, '      <section class="home-dashboard shell"', insert_surface, 'index catalog surface')
index = index.replace('0.3.0', '0.4.0')
index = index.replace('persönlicher Streaming Release-Radar, Kalender und Desktop-App', 'Streaming-Katalog, Release-Radar, Kalender und Desktop-App')
index = index.replace('Release Radar</title>', 'Streaming Catalog</title>')
index = index.replace('Automated QA & Repository Hardening mit Browser-Smoke-Tests und aufgeräumter JavaScript-Struktur.', 'Streaming Catalog & Provider Experience: gesamtes verfügbares Angebot plus Release-Radar.')
index = index.replace('<script src="js/ui.js" defer></script>', '<script src="js/ui.js" defer></script><script src="js/catalog.js" defer></script>')
write('index.html', index)

# Build now includes the dedicated catalog runtime.
build = read('scripts/build-desktop.mjs')
build = replace_once(build, "  'js/ui.js'\n", "  'js/ui.js',\n  'js/catalog.js'\n", 'build-desktop catalog')
write('scripts/build-desktop.mjs', build)

js_readme = read('js/README.md')
if 'catalog.js' not in js_readme:
    js_readme += '\n- `catalog.js` – v0.4.0 Streaming-Katalog, Provider-Ansichten und Lazy Pagination; wird bewusst nach `ui.js` geladen.\n'
write('js/README.md', js_readme)

# Provider-first visual layer.
styles = read('styles.css').rstrip() + r'''

/* StreamRadar v0.4.0 — Streaming Catalog & Provider Experience */
.catalog-surface{display:block;padding-top:28px;padding-bottom:64px;min-height:calc(100vh - 92px);--provider-accent:#62f7c7;--provider-glow:rgba(98,247,199,.24)}
.catalog-surface[hidden]{display:none!important}.catalog-surface::before{content:"";position:fixed;inset:76px 0 auto 250px;height:440px;pointer-events:none;background:radial-gradient(circle at 72% 0,var(--provider-glow),transparent 57%);opacity:.8;z-index:-1}
.provider-section-label{margin-top:18px}.provider-nav{gap:3px}.provider-nav-link{min-height:38px;padding-top:6px!important;padding-bottom:6px!important}.provider-nav-logo{width:23px;height:23px;border-radius:7px;background:#171c23;display:grid;place-items:center;overflow:hidden;flex:0 0 auto}.provider-nav-logo img{width:100%;height:100%;object-fit:cover}.provider-nav-logo strong{font-size:6px;letter-spacing:-.03em;color:#fff}.provider-nav-link>span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.catalog-main-hero,.catalog-provider-hero{position:relative;overflow:hidden;min-height:310px;border:1px solid rgba(255,255,255,.08);border-radius:28px;background:linear-gradient(120deg,rgba(13,17,23,.98),rgba(10,14,19,.88) 52%,rgba(12,21,22,.76));display:flex;align-items:flex-end;justify-content:space-between;padding:46px 48px;margin-bottom:32px;box-shadow:0 22px 70px rgba(0,0,0,.3)}
.catalog-main-hero::after,.catalog-provider-hero::after{content:"";position:absolute;width:580px;height:580px;border-radius:50%;right:-120px;top:-280px;background:radial-gradient(circle,var(--provider-glow),transparent 63%);filter:blur(2px);pointer-events:none}.catalog-main-hero>div,.catalog-provider-hero>div{position:relative;z-index:1}.catalog-main-hero h1,.catalog-provider-hero h1{font:700 clamp(38px,4.6vw,72px)/.96 "Space Grotesk",sans-serif;letter-spacing:-.055em;margin:10px 0 18px;max-width:770px}.catalog-main-hero h1 em{font-style:normal;color:var(--provider-accent);text-shadow:0 0 28px var(--provider-glow)}.catalog-main-hero p,.catalog-provider-hero p{max-width:680px;color:#9ba8b9;font-size:15px;line-height:1.65;margin:0}.catalog-hero-stat{min-width:180px;text-align:right;padding:20px}.catalog-hero-stat strong{display:block;font:700 54px/1 "Space Grotesk",sans-serif;color:#fff}.catalog-hero-stat span{display:block;color:var(--provider-accent);font-weight:800;margin-top:5px}.catalog-hero-stat small{display:block;color:#748092;margin-top:6px}
.catalog-provider-hero{align-items:center;background:linear-gradient(120deg,rgba(7,9,13,.98),rgba(11,15,20,.9) 56%,var(--provider-glow));border-color:color-mix(in srgb,var(--provider-accent) 30%,transparent)}.provider-hero-logo{width:178px;height:178px;border-radius:31px;background:rgba(255,255,255,.96);display:grid!important;place-items:center;padding:25px;box-shadow:0 24px 65px rgba(0,0,0,.36);flex:0 0 auto}.provider-hero-logo img{max-width:100%;max-height:100%;object-fit:contain}.provider-hero-logo strong{font:800 18px "Space Grotesk",sans-serif;color:#0a0d12;text-align:center}.provider-hero-copy{flex:1;padding-left:40px}.provider-hero-copy h1{margin:5px 0 14px;color:#fff}.provider-hero-pills{display:flex;gap:8px;margin-top:20px}.provider-hero-pills span{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);border-radius:999px;padding:7px 11px;font-size:10px;font-weight:800;letter-spacing:.08em;color:#dce4ef}.provider-hero-orb{width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,var(--provider-accent),transparent 68%);filter:blur(28px);opacity:.42}
.catalog-provider-picker{display:flex;gap:10px;overflow-x:auto;padding:2px 2px 26px;scrollbar-width:none}.catalog-provider-picker::-webkit-scrollbar{display:none}.catalog-provider-picker button{min-width:142px;height:66px;border:1px solid rgba(255,255,255,.08);background:#0d1117;border-radius:16px;display:flex;align-items:center;gap:10px;padding:9px 12px;color:#dbe4ef;cursor:pointer;transition:.2s}.catalog-provider-picker button:hover{transform:translateY(-2px);border-color:rgba(98,247,199,.32);background:#111720}.catalog-provider-picker button img{width:40px;height:40px;border-radius:10px;object-fit:cover}.catalog-provider-picker button strong{font-size:8px}.catalog-provider-picker button span{font-weight:750;font-size:12px;white-space:nowrap}
.catalog-rail{margin:18px 0 38px}.catalog-section-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-end;margin-bottom:16px}.catalog-section-head h2{font:700 25px/1.1 "Space Grotesk",sans-serif;letter-spacing:-.035em;margin:4px 0 0}.catalog-section-head p{color:#8390a2;margin:8px 0 0;max-width:720px}.catalog-rail-track{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(310px,390px);gap:14px;overflow-x:auto;padding:2px 1px 12px;scroll-snap-type:x proximity;scrollbar-width:thin}.catalog-grid-section{margin-top:24px}.catalog-grid-heading{align-items:flex-end}.catalog-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px}.catalog-count{text-align:right}.catalog-count strong{display:block;font:700 32px "Space Grotesk",sans-serif;color:#fff}.catalog-count span{font-size:11px;color:#7d8998;text-transform:uppercase;letter-spacing:.08em}
.catalog-card{position:relative;min-width:0;border:1px solid rgba(255,255,255,.08);background:#0c1016;border-radius:19px;overflow:hidden;cursor:pointer;transition:transform .2s,border-color .2s,box-shadow .2s;scroll-snap-align:start;outline:none}.catalog-card:hover,.catalog-card:focus-visible{transform:translateY(-4px);border-color:color-mix(in srgb,var(--item-provider,#62f7c7) 38%,rgba(255,255,255,.12));box-shadow:0 18px 45px rgba(0,0,0,.34)}.catalog-art{position:relative;aspect-ratio:2/3;background:linear-gradient(145deg,#171d25,#0b0e13);overflow:hidden}.catalog-backdrop .catalog-art{aspect-ratio:16/9}.catalog-art>img{width:100%;height:100%;object-fit:cover;display:block}.catalog-art-shade{position:absolute;inset:0;background:linear-gradient(to bottom,transparent 34%,rgba(4,6,9,.12) 54%,rgba(4,6,9,.94) 100%)}.catalog-monogram{height:100%;display:grid;place-items:center;font:800 46px "Space Grotesk",sans-serif;color:#475465;background:radial-gradient(circle at 50% 35%,#202b37,#0b0e13 70%)}
.catalog-provider-band{position:absolute;left:10px;right:10px;top:10px;min-height:42px;display:flex;align-items:center;gap:9px;border:1px solid color-mix(in srgb,var(--item-provider) 42%,rgba(255,255,255,.12));background:linear-gradient(100deg,color-mix(in srgb,var(--item-provider) 18%,rgba(4,6,9,.92)),rgba(5,8,12,.88));backdrop-filter:blur(12px);border-radius:12px;padding:7px 10px;box-shadow:0 8px 30px var(--item-glow);z-index:3}.catalog-provider-band>span{height:26px;min-width:26px;display:grid;place-items:center}.catalog-provider-band img{max-height:26px;max-width:64px;border-radius:6px;object-fit:contain}.catalog-provider-band b{font-size:9px}.catalog-provider-band strong{font-size:9px;letter-spacing:.09em;color:#fff;flex:1}.catalog-provider-band i{font-style:normal;font-size:9px;color:#d8e1eb}.catalog-save{position:absolute;right:10px;bottom:10px;width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,.16);background:rgba(5,8,12,.82);backdrop-filter:blur(10px);color:#fff;font-size:20px;z-index:3;cursor:pointer}.catalog-save.saved{background:var(--provider-accent,#62f7c7);color:#07100d}.catalog-rating{position:absolute;left:11px;bottom:13px;z-index:3;background:rgba(5,8,12,.78);border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:5px 8px;font-size:10px;font-weight:800;color:#fff}.catalog-card-copy{padding:14px 14px 16px}.catalog-card-copy>div{display:flex;gap:9px;color:#6f7c8c;font-size:9px;font-weight:800;letter-spacing:.07em}.catalog-card-copy h3{font-size:15px;margin:7px 0 5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.catalog-card-copy p{font-size:11px;color:#818e9f;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.catalog-load-more{width:100%;margin-top:24px;border:1px solid rgba(255,255,255,.1);border-radius:16px;background:linear-gradient(90deg,rgba(98,247,199,.05),rgba(255,255,255,.025));padding:18px;color:#e9f1f8;cursor:pointer}.catalog-load-more:hover{border-color:rgba(98,247,199,.32)}.catalog-load-more span{display:block;font-weight:800}.catalog-load-more small{display:block;color:#788596;margin-top:3px}.catalog-loading,.catalog-error{min-height:260px;border:1px solid rgba(255,255,255,.07);border-radius:22px;background:#0b0f14;display:flex;align-items:center;justify-content:center;gap:9px;color:#7f8b9c}.catalog-loading>span{width:8px;height:8px;border-radius:50%;background:var(--provider-accent);animation:catalogPulse 1.2s infinite alternate}.catalog-loading>span:nth-child(2){animation-delay:.15s}.catalog-loading>span:nth-child(3){animation-delay:.3s}.catalog-loading>div{margin-left:10px}.catalog-loading strong{color:#fff}.catalog-loading p{margin:4px 0 0;font-size:11px}.catalog-error{flex-direction:column;text-align:center}.catalog-error strong{color:#fff;font-size:18px}@keyframes catalogPulse{to{opacity:.25;transform:translateY(-5px)}}
.catalog-detail-hero{position:relative;min-height:330px;padding:34px;display:flex;align-items:flex-end;background:linear-gradient(to top,#080b10 3%,rgba(8,11,16,.45) 74%),var(--catalog-detail-bg,linear-gradient(135deg,#17202a,#090c10));background-size:cover;background-position:center;border-radius:22px 22px 0 0;overflow:hidden}.catalog-detail-hero::after{content:"";position:absolute;inset:auto 0 0;height:5px;background:var(--provider-accent)}.catalog-detail-hero>div:last-child{position:relative;z-index:2}.catalog-detail-hero h2{font:700 clamp(32px,5vw,58px)/1 "Space Grotesk",sans-serif;margin:8px 0}.catalog-detail-provider{position:absolute!important;left:24px;top:24px;width:min(420px,calc(100% - 48px));z-index:3}.catalog-detail-provider .catalog-provider-band{position:relative;inset:auto}.catalog-availability{margin:22px 0;padding:18px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.025)}.catalog-availability>strong{display:block;margin-bottom:12px}.catalog-availability>div{display:flex;flex-wrap:wrap;gap:8px}.catalog-detail-loading{padding:45px;min-height:240px}.catalog-detail-loading h2{font:700 38px "Space Grotesk",sans-serif}
body[data-streamradar-view^="catalog-"] .data-status-wrap,body[data-streamradar-view^="provider-"] .data-status-wrap{display:none}.sidebar-status{margin-top:8px}.sidebar-spacer{min-height:14px}
@media(max-width:1200px){.catalog-grid{grid-template-columns:repeat(auto-fill,minmax(190px,1fr))}.catalog-provider-hero{padding:34px}.provider-hero-logo{width:138px;height:138px}.provider-hero-copy{padding-left:26px}.catalog-main-hero{padding:38px}.catalog-rail-track{grid-auto-columns:minmax(280px,340px)}}
@media(max-width:760px){.catalog-surface{padding-top:16px}.catalog-main-hero,.catalog-provider-hero{min-height:260px;padding:28px 22px;border-radius:20px;align-items:flex-end}.catalog-main-hero h1,.catalog-provider-hero h1{font-size:40px}.catalog-hero-stat,.provider-hero-orb{display:none}.catalog-provider-hero{display:block}.provider-hero-logo{width:86px;height:86px;border-radius:20px;padding:14px;margin-bottom:20px}.provider-hero-copy{padding-left:0}.catalog-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.catalog-provider-band{min-height:36px;left:7px;right:7px;top:7px;padding:5px 7px}.catalog-provider-band strong{display:none}.catalog-card-copy{padding:10px}.catalog-card-copy h3{font-size:13px}.catalog-rail-track{grid-auto-columns:82vw}.catalog-section-head{align-items:flex-start}.catalog-surface::before{left:0}}
''' + '\n'
write('styles.css', styles)

# Tests: move old movie-release assertion to the Radar, add catalog/provider coverage and update versions.
tests = read('tests/e2e/streamradar.spec.js')
tests = tests.replace("await page.waitForFunction(() => Boolean(window.StreamRadarPersonalization));", "await page.waitForFunction(() => Boolean(window.StreamRadarPersonalization && window.StreamRadarCatalog));")
tests = tests.replace("await page.locator('.sidebar-link[data-view=\"discover\"]').click();\n  await expect(page.locator('#homeDashboard')).toBeVisible();", "await page.locator('.sidebar-link[data-view=\"catalog-home\"]').click();\n  await expect(page.locator('#catalogSurface')).toBeVisible();")
tests = tests.replace("version: '0.3.0'", "version: '0.4.0'")
tests = tests.replace("defaultView: 'discover'", "defaultView: 'catalog-home'")
tests = tests.replace("await expect(page.locator('#releaseGrid')).toBeVisible();\n  const version = await page.evaluate(() => window.StreamRadarPersonalization?.VERSION);\n  expect(version).toBe('0.3.0');", "await expect(page.locator('#catalogSurface')).toBeVisible();\n  const version = await page.evaluate(() => window.StreamRadarPersonalization?.VERSION);\n  expect(version).toBe('0.4.0');")
old_movie_test = '''test('movies view and calendar include movie releases', async ({ page }) => {
  const errors = await boot(page, configuredStorage());
  await page.locator('.sidebar-link[data-view="movies"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-streamradar-view', 'movies');
  await expect(page.locator('.release-card').filter({ hasText: 'Red Horizon' })).toBeVisible();
  await expect(page.locator('.release-card').filter({ hasText: 'Neon District' })).toHaveCount(0);
  await page.locator('.sidebar-link[data-view="calendar"]').click();
  await page.locator('[data-calendar-mode="90"]').click();
  await expect(page.locator('#calendarStats')).toContainText('Filme');
  await expect(page.locator('.timeline-event').filter({ hasText: 'Red Horizon' })).toBeVisible();
  expect(errors).toEqual([]);
});
'''
new_movie_test = '''test('catalog exposes movies series and a provider-first Netflix experience', async ({ page }) => {
  const errors = await boot(page, configuredStorage());
  await expect(page.locator('body')).toHaveAttribute('data-streamradar-view', 'catalog-home');
  await expect(page.locator('#catalogSurface')).toBeVisible();
  await expect(page.locator('#catalogSurface')).toContainText('Alles, was du');

  await page.locator('.sidebar-link[data-view="catalog-movies"]').click();
  await expect(page.locator('#catalogSurface')).toContainText('Filme aus deinen Streaming-Diensten');
  await expect(page.locator('.catalog-card').filter({ hasText: 'Midnight Protocol' })).toBeVisible();
  await expect(page.locator('.catalog-card').filter({ hasText: 'Terminal Zero' })).toHaveCount(0);

  await page.locator('[data-provider-name="Netflix"]').click();
  await expect(page.locator('.catalog-provider-hero')).toContainText('Netflix');
  await expect(page.locator('#catalogSurface')).toContainText('JETZT AUF NETFLIX');
  expect(errors).toEqual([]);
});

test('release radar still contains movie events and calendar coverage', async ({ page }) => {
  const errors = await boot(page, configuredStorage());
  await page.locator('.sidebar-link[data-view="discover"]').click();
  await page.locator('[data-summary-view="movies"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-streamradar-view', 'movies');
  await expect(page.locator('.release-card').filter({ hasText: 'Red Horizon' })).toBeVisible();
  await expect(page.locator('.release-card').filter({ hasText: 'Neon District' })).toHaveCount(0);
  await page.locator('.sidebar-link[data-view="calendar"]').click();
  await page.locator('[data-calendar-mode="90"]').click();
  await expect(page.locator('#calendarStats')).toContainText('Filme');
  await expect(page.locator('.timeline-event').filter({ hasText: 'Red Horizon' })).toBeVisible();
  expect(errors).toEqual([]);
});
'''
tests = replace_once(tests, old_movie_test, new_movie_test, 'catalog/movie tests')
tests = tests.replace("StreamRadar v0.3.1", "StreamRadar v0.4.1").replace("`0.3.1`", "`0.4.1`").replace("Update v0.3.1 verfügbar", "Update v0.4.1 verfügbar").replace("v0.3.1 MSI herunterladen", "v0.4.1 MSI herunterladen").replace("expect(state.latest).toBe('0.3.1')", "expect(state.latest).toBe('0.4.1')")
write('tests/e2e/streamradar.spec.js', tests)

# Changelog and README.
changelog = read('CHANGELOG.md')
entry = '''## [0.4.0] - 2026-09-01

### Added
- Vollständiger **Streaming-Katalog** zusätzlich zum bestehenden Release-Radar.
- Eigene Katalogansichten für **Entdecken, Filme, Serien und Anime**.
- Anbieter-spezifische Katalogseiten mit großem Provider-Branding und klarer „Jetzt auf …“-Kennzeichnung.
- Lazy Pagination über TMDB Discover: weitere Katalogseiten werden erst auf Benutzeraktion nachgeladen.
- Kombinierte Katalog-Merkliste mit lokal gespeicherten Metadaten für Titel außerhalb des Release-Fensters.
- Eigene `js/catalog.js`-Runtime, getrennt von Release-, Kalender- und Episodenlogik.

### Changed
- StreamRadar ist ab v0.4.0 **Catalog First**: das verfügbare Angebot steht im Vordergrund; Release Intelligence bleibt als zusätzliche Radar-Ebene bestehen.
- TMDB-Katalogabfragen haben kein 35-/90-Tage-Releasefenster mehr. Das Zeitfenster gilt nur noch für Release-Radar und Kalender.
- Sidebar neu strukturiert in Katalog, Anbieter, Radar und persönliche Inhalte.
- Provider-Darstellung auf Karten deutlich größer und anbieter-spezifisch gestaltet.
- sichtbare Runtime-Version aus `polish.js` auf den echten Release-Stand korrigiert.
- App-, Tauri-, Desktop- und MSI-Version auf `0.4.0` angehoben.

### Quality
- Browser-Test für Katalog, Filmansicht und Netflix-Provider-Experience.
- Bestehende Release-Film- und Kalender-Abdeckung bleibt als separater Regressionstest erhalten.
- v0.3.0 UI-/CSS-Stände vor dem Redesign archiviert.

'''
if '## [0.4.0]' not in changelog:
    changelog = changelog.replace('## [0.3.0]', entry + '## [0.3.0]', 1)
write('CHANGELOG.md', changelog)

readme = read('README.md')
readme = readme.replace('StreamRadar ist ein persönlicher Streaming-Release-Radar für Filme, Serien, Anime, Originals, neue Staffeln und Episoden – optimiert für Österreich.', 'StreamRadar ist ein persönlicher Streaming-Katalog und Release-Radar für Filme, Serien und Anime – mit anbieter-spezifischen Katalogen, Releases, Staffeln, Episoden und Kalender für Österreich.')
readme = re.sub(r'## Aktuelle Version: v0\.3\.0\n\n\*\*v0\.3\.0[^\n]*\n', '## Aktuelle Version: v0.4.0\n\n**v0.4.0 – Streaming Catalog & Provider Experience** stellt das gesamte verfügbare Angebot deiner Streaming-Dienste in den Mittelpunkt. Release Intelligence, Kalender und Episoden-Radar bleiben als zusätzliche Ebene erhalten.\n', readme, count=1)
readme = readme.replace('StreamRadar v0.3.0 als MSI herunterladen', 'StreamRadar v0.4.0 als MSI herunterladen').replace('StreamRadar_0.3.0_x64_de-DE.msi', 'StreamRadar_0.4.0_x64_de-DE.msi')
start = readme.find('## Neu in v0.3.0')
end = readme.find('## Funktionsumfang')
if start != -1 and end != -1:
    readme = readme[:start] + '''## Neu in v0.4.0

- kompletter Streaming-Katalog für verfügbare Filme und Serien – unabhängig vom Erscheinungsdatum
- Entdecken, Filme, Serien und Anime als eigene Katalogbereiche
- Provider-First-Navigation mit Netflix, Prime Video, Disney+, Apple TV+ und weiteren verfügbaren Diensten
- große anbieter-spezifische Provider-Header und deutlich sichtbarere Provider-Kennzeichnung auf Karten
- Lazy Pagination über TMDB Discover für browsebares Gesamtangebot statt starrem Release-Zeitfenster
- Release-Radar bleibt separat für Neu & aktuell, Staffeln, Episoden, Demnächst und Kalender
- Katalog-Merkliste kann auch Titel speichern, die kein aktuelles Release-Event besitzen
- neuer Runtime-Baustein `js/catalog.js`
- v0.3.0 Snapshots unter `OldCss/styles-v0.3.0.css` und `OldUi/ui-v0.3.0.js`

''' + readme[end:]
readme = readme.replace('- TMDB-Live-Daten mit österreichischen Watch-Providern', '- vollständiger TMDB/JustWatch-Streaming-Katalog pro österreichischem Watch-Provider\n- TMDB-Live-Daten für zeitbasierte Release Intelligence')
nav_start = readme.find('## Navigation')
nav_end = readme.find('## Kalender')
if nav_start != -1 and nav_end != -1:
    readme = readme[:nav_start] + '''## Navigation

```text
KATALOG
  Entdecken
  Filme
  Serien
  Anime

ANBIETER
  Netflix / Prime Video / Disney+ / Apple TV+ / ...

RADAR
  Neu & aktuell
  Kalender
  Staffeln
  Episoden
  Demnächst

DEINE INHALTE
  Merkliste
```

Der Katalog und der Release-Radar verwenden getrennte Datenpfade: Katalogansichten besitzen **kein Release-Zeitfenster**. Der Radar bleibt zeitbasiert.

''' + readme[nav_end:]
readme = readme.replace('│   └── ui.js', '│   ├── ui.js\n│   └── catalog.js')
readme = readme.replace('## Grenzen von v0.1.2', '## Grenzen des aktuellen Builds')
readme = re.sub(r'## Status\n\n`v0\.1\.2` – UI/UX Polish', '## Status\n\n`v0.4.0` – Streaming Catalog & Provider Experience', readme)
write('README.md', readme)

print('StreamRadar v0.4.0 catalog preparation applied.')
