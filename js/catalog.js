(() => {
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
