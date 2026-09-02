(() => {
  const VERSION = '0.5.0';
  const TOKEN_KEY = 'streamradar-tmdb-token';
  const PROVIDERS_KEY = 'streamradar-preferred-providers';
  const CATALOG_META_KEY = 'streamradar-catalog-watchlist-v1';
  const CATALOG_VIEWS = new Set(['catalog-home','catalog-all','catalog-movies','catalog-series','catalog-anime','catalog-watchlist']);
  const releaseSetView = setView;
  const releaseRenderReleases = renderReleases;
  const releaseLoadLiveData = loadLiveData;
  const releaseUseDemo = useDemo;
  const searchInput = $('#searchInput');
  const releaseSearchInput = searchInput?.oninput || null;
  const releaseSearchFocus = searchInput?.onfocus || null;

  const themes = {
    'Netflix': { accent:'#e50914', glow:'rgba(229,9,20,.16)', label:'NETFLIX' },
    'Disney+': { accent:'#5b7cff', glow:'rgba(91,124,255,.15)', label:'DISNEY+' },
    'Prime Video': { accent:'#1aa8e8', glow:'rgba(26,168,232,.15)', label:'PRIME VIDEO' },
    'HBO Max': { accent:'#8b5cf6', glow:'rgba(139,92,246,.16)', label:'HBO MAX' },
    'Apple TV+': { accent:'#f4f5f7', glow:'rgba(225,230,238,.10)', label:'APPLE TV+' },
    'Paramount+': { accent:'#2f73ff', glow:'rgba(47,115,255,.15)', label:'PARAMOUNT+' },
    'Crunchyroll': { accent:'#f47521', glow:'rgba(244,117,33,.15)', label:'CRUNCHYROLL' },
    'Sky / WOW': { accent:'#ff4fd8', glow:'rgba(255,79,216,.14)', label:'SKY / WOW' },
    'discovery+': { accent:'#40a6ff', glow:'rgba(64,166,255,.14)', label:'DISCOVERY+' },
    'Joyn': { accent:'#f4d44d', glow:'rgba(244,212,77,.12)', label:'JOYN' },
    'RTL+': { accent:'#36d49b', glow:'rgba(54,212,155,.12)', label:'RTL+' },
    'ORF': { accent:'#ef4f5c', glow:'rgba(239,79,92,.13)', label:'ORF' },
    'Hulu': { accent:'#1ce783', glow:'rgba(28,231,131,.15)', label:'HULU' },
    'Peacock': { accent:'#8b7cff', glow:'rgba(139,124,255,.15)', label:'PEACOCK' },
    'AMC+': { accent:'#f2b45f', glow:'rgba(242,180,95,.13)', label:'AMC+' },
    'Starz': { accent:'#f0f0f0', glow:'rgba(240,240,240,.10)', label:'STARZ' },
    'Tubi': { accent:'#ff4f91', glow:'rgba(255,79,145,.13)', label:'TUBI' },
    'The Roku Channel': { accent:'#7b2cff', glow:'rgba(123,44,255,.14)', label:'ROKU CHANNEL' },
    'd Anime Store': { accent:'#35a7ff', glow:'rgba(53,167,255,.14)', label:'D ANIME STORE' },
    'ABEMA': { accent:'#2bd6be', glow:'rgba(43,214,190,.13)', label:'ABEMA' },
    'U-NEXT': { accent:'#00b9ff', glow:'rgba(0,185,255,.13)', label:'U-NEXT' }
  };

  const REGION_LABELS = { AT:'Österreich', US:'USA', JP:'Japan' };
  const NETWORKS_BY_PROVIDER = {
    'Peacock': ['NBC', 'Bravo', 'USA Network', 'Syfy', 'Telemundo', 'Universal Kids'],
    'discovery+': ['Discovery Channel', 'TLC', 'HGTV', 'Food Network', 'Animal Planet', 'Investigation Discovery']
  };

  const demoCatalog = [
    {id:'catalog-movie-1001',entityId:'movie-1001',tmdbId:null,mediaType:'movie',type:'movie',title:'Midnight Protocol',description:'Demo-Katalogfilm.',releaseDate:'2024-03-14',rating:7.8,popularity:98,services:['Netflix'],watchRegion:'AT',catalogAvailable:true,source:'demo-catalog'},
    {id:'catalog-movie-1002',entityId:'movie-1002',tmdbId:null,mediaType:'movie',type:'movie',title:'Northern Lights',description:'Demo-Katalogfilm.',releaseDate:'2022-11-02',rating:7.2,popularity:91,services:['Netflix'],watchRegion:'AT',catalogAvailable:true,source:'demo-catalog'},
    {id:'catalog-tv-2001',entityId:'tv-2001',tmdbId:null,mediaType:'tv',type:'series',title:'Terminal Zero',description:'Demo-Katalogserie.',releaseDate:'2023-07-11',rating:8.1,popularity:96,services:['Netflix'],watchRegion:'AT',catalogAvailable:true,source:'demo-catalog'},
    {id:'catalog-movie-1003',entityId:'movie-1003',tmdbId:null,mediaType:'movie',type:'movie',title:'Atlas Run',description:'Demo-Katalogfilm.',releaseDate:'2021-09-20',rating:7.4,popularity:89,services:['Prime Video'],watchRegion:'AT',catalogAvailable:true,source:'demo-catalog'},
    {id:'catalog-tv-2002',entityId:'tv-2002',tmdbId:null,mediaType:'tv',type:'series',title:'The Long Signal',description:'Demo-Katalogserie.',releaseDate:'2024-01-19',rating:8.0,popularity:88,services:['Prime Video'],watchRegion:'AT',catalogAvailable:true,source:'demo-catalog'},
    {id:'catalog-tv-3001',entityId:'tv-3001',tmdbId:null,mediaType:'tv',type:'anime',title:'Starlight Blade',description:'Demo-Anime.',releaseDate:'2023-10-06',rating:8.4,popularity:92,services:['Crunchyroll'],watchRegion:'AT',catalogAvailable:true,source:'demo-catalog'},
    {id:'catalog-tv-2100',entityId:'tv-2100',tmdbId:null,mediaType:'tv',type:'series',title:'Alpine Crime',description:'Demo für Sky.',releaseDate:'2023-02-12',rating:7.6,popularity:79,services:['Sky / WOW'],watchRegion:'AT',catalogAvailable:true,source:'demo-catalog'},
    {id:'catalog-tv-2200',entityId:'tv-2200',tmdbId:null,mediaType:'tv',type:'series',title:'Wild Horizons',description:'Demo für discovery+.',releaseDate:'2022-04-20',rating:7.9,popularity:81,services:['discovery+'],watchRegion:'AT',catalogAvailable:true,source:'demo-catalog'},
    {id:'catalog-tv-4001',entityId:'tv-4001',tmdbId:null,mediaType:'tv',type:'series',title:'Liberty Line',description:'US-Demo von Hulu.',releaseDate:'2024-01-11',rating:8.0,popularity:90,services:['Hulu'],watchRegion:'US',catalogAvailable:true,source:'demo-catalog'},
    {id:'catalog-tv-4002',entityId:'tv-4002',tmdbId:null,mediaType:'tv',type:'series',title:'Metro Unit',description:'US-Demo von Peacock.',releaseDate:'2024-05-17',rating:7.8,popularity:88,services:['Peacock'],watchRegion:'US',catalogAvailable:true,source:'demo-catalog'},
    {id:'catalog-movie-4003',entityId:'movie-4003',tmdbId:null,mediaType:'movie',type:'movie',title:'Desert Frequency',description:'US-Demo von Tubi.',releaseDate:'2021-03-09',rating:7.1,popularity:74,services:['Tubi'],watchRegion:'US',catalogAvailable:true,source:'demo-catalog'},
    {id:'catalog-tv-5001',entityId:'tv-5001',tmdbId:null,mediaType:'tv',type:'anime',title:'Moonblade Academy',description:'Japan-Demo von d Anime Store.',releaseDate:'2025-01-08',rating:8.6,popularity:94,services:['d Anime Store'],watchRegion:'JP',catalogAvailable:true,source:'demo-catalog'},
    {id:'catalog-tv-5002',entityId:'tv-5002',tmdbId:null,mediaType:'tv',type:'anime',title:'Tokyo Signal',description:'Japan-Demo von ABEMA.',releaseDate:'2024-10-03',rating:8.2,popularity:89,services:['ABEMA'],watchRegion:'JP',catalogAvailable:true,source:'demo-catalog'}
  ];

  const catalogState = {
    view:'catalog-home', provider:null, page:1, loading:false, hasMore:false,
    items:[], allItems:new Map(), providerMap:[], error:null, query:'', requestSerial:0
  };
  let providerMapPromise = null;

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
      watchRegion:item.watchRegion || 'AT', catalogAvailable:true, source:item.source || 'tmdb-catalog'
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

  function providersForRegion(region) {
    return catalogState.providerMap.filter(provider => provider.available && (provider.region || 'AT') === region);
  }

  function preferredAvailableProviders() {
    const available = providersForRegion('AT');
    const preferred = new Set(storedProviders());
    const selected = available.filter(provider => preferred.has(provider.name));
    return (selected.length ? selected : available).slice(0, 8);
  }

  function sidebarProvidersForRegion(region) {
    return providersForRegion(region);
  }

  async function ensureProviderMap() {
    const hasAllRegions = ['AT','US','JP'].every(region => catalogState.providerMap.some(provider => (provider.region || 'AT') === region));
    if (hasAllRegions) return catalogState.providerMap;
    if (providerMapPromise) return providerMapPromise;
    const token = localStorage.getItem(TOKEN_KEY)?.trim();
    if (!token) {
      catalogState.providerMap = tmdb.SERVICE_DEFINITIONS.map(service => ({...service,available:true,movieProviderId:null,tvProviderId:null,logoPath:null}));
      return catalogState.providerMap;
    }
    providerMapPromise = tmdb.getAllProviderMaps(token)
      .then(map => { catalogState.providerMap = map; return map; })
      .finally(() => { providerMapPromise = null; });
    return providerMapPromise;
  }

  function providerLogo(provider, size='w185') {
    return provider?.logoPath ? `<img src="${tmdb.image(provider.logoPath,size)}" alt="" loading="lazy"/>` : `<strong>${escapeHTML(themeFor(provider?.name).label)}</strong>`;
  }

  function providerNavMarkup(providers) {
    return providers.map(provider => `<button class="nav-link sidebar-link provider-nav-link" data-view="provider-${slug(provider.name)}" data-provider-name="${escapeHTML(provider.name)}" data-provider-region="${escapeHTML(provider.region || 'AT')}"><span class="provider-nav-logo">${providerLogo(provider,'w92')}</span><span>${escapeHTML(provider.name)}</span></button>`).join('');
  }

  function bindProviderNav(root) {
    root?.querySelectorAll('[data-provider-name]').forEach(button => button.onclick = () => setView(button.dataset.view));
  }

  function buildProviderNav() {
    const localRoot = $('#providerNav');
    const usRoot = $('#internationalProviderNavUS');
    const jpRoot = $('#internationalProviderNavJP');
    if (localRoot) localRoot.innerHTML = providerNavMarkup(sidebarProvidersForRegion('AT'));
    if (usRoot) usRoot.innerHTML = providerNavMarkup(sidebarProvidersForRegion('US'));
    if (jpRoot) jpRoot.innerHTML = providerNavMarkup(sidebarProvidersForRegion('JP'));
    bindProviderNav(localRoot); bindProviderNav(usRoot); bindProviderNav(jpRoot);
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
    if (view === 'catalog-home') $('.hero')?.removeAttribute('hidden'); else $('.hero')?.setAttribute('hidden','');
    $('#homeDashboard')?.setAttribute('hidden','');
    $('.services-section')?.setAttribute('hidden','');
    $('#releases')?.setAttribute('hidden','');
    document.body.dataset.streamradarView = view;
    document.body.dataset.catalogProvider = providerName ? slug(providerName) : 'all';
    $$('.sidebar-link').forEach(link => link.classList.toggle('active', link.dataset.view === view));
    const titles = {
      'catalog-home':['ENTDECKEN','Dein Streaming-Katalog'],
      'catalog-all':['KATALOG','Gesamtes Streaming-Angebot'],
      'catalog-movies':['FILME','Filme streamen'],
      'catalog-series':['SERIEN','Serien streamen'],
      'catalog-anime':['ANIME','Anime streamen'],
      'catalog-watchlist':['MERKLISTE','Deine gespeicherten Titel']
    };
    const activeProvider = providerName ? catalogState.providerMap.find(provider => provider.name === providerName) : null;
    const pair = providerName ? [activeProvider?.region === 'AT' ? 'ANBIETER' : `INTERNATIONAL · ${activeProvider?.region || ''}`, providerName] : (titles[view] || titles['catalog-home']);
    if ($('#topbarKicker')) $('#topbarKicker').textContent = pair[0];
    if ($('#topbarTitle')) $('#topbarTitle').textContent = pair[1];
  }

  function hideCatalog() {
    catalogSurface()?.setAttribute('hidden','');
    document.body.dataset.catalogProvider = 'all';
    $('#releases')?.removeAttribute('hidden');
    $('.services-section')?.removeAttribute('hidden');
    $('.hero')?.setAttribute('hidden','');
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
    const cardTheme = themeFor(item.services?.[0]);
    return `<article class="catalog-card catalog-${layout}" data-catalog-id="${escapeHTML(item.id)}" tabindex="0" style="--item-provider:${cardTheme.accent};--item-glow:${cardTheme.glow}">
      <div class="catalog-art">${imageMarkup(item,layout === 'backdrop' ? 'backdrop' : 'poster')}<div class="catalog-art-shade"></div>${providerBand(item)}<button class="catalog-save ${saved?'saved':''}" data-catalog-watch="${escapeHTML(key)}" aria-label="${saved?'Von Merkliste entfernen':'Zur Merkliste hinzufügen'}">${saved?'✓':'+'}</button>${item.rating>0?`<span class="catalog-rating">★ ${item.rating.toFixed(1)}</span>`:''}</div>
      <div class="catalog-card-copy"><div><span>${type}</span>${year?`<span>${escapeHTML(year)}</span>`:''}</div><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML((item.services || []).join(' · ') || 'Streaming')}</p></div>
    </article>`;
  }

  function rail(title, kicker, items, action='') {
    if (!items.length) return '';
    return `<section class="catalog-rail"><div class="catalog-section-head"><div><span class="section-kicker">${escapeHTML(kicker)}</span><h2>${escapeHTML(title)}</h2></div>${action?`<button class="text-button" data-catalog-action="${escapeHTML(action)}">Alle anzeigen →</button>`:''}</div><div class="catalog-rail-track">${items.slice(0,12).map(item => catalogCard(item,'poster')).join('')}</div></section>`;
  }

  function headerMarkup(providerName=null) {
    if (providerName) {
      const provider = catalogState.providerMap.find(entry => entry.name === providerName);
      const theme = themeFor(providerName);
      const region = provider?.region || 'AT';
      const regionLabel = REGION_LABELS[region] || region;
      const international = region !== 'AT';
      const copy = international
        ? `Internationaler Katalog von ${escapeHTML(providerName)} für ${escapeHTML(regionLabel)}. Diese Ansicht zeigt, was dort läuft – nicht, ob der Titel in Österreich verfügbar ist.`
        : `Filme, Serien und verfügbare Titel von ${escapeHTML(providerName)} in Österreich – unabhängig davon, wann sie erschienen sind.`;
      return `<header class="catalog-provider-hero"><div class="provider-hero-logo">${providerLogo(provider,'w300')}</div><div class="provider-hero-copy"><span class="section-kicker">${international ? 'INTERNATIONALER KATALOG' : 'DEIN KATALOG'}</span><h1>${escapeHTML(providerName)}</h1><p>${copy}</p><div class="provider-hero-pills"><span>FILME</span><span>SERIEN</span><span>REGION ${escapeHTML(region)}</span></div></div><div class="provider-hero-orb" style="--provider-accent:${theme.accent}"></div></header>`;
    }
    return `<header class="catalog-main-hero"><div><span class="section-kicker">STREAMING-KATALOG · ÖSTERREICH</span><h1>Dein gesamtes Streaming-Angebot.</h1><p>Filme, Serien und Anime aus deinen österreichischen Diensten. Internationale Kataloge findest du separat in der Sidebar.</p></div><div class="catalog-hero-stat"><strong>${catalogState.allItems.size || demoCatalog.filter(item => item.watchRegion === 'AT').length}</strong><span>geladene Titel</span><small>weitere Seiten jederzeit nachladen</small></div></header>`;
  }

  function loadingMarkup() {
    const activeProvider = catalogState.provider ? catalogState.providerMap.find(provider => provider.name === catalogState.provider) : null;
    const region = activeProvider?.region || 'AT';
    return `<div class="catalog-loading"><span></span><span></span><span></span><div><strong>Katalog wird geladen</strong><p>TMDB & JustWatch Provider · Region ${escapeHTML(region)}</p></div></div>`;
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
    return `<div class="catalog-home-section-title"><div><span class="section-kicker">DEINE DIENSTE</span><h2>Direkt losstreamen</h2></div><button class="text-button" data-catalog-action="catalog-all">Gesamtes Angebot →</button></div><div class="catalog-provider-picker">${preferredAvailableProviders().map(provider => `<button data-catalog-action="provider-${slug(provider.name)}">${providerLogo(provider,'w92')}<span>${escapeHTML(provider.name)}</span></button>`).join('')}</div>${rail('Beliebt bei deinen Diensten','FÜR DICH',source,'catalog-all')}${rail('Filme','FILME',movies,'catalog-movies')}${rail('Serien','SERIEN',series,'catalog-series')}${anime.length?rail('Anime','ANIME',anime,'catalog-anime'):''}${providerRows}`;
  }

  function renderGrid(title, kicker, items, copy) {
    const filtered = filterLoaded(items);
    return `${headerMarkup()}<section class="catalog-grid-section"><div class="catalog-section-head catalog-grid-heading"><div><span class="section-kicker">${escapeHTML(kicker)}</span><h2>${escapeHTML(title)}</h2><p>${escapeHTML(copy)}</p></div><div class="catalog-count"><strong>${filtered.length}</strong><span>geladen</span></div></div><div class="catalog-grid">${filtered.map(item => catalogCard(item)).join('')}</div>${catalogState.hasMore?'<button class="catalog-load-more" id="catalogLoadMore"><span>Mehr aus dem Katalog laden</span><small>Nächste TMDB-Seite pro Anbieter</small></button>':''}</section>`;
  }

  function renderProvider(providerName, items) {
    const filtered = filterLoaded(items);
    const movies = filtered.filter(item => item.type === 'movie');
    const series = filtered.filter(item => item.type === 'series' || item.type === 'anime');
    const networks = NETWORKS_BY_PROVIDER[providerName] || [];
    const networkMarkup = networks.length ? `<section class="provider-networks"><div class="catalog-section-head"><div><span class="section-kicker">NETWORKS</span><h2>Zugehörige Networks</h2><p>Diese Marken gehören zum Anbieter-Umfeld; die konkrete Streaming-Verfügbarkeit kann je Titel variieren.</p></div></div><div class="provider-network-list">${networks.map(network => `<span class="provider-network-chip">${escapeHTML(network)}</span>`).join('')}</div></section>` : '';
    return `${headerMarkup(providerName)}${networkMarkup}${rail('Filme','JETZT VERFÜGBAR',movies)}${rail('Serien & Anime','JETZT VERFÜGBAR',series)}<section class="catalog-grid-section provider-all"><div class="catalog-section-head"><div><span class="section-kicker">GESAMTES ANGEBOT</span><h2>Mehr von ${escapeHTML(providerName)}</h2></div><div class="catalog-count"><strong>${filtered.length}</strong><span>geladen</span></div></div><div class="catalog-grid">${filtered.map(item => catalogCard(item)).join('')}</div>${catalogState.hasMore?'<button class="catalog-load-more" id="catalogLoadMore"><span>Mehr von diesem Anbieter laden</span><small>Nächste Katalogseite</small></button>':''}</section>`;
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
    else if (state.view === 'catalog-all') html = renderGrid('Gesamtes Streaming-Angebot','KATALOG',catalogState.items,'Alle aktuell geladenen Filme, Serien und Anime deiner Streaming-Dienste – unabhängig vom Erscheinungsdatum.');
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
      try { details = await tmdb.getDetails(item.mediaType,item.tmdbId,token,item.watchRegion || catalogState.providerMap.find(provider => provider.name === item.services?.[0])?.region || 'AT'); }
      catch (error) { console.warn('StreamRadar Catalog details:',error); }
    }
    const providers = details?.providers || [];
    const backdrop = item.backdropPath ? tmdb.image(item.backdropPath,'w1280') : '';
    const saved = state.watchlist.has(String(item.entityId || item.id));
    root.innerHTML = `<div class="catalog-detail-hero" style="--provider-accent:${theme.accent};${backdrop?`--catalog-detail-bg:url('${backdrop}')`:''}"><div class="catalog-detail-provider">${providerBand(item)}</div><div><span class="section-kicker">${item.type==='movie'?'FILM':item.type==='anime'?'ANIME':'SERIE'} · STREAMING-KATALOG</span><h2>${escapeHTML(item.title)}</h2><p>${escapeHTML(String(item.releaseDate || '').slice(0,4) || 'Verfügbar')} ${item.rating>0?`· ★ ${item.rating.toFixed(1)}`:''}</p></div></div><div class="detail-content catalog-detail-content"><p>${escapeHTML(details?.overview || item.description || 'Keine Beschreibung verfügbar.')}</p><div class="catalog-availability"><strong>Aktuell in Österreich verfügbar bei</strong><div>${providers.length?providers.map(provider=>`<span class="provider-pill">${provider.logo_path?`<img src="${tmdb.image(provider.logo_path,'w92')}" alt=""/>`:''}${escapeHTML(provider.provider_name)}</span>`).join(''):(item.services||[]).map(name=>`<span class="provider-pill">${escapeHTML(name)}</span>`).join('')}</div></div><div class="detail-facts">${details?.genres?.slice(0,4).map(genre=>`<span>${escapeHTML(genre.name)}</span>`).join('')||''}${details?.runtime?`<span>${details.runtime} Min.</span>`:''}${details?.number_of_seasons?`<span>${details.number_of_seasons} Staffeln</span>`:''}<span>Region AT</span></div><div class="detail-actions"><button class="${saved?'ghost-button':'primary-button'}" id="catalogDetailWatch">${saved?'✓ Auf Merkliste':'＋ Zur Merkliste'}</button>${details?.watchLink?`<a class="primary-button link-button" href="${escapeHTML(details.watchLink)}" target="_blank" rel="noopener">Streamingoptionen ↗</a>`:''}</div><p class="attribution">Katalog und Metadaten: TMDB · Streaming-Verfügbarkeit: JustWatch via TMDB · Region Österreich (AT).</p></div>`;
    $('#catalogDetailWatch')?.addEventListener('click',()=>{ toggleCatalogWatch(item); openCatalogDetails(item); });
  }

  function catalogSearchItems(query) {
    const normalized = String(query || '').trim().toLowerCase();
    const source = catalogState.items.length ? catalogState.items : [...catalogState.allItems.values()];
    const ranked = normalized
      ? source.filter(item => `${item.title} ${item.originalTitle || ''} ${(item.services || []).join(' ')}`.toLowerCase().includes(normalized))
      : source;
    return ranked.slice(0, 10);
  }

  function renderCatalogSearchOverlay(query = searchInput?.value || '') {
    const root = $('#globalSearchResults');
    if (!root) return;
    const results = catalogSearchItems(query);
    root.innerHTML = results.length ? results.map(item => {
      const art = item.posterPath ? `<img src="${tmdb.image(item.posterPath,'w185')}" alt=""/>` : `<span>${escapeHTML(item.title.slice(0,1))}</span>`;
      const type = item.type === 'movie' ? 'Film' : item.type === 'anime' ? 'Anime' : 'Serie';
      return `<button type="button" class="global-search-result" data-catalog-search-id="${escapeHTML(item.id)}"><span class="global-search-art">${art}</span><span class="global-search-copy"><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(type)} · ${escapeHTML((item.services || []).join(' · ') || 'Streaming-Katalog')}</small></span><span class="search-arrow">›</span></button>`;
    }).join('') : `<div class="global-search-empty"><strong>Keine Katalog-Treffer</strong><span>Lade weitere Katalogseiten oder versuche einen anderen Titel bzw. Anbieter.</span></div>`;
    root.querySelectorAll('[data-catalog-search-id]').forEach(button => button.onclick = () => {
      const item = catalogState.items.find(entry => String(entry.id) === String(button.dataset.catalogSearchId))
        || [...catalogState.allItems.values()].find(entry => String(entry.id) === String(button.dataset.catalogSearchId));
      $('#globalSearchOverlay')?.setAttribute('hidden','');
      document.body.classList.remove('search-open');
      if (item) openCatalogDetails(item);
    });
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

  renderReleases = function(...args) {
    const result = releaseRenderReleases(...args);
    if (isCatalogView(state.view)) setCatalogChrome(state.view);
    return result;
  };

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
    catalogState.providerMap = [];
    await ensureProviderMap();
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
        releaseSearchFocus?.call(searchInput,event);
        renderCatalogSearchOverlay(searchInput.value);
      } else if (releaseSearchFocus) releaseSearchFocus.call(searchInput,event);
    };
    searchInput.oninput = event => {
      if (isCatalogView(state.view)) {
        catalogState.query = searchInput.value || '';
        releaseSearchInput?.call(searchInput,event);
        renderCatalogSearchOverlay(searchInput.value);
      } else if (releaseSearchInput) releaseSearchInput.call(searchInput,event);
    };
  }

  document.documentElement.dataset.streamradarVersion = VERSION;
  window.StreamRadarVersion = VERSION;
  ensureProviderMap().then(() => {
    buildProviderNav();
    if (!isCatalogView(state.view) && state.view === 'discover') setView('catalog-home');
    else if (isCatalogView(state.view)) setView(state.view);
  }).catch(console.warn);
  syncWatchCount();

  window.StreamRadarCatalog = Object.freeze({
    VERSION,
    getState: () => ({view:state.view,provider:catalogState.provider,page:catalogState.page,items:catalogState.items.length,hasMore:catalogState.hasMore}),
    refresh: () => loadView(state.view,true),
    isCatalogView
  });
})();
