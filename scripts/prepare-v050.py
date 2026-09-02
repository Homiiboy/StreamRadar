from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]

def read(path):
    return (ROOT / path).read_text(encoding='utf-8')

def write(path, text):
    (ROOT / path).write_text(text, encoding='utf-8')

def replace(path, old, new, count=None):
    text = read(path)
    if old not in text:
        raise SystemExit(f'Missing marker in {path}: {old[:120]!r}')
    text = text.replace(old, new, -1 if count is None else count)
    write(path, text)

# Archive the stable v0.4.1 UI before the large redesign.
(ROOT / 'OldCss').mkdir(exist_ok=True)
(ROOT / 'OldUi').mkdir(exist_ok=True)
shutil.copyfile(ROOT / 'styles.css', ROOT / 'OldCss' / 'styles-v0.4.1.css')
shutil.copyfile(ROOT / 'js' / 'catalog.js', ROOT / 'OldUi' / 'catalog-v0.4.1.js')

# Version surfaces.
write('VERSION', '0.5.0\n')
replace('package.json', '"version": "0.4.1"', '"version": "0.5.0"')
replace('package-lock.json', '"version": "0.4.1"', '"version": "0.5.0"')
replace('src-tauri/Cargo.toml', 'version = "0.4.1"', 'version = "0.5.0"', 1)
replace('src-tauri/tauri.conf.json', '"version": "0.4.1"', '"version": "0.5.0"', 1)
replace('js/app.js', "const APP_VERSION = '0.4.1';", "const APP_VERSION = '0.5.0';", 1)
replace('js/polish.js', "const VERSION = '0.4.1';", "const VERSION = '0.5.0';", 1)
replace('js/desktop.js', "const VERSION = '0.4.1';", "const VERSION = '0.5.0';", 1)
replace('js/ui.js', "const VERSION = '0.4.1';", "const VERSION = '0.5.0';", 1)
replace('js/catalog.js', "const VERSION = '0.4.1';", "const VERSION = '0.5.0';", 1)
replace('index.html', '0.4.1', '0.5.0')

replace(
    'js/app.js',
    "const serviceNames = [...new Set([...tmdb.SERVICE_DEFINITIONS.map(service => service.name), ...brandNames])];",
    "const serviceNames = [...new Set([...tmdb.SERVICE_DEFINITIONS.filter(service => (service.region || 'AT') === 'AT').map(service => service.name), ...brandNames])];",
    1
)
replace(
    'js/app.js',
    "  $('#radarState').textContent = kind === 'live' ? 'Origin Intelligence' : kind === 'loading' ? 'Synchronisiere …' : 'Radar aktiv';",
    "  if ($('#radarState')) $('#radarState').textContent = kind === 'live' ? 'Origin Intelligence' : kind === 'loading' ? 'Synchronisiere …' : 'Radar aktiv';",
    1
)
replace(
    'js/app.js',
    "  $('#heroReleaseCount').textContent = eligibleCount;",
    "  if ($('#heroReleaseCount')) $('#heroReleaseCount').textContent = eligibleCount;",
    1
)

index = read('index.html')
old_sidebar = '''    <span class="sidebar-section-label provider-section-label">ANBIETER</span>
    <nav class="sidebar-nav provider-nav" id="providerNav" aria-label="Streaming-Anbieter"></nav>

    <span class="sidebar-section-label">RADAR</span>'''
new_sidebar = '''    <span class="sidebar-section-label provider-section-label">ANBIETER</span>
    <nav class="sidebar-nav provider-nav" id="providerNav" aria-label="Streaming-Anbieter Österreich"></nav>

    <span class="sidebar-section-label international-section-label">INTERNATIONAL</span>
    <span class="sidebar-country-label">USA</span>
    <nav class="sidebar-nav provider-nav international-provider-nav" id="internationalProviderNavUS" aria-label="Streaming-Anbieter USA"></nav>
    <span class="sidebar-country-label">JAPAN</span>
    <nav class="sidebar-nav provider-nav international-provider-nav" id="internationalProviderNavJP" aria-label="Streaming-Anbieter Japan"></nav>

    <span class="sidebar-section-label">RADAR</span>'''
if old_sidebar not in index:
    raise SystemExit('Index provider sidebar marker not found')
index = index.replace(old_sidebar, new_sidebar, 1)

hero_pattern = r'''      <section class="hero shell">.*?</section>\n\n      <section class="catalog-surface shell"'''
clean_hero = '''      <section class="hero clean-home-hero shell">
        <div class="clean-home-copy">
          <div class="welcome-meta"><strong id="welcomeGreeting">Willkommen</strong><span>·</span><span id="welcomeDate">StreamRadar</span></div>
          <span class="section-kicker">DEIN STREAMING-KATALOG · ÖSTERREICH</span>
          <h1>Was möchtest du heute sehen?</h1>
          <p>Filme, Serien und Anime aus deinen Streaming-Diensten – übersichtlich, ruhig und mit internationalem Blick über den österreichischen Katalog hinaus.</p>
        </div>
        <div class="legacy-home-hooks" aria-hidden="true">
          <span id="heroReleaseCount">0</span><span id="radarState">Radar aktiv</span>
          <button id="showUpcoming" tabindex="-1">Nächste 30 Tage</button><div id="homeQuickStats"></div>
        </div>
      </section>

      <section class="catalog-surface shell"'''
index, n = re.subn(hero_pattern, clean_hero, index, count=1, flags=re.S)
if n != 1:
    raise SystemExit('Clean hero replacement failed')
index = index.replace('<span>Region: AT</span><span>Version 0.5.0</span>', '<span>Region: AT · International: US / JP</span><span>Version 0.5.0</span>')
index = index.replace('<strong>v0.5.0:</strong> Streaming Catalog & Provider Experience: gesamtes verfügbares Angebot plus Release-Radar.', '<strong>v0.5.0:</strong> Cleaner Catalog Experience mit größeren Postern und internationalen US-/JP-Anbietern.')
write('index.html', index)

tmdb = read('js/tmdb.js')
tmdb = tmdb.replace("  const LANGUAGE = 'de-DE';\n", "  const LANGUAGE = 'de-DE';\n  const PROVIDER_REGIONS = ['AT', 'US', 'JP'];\n", 1)

provider_defs = '''  const SERVICE_DEFINITIONS = [
    { name: 'Netflix', region:'AT', group:'local', aliases: ['Netflix'] },
    { name: 'Disney+', region:'AT', group:'local', aliases: ['Disney Plus', 'Disney+'] },
    { name: 'Prime Video', region:'AT', group:'local', aliases: ['Amazon Prime Video', 'Prime Video'] },
    { name: 'HBO Max', region:'AT', group:'local', aliases: ['HBO Max', 'Max'] },
    { name: 'Apple TV+', region:'AT', group:'local', aliases: ['Apple TV Plus', 'Apple TV+'] },
    { name: 'Paramount+', region:'AT', group:'local', aliases: ['Paramount Plus', 'Paramount+'] },
    { name: 'Crunchyroll', region:'AT', group:'local', aliases: ['Crunchyroll'] },
    { name: 'Sky / WOW', region:'AT', group:'local', aliases: ['Sky X', 'Sky Go', 'WOW'] },
    { name: 'discovery+', region:'AT', group:'local', aliases: ['Discovery Plus', 'Discovery+', 'discovery+'] },
    { name: 'Joyn', region:'AT', group:'local', aliases: ['Joyn Plus', 'Joyn'] },
    { name: 'RTL+', region:'AT', group:'local', aliases: ['RTL+', 'RTL Plus'] },
    { name: 'ORF', region:'AT', group:'local', aliases: ['ORF ON', 'ORF'] },

    { name: 'Hulu', region:'US', group:'international', country:'USA', aliases: ['Hulu'] },
    { name: 'Peacock', region:'US', group:'international', country:'USA', aliases: ['Peacock Premium Plus', 'Peacock Premium', 'Peacock'] },
    { name: 'AMC+', region:'US', group:'international', country:'USA', aliases: ['AMC Plus Apple TV Channel', 'AMC+ Amazon Channel', 'AMC Plus', 'AMC+'] },
    { name: 'Starz', region:'US', group:'international', country:'USA', aliases: ['Starz Apple TV Channel', 'Starz Amazon Channel', 'Starz Roku Premium Channel', 'Starz'] },
    { name: 'Tubi', region:'US', group:'international', country:'USA', aliases: ['Tubi TV', 'Tubi'] },
    { name: 'The Roku Channel', region:'US', group:'international', country:'USA', aliases: ['The Roku Channel'] },

    { name: 'd Anime Store', region:'JP', group:'international', country:'Japan', aliases: ['d Anime Store for Prime Video', 'd Anime Store', 'dアニメストア'] },
    { name: 'ABEMA', region:'JP', group:'international', country:'Japan', aliases: ['ABEMA', 'AbemaTV', 'Abema'] },
    { name: 'U-NEXT', region:'JP', group:'international', country:'Japan', aliases: ['U-NEXT'] }
  ];'''

tmdb, n = re.subn(r"  const SERVICE_DEFINITIONS = \[.*?\n  \];\n\n  const ORIGINAL_BRANDS", provider_defs + "\n\n  const ORIGINAL_BRANDS", tmdb, count=1, flags=re.S)
if n != 1:
    raise SystemExit('SERVICE_DEFINITIONS replacement failed')

old_resolve = '''  function resolveProviderMap(movieProviders, tvProviders) {
    return SERVICE_DEFINITIONS.map(service => {
      const movie = movieProviders.find(provider => matchesAlias(provider.provider_name, service.aliases));
      const tv = tvProviders.find(provider => matchesAlias(provider.provider_name, service.aliases));
      const source = movie || tv;
      return {
        ...service,
        movieProviderId: movie?.provider_id || null,
        tvProviderId: tv?.provider_id || null,
        logoPath: source?.logo_path || null,
        available: Boolean(movie || tv)
      };
    });
  }'''
new_resolve = '''  function resolveProviderMap(movieProviders, tvProviders, definitions = SERVICE_DEFINITIONS, region = REGION) {
    return definitions.map(service => {
      const movie = movieProviders.find(provider => matchesAlias(provider.provider_name, service.aliases));
      const tv = tvProviders.find(provider => matchesAlias(provider.provider_name, service.aliases));
      const source = movie || tv;
      return {
        ...service,
        region: service.region || region,
        movieProviderId: movie?.provider_id || null,
        tvProviderId: tv?.provider_id || null,
        logoPath: source?.logo_path || null,
        available: Boolean(movie || tv)
      };
    });
  }'''
if old_resolve not in tmdb:
    raise SystemExit('resolveProviderMap marker missing')
tmdb = tmdb.replace(old_resolve, new_resolve, 1)

tmdb = tmdb.replace(
    "      services: [service.name],\n      serviceLogos: service.logoPath ? { [service.name]: service.logoPath } : {},\n      catalogAvailable: true,",
    "      services: [service.name],\n      serviceLogos: service.logoPath ? { [service.name]: service.logoPath } : {},\n      watchRegion: service.region || REGION,\n      catalogAvailable: true,",
    1
)

catalog_discover_match = re.search(r"  async function discoverCatalogForProvider\(service, mediaType, token, options = \{\}\) \{.*?\n  \}\n\n  async function loadCatalogPage", tmdb, flags=re.S)
if not catalog_discover_match:
    raise SystemExit('discoverCatalogForProvider block missing')
block = catalog_discover_match.group(0)
block = block.replace("    const page = Math.max(1, Math.min(500, Number(options.page || 1)));\n", "    const page = Math.max(1, Math.min(500, Number(options.page || 1)));\n    const watchRegion = service.region || REGION;\n", 1)
block = block.replace("      watch_region: REGION,", "      watch_region: watchRegion,", 1)
block = block.replace("    if (mediaType === 'movie') params.region = REGION;", "    if (mediaType === 'movie') params.region = watchRegion;", 1)
tmdb = tmdb[:catalog_discover_match.start()] + block + tmdb[catalog_discover_match.end():]

tmdb = tmdb.replace(
    "  async function getDetails(mediaType, id, token) {",
    "  async function getDetails(mediaType, id, token, region = REGION) {",
    1
)
tmdb = tmdb.replace(
    "    const at = providerData.results?.[REGION] || {};\n    const streaming = [...(at.flatrate || []), ...(at.free || []), ...(at.ads || [])];\n    const uniqueStreaming = [...new Map(streaming.map(provider => [provider.provider_id, provider])).values()];",
    "    const regional = providerData.results?.[region] || {};\n    const streaming = [...(regional.flatrate || []), ...(regional.free || []), ...(regional.ads || [])];\n    const uniqueStreaming = [...new Map(streaming.map(provider => [provider.provider_id, provider])).values()];",
    1
)
tmdb = tmdb.replace("      watchLink: at.link || null,", "      watchLink: regional.link || null,", 1)

old_getmap = '''  async function getProviderMap(token) {
    const [movieData, tvData] = await Promise.all([
      request('/watch/providers/movie', token, { language: LANGUAGE, watch_region: REGION }),
      request('/watch/providers/tv', token, { language: LANGUAGE, watch_region: REGION })
    ]);
    return resolveProviderMap(movieData.results || [], tvData.results || []);
  }'''
new_getmap = '''  async function getProviderMap(token, region = REGION) {
    const definitions = SERVICE_DEFINITIONS.filter(service => (service.region || REGION) === region);
    const [movieData, tvData] = await Promise.all([
      request('/watch/providers/movie', token, { language: LANGUAGE, watch_region: region }),
      request('/watch/providers/tv', token, { language: LANGUAGE, watch_region: region })
    ]);
    return resolveProviderMap(movieData.results || [], tvData.results || [], definitions, region);
  }

  async function getAllProviderMaps(token, regions = PROVIDER_REGIONS) {
    const maps = await Promise.all(regions.map(region => getProviderMap(token, region)));
    return maps.flat();
  }'''
if old_getmap not in tmdb:
    raise SystemExit('getProviderMap marker missing')
tmdb = tmdb.replace(old_getmap, new_getmap, 1)
tmdb = tmdb.replace("    REGION,\n    LANGUAGE,\n", "    REGION,\n    LANGUAGE,\n    PROVIDER_REGIONS,\n", 1)
tmdb = tmdb.replace("    getProviderMap,\n    loadRadar,", "    getProviderMap,\n    getAllProviderMaps,\n    loadRadar,", 1)
write('js/tmdb.js', tmdb)

catalog = read('js/catalog.js')

theme_block = '''  const themes = {
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
  };'''
catalog, n = re.subn(r"  const themes = \{.*?\n  \};", theme_block, catalog, count=1, flags=re.S)
if n != 1:
    raise SystemExit('Catalog themes replacement failed')

demo_catalog = '''  const demoCatalog = [
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
  ];'''
catalog, n = re.subn(r"  const demoCatalog = \[.*?\n  \];", demo_catalog, catalog, count=1, flags=re.S)
if n != 1:
    raise SystemExit('demoCatalog replacement failed')

catalog = catalog.replace(
    "      genreIds:item.genreIds || [], originalLanguage:item.originalLanguage || '', services:[...(item.services || [])], serviceLogos:{...(item.serviceLogos || {})},\n      catalogAvailable:true, source:item.source || 'tmdb-catalog'",
    "      genreIds:item.genreIds || [], originalLanguage:item.originalLanguage || '', services:[...(item.services || [])], serviceLogos:{...(item.serviceLogos || {})},\n      watchRegion:item.watchRegion || 'AT', catalogAvailable:true, source:item.source || 'tmdb-catalog'",
    1
)

old_pref = '''  function preferredAvailableProviders() {
    const available = catalogState.providerMap.filter(provider => provider.available);
    const preferred = new Set(storedProviders());
    const selected = available.filter(provider => preferred.has(provider.name));
    return (selected.length ? selected : available).slice(0, 8);
  }'''
new_pref = '''  function providersForRegion(region) {
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
  }'''
if old_pref not in catalog:
    raise SystemExit('preferredAvailableProviders marker missing')
catalog = catalog.replace(old_pref, new_pref, 1)

old_ensure = '''  async function ensureProviderMap() {
    if (state.providerMap?.length) catalogState.providerMap = state.providerMap;
    if (catalogState.providerMap.length) return catalogState.providerMap;
    if (providerMapPromise) return providerMapPromise;
    const token = localStorage.getItem(TOKEN_KEY)?.trim();
    if (!token) {
      catalogState.providerMap = tmdb.SERVICE_DEFINITIONS.map(service => ({...service,available:true,movieProviderId:null,tvProviderId:null,logoPath:null}));
      return catalogState.providerMap;
    }
    providerMapPromise = tmdb.getProviderMap(token)
      .then(map => { catalogState.providerMap = map; return map; })
      .finally(() => { providerMapPromise = null; });
    return providerMapPromise;
  }'''
new_ensure = '''  async function ensureProviderMap() {
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
  }'''
if old_ensure not in catalog:
    raise SystemExit('ensureProviderMap marker missing')
catalog = catalog.replace(old_ensure, new_ensure, 1)

catalog, n = re.subn(
    r"  function sidebarProviders\(\) \{.*?\n  \}\n\n  function buildProviderNav\(\) \{.*?\n  \}",
    '''  function providerNavMarkup(providers) {
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
  }''',
    catalog, count=1, flags=re.S
)
if n != 1:
    raise SystemExit('buildProviderNav replacement failed')

catalog = catalog.replace(
    "    $('.hero')?.setAttribute('hidden','');",
    "    if (view === 'catalog-home') $('.hero')?.removeAttribute('hidden'); else $('.hero')?.setAttribute('hidden','');",
    1
)
catalog = catalog.replace(
    "    const pair = providerName ? ['ANBIETER', providerName] : (titles[view] || titles['catalog-home']);",
    "    const activeProvider = providerName ? catalogState.providerMap.find(provider => provider.name === providerName) : null;\n    const pair = providerName ? [activeProvider?.region === 'AT' ? 'ANBIETER' : `INTERNATIONAL · ${activeProvider?.region || ''}`, providerName] : (titles[view] || titles['catalog-home']);",
    1
)
catalog = catalog.replace(
    "    $('.services-section')?.removeAttribute('hidden');",
    "    $('.services-section')?.removeAttribute('hidden');\n    $('.hero')?.setAttribute('hidden','');",
    1
)
catalog = catalog.replace(
    "${items.slice(0,12).map(item => catalogCard(item,'backdrop')).join('')}",
    "${items.slice(0,12).map(item => catalogCard(item,'poster')).join('')}",
    1
)

old_header = '''  function headerMarkup(providerName=null) {
    if (providerName) {
      const provider = catalogState.providerMap.find(entry => entry.name === providerName);
      const theme = themeFor(providerName);
      return `<header class="catalog-provider-hero"><div class="provider-hero-logo">${providerLogo(provider,'w300')}</div><div class="provider-hero-copy"><span class="section-kicker">DEIN KATALOG</span><h1>${escapeHTML(providerName)}</h1><p>Filme, Serien und verfügbare Titel von ${escapeHTML(providerName)} in Österreich – unabhängig davon, wann sie erschienen sind.</p><div class="provider-hero-pills"><span>FILME</span><span>SERIEN</span><span>AT</span></div></div><div class="provider-hero-orb" style="--provider-accent:${theme.accent}"></div></header>`;
    }
    return `<header class="catalog-main-hero"><div><span class="section-kicker">STREAMING-KATALOG · ÖSTERREICH</span><h1>Alles, was du<br/><em>streamen kannst.</em></h1><p>Durchsuche das verfügbare Angebot deiner Dienste. Release-Daten sind Zusatzinformationen – der Katalog zeigt auch ältere Filme und Serien.</p></div><div class="catalog-hero-stat"><strong>${catalogState.allItems.size || demoCatalog.length}</strong><span>geladene Titel</span><small>weitere Seiten jederzeit nachladen</small></div></header>`;
  }'''
new_header = '''  function headerMarkup(providerName=null) {
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
  }'''
if old_header not in catalog:
    raise SystemExit('headerMarkup marker missing')
catalog = catalog.replace(old_header, new_header, 1)

catalog = catalog.replace(
    "    return `<div class=\"catalog-loading\"><span></span><span></span><span></span><div><strong>Katalog wird geladen</strong><p>TMDB & JustWatch Provider · Region AT</p></div></div>`;",
    "    const activeProvider = catalogState.provider ? catalogState.providerMap.find(provider => provider.name === catalogState.provider) : null;\n    const region = activeProvider?.region || 'AT';\n    return `<div class=\"catalog-loading\"><span></span><span></span><span></span><div><strong>Katalog wird geladen</strong><p>TMDB & JustWatch Provider · Region ${escapeHTML(region)}</p></div></div>`;",
    1
)

old_home_prefix = "    return `${headerMarkup()}<div class=\"catalog-provider-picker\">"
new_home_prefix = "    return `<div class=\"catalog-home-section-title\"><div><span class=\"section-kicker\">DEINE DIENSTE</span><h2>Direkt losstreamen</h2></div><button class=\"text-button\" data-catalog-action=\"catalog-all\">Gesamtes Angebot →</button></div><div class=\"catalog-provider-picker\">"
if old_home_prefix not in catalog:
    raise SystemExit('renderHome prefix missing')
catalog = catalog.replace(old_home_prefix, new_home_prefix, 1)

old_render_provider = '''  function renderProvider(providerName, items) {
    const filtered = filterLoaded(items);
    const movies = filtered.filter(item => item.type === 'movie');
    const series = filtered.filter(item => item.type === 'series' || item.type === 'anime');
    return `${headerMarkup(providerName)}${rail('Filme','JETZT VERFÜGBAR',movies)}${rail('Serien & Anime','JETZT VERFÜGBAR',series)}<section class="catalog-grid-section provider-all"><div class="catalog-section-head"><div><span class="section-kicker">GESAMTES ANGEBOT</span><h2>Mehr von ${escapeHTML(providerName)}</h2></div><div class="catalog-count"><strong>${filtered.length}</strong><span>geladen</span></div></div><div class="catalog-grid">${filtered.map(item => catalogCard(item)).join('')}</div>${catalogState.hasMore?'<button class="catalog-load-more" id="catalogLoadMore"><span>Mehr von diesem Anbieter laden</span><small>Nächste Katalogseite</small></button>':''}</section>`;
  }'''
new_render_provider = '''  function renderProvider(providerName, items) {
    const filtered = filterLoaded(items);
    const movies = filtered.filter(item => item.type === 'movie');
    const series = filtered.filter(item => item.type === 'series' || item.type === 'anime');
    const networks = NETWORKS_BY_PROVIDER[providerName] || [];
    const networkMarkup = networks.length ? `<section class="provider-networks"><div class="catalog-section-head"><div><span class="section-kicker">NETWORKS</span><h2>Zugehörige Networks</h2><p>Diese Marken gehören zum Anbieter-Umfeld; die konkrete Streaming-Verfügbarkeit kann je Titel variieren.</p></div></div><div class="provider-network-list">${networks.map(network => `<span class="provider-network-chip">${escapeHTML(network)}</span>`).join('')}</div></section>` : '';
    return `${headerMarkup(providerName)}${networkMarkup}${rail('Filme','JETZT VERFÜGBAR',movies)}${rail('Serien & Anime','JETZT VERFÜGBAR',series)}<section class="catalog-grid-section provider-all"><div class="catalog-section-head"><div><span class="section-kicker">GESAMTES ANGEBOT</span><h2>Mehr von ${escapeHTML(providerName)}</h2></div><div class="catalog-count"><strong>${filtered.length}</strong><span>geladen</span></div></div><div class="catalog-grid">${filtered.map(item => catalogCard(item)).join('')}</div>${catalogState.hasMore?'<button class="catalog-load-more" id="catalogLoadMore"><span>Mehr von diesem Anbieter laden</span><small>Nächste Katalogseite</small></button>':''}</section>`;
  }'''
if old_render_provider not in catalog:
    raise SystemExit('renderProvider marker missing')
catalog = catalog.replace(old_render_provider, new_render_provider, 1)

catalog = catalog.replace(
    "      try { details = await tmdb.getDetails(item.mediaType,item.tmdbId,token); }",
    "      try { details = await tmdb.getDetails(item.mediaType,item.tmdbId,token,item.watchRegion || catalogState.providerMap.find(provider => provider.name === item.services?.[0])?.region || 'AT'); }",
    1
)
catalog = catalog.replace(
    "    catalogState.providerMap = state.providerMap || [];\n    buildProviderNav();",
    "    catalogState.providerMap = [];\n    await ensureProviderMap();\n    buildProviderNav();",
    1
)
write('js/catalog.js', catalog)

styles = read('styles.css')
marker = '/* StreamRadar v0.5.0 — Clean Catalog & International Providers */'
if marker not in styles:
    styles = styles.rstrip() + r'''

/* StreamRadar v0.5.0 — Clean Catalog & International Providers */
:root{--clean-bg:#0a0c0f;--clean-panel:#101318;--clean-panel-2:#14181e;--clean-border:rgba(255,255,255,.075);--clean-muted:#8f98a6;--clean-text:#f3f5f7}
body{background:var(--clean-bg);color:var(--clean-text)}
.ambient{opacity:.08!important;filter:blur(130px)!important}
.app-sidebar{background:rgba(10,12,15,.98)!important;border-right:1px solid var(--clean-border)!important;box-shadow:none!important}
.brand-mark{box-shadow:none!important}
.sidebar-section-label{color:#737c89!important;letter-spacing:.14em!important;font-size:10px!important;margin-top:20px!important}
.sidebar-country-label{display:block;padding:8px 14px 3px;color:#59616d;font-size:9px;font-weight:800;letter-spacing:.16em}
.international-section-label{margin-top:26px!important}
.sidebar-link{border:1px solid transparent!important;background:transparent!important;border-radius:9px!important;min-height:42px}
.sidebar-link:hover{background:rgba(255,255,255,.045)!important;border-color:transparent!important;transform:none!important}
.sidebar-link.active{background:rgba(255,255,255,.075)!important;border-color:rgba(255,255,255,.07)!important;box-shadow:none!important}
.provider-nav-logo{border-radius:7px!important;background:#15191f!important;border:1px solid rgba(255,255,255,.06)!important}
.topbar{background:rgba(10,12,15,.88)!important;border-bottom:1px solid var(--clean-border)!important;backdrop-filter:blur(18px)!important}
.search-box,.icon-button{background:#11151a!important;border-color:var(--clean-border)!important;box-shadow:none!important}
.data-status{background:#0f1318!important;border-color:var(--clean-border)!important;box-shadow:none!important}
.hero.clean-home-hero{display:flex;align-items:flex-end;justify-content:space-between;min-height:0!important;padding-top:72px!important;padding-bottom:34px!important;background:none!important;border:none!important;box-shadow:none!important}
.clean-home-copy{max-width:820px}.clean-home-copy .welcome-meta{margin-bottom:18px;color:#8d96a3}.clean-home-copy h1{font-family:Inter,system-ui,sans-serif!important;font-size:clamp(38px,4.4vw,68px)!important;line-height:1.02!important;letter-spacing:-.045em!important;margin:10px 0 16px!important}.clean-home-copy p{max-width:720px;color:#a6aeb9;font-size:17px;line-height:1.65;margin:0}
.legacy-home-hooks{display:none!important}.radar-card,.radar-grid{display:none!important}
.catalog-surface{padding-top:8px!important}.catalog-home-section-title{display:flex;justify-content:space-between;align-items:end;gap:20px;margin:6px 0 18px}.catalog-home-section-title h2{font-size:28px;margin:5px 0 0;letter-spacing:-.025em}
.catalog-main-hero,.catalog-provider-hero{background:linear-gradient(135deg,#11151a,#0d1014)!important;border:1px solid var(--clean-border)!important;border-radius:18px!important;box-shadow:none!important;overflow:hidden}.catalog-main-hero{padding:34px!important;min-height:0!important}.catalog-main-hero h1{font-family:Inter,system-ui,sans-serif!important;font-size:clamp(34px,4vw,56px)!important;letter-spacing:-.045em!important}.catalog-main-hero em{font-style:normal!important;color:#cdd3da!important}.catalog-hero-stat{background:#0b0e12!important;border:1px solid var(--clean-border)!important;box-shadow:none!important}.catalog-provider-hero{padding:32px!important;min-height:230px!important}.catalog-provider-hero:before{opacity:.24!important}.provider-hero-orb{filter:blur(85px)!important;opacity:.16!important}.provider-hero-copy h1{font-size:clamp(40px,5vw,68px)!important;letter-spacing:-.045em!important}.provider-hero-copy p{color:#a5adb8!important;max-width:760px!important}.provider-hero-pills span{background:rgba(255,255,255,.055)!important;border:1px solid rgba(255,255,255,.07)!important;box-shadow:none!important}
.catalog-provider-picker{display:flex!important;gap:10px!important;overflow-x:auto;padding:2px 0 12px!important;margin-bottom:30px!important;scrollbar-width:thin}.catalog-provider-picker button{background:#101419!important;border:1px solid var(--clean-border)!important;border-radius:11px!important;min-width:128px!important;box-shadow:none!important}.catalog-provider-picker button:hover{background:#151a20!important;transform:none!important}.catalog-provider-picker img{max-height:30px!important}
.catalog-rail{margin:34px 0 46px!important}.catalog-section-head{margin-bottom:18px!important}.catalog-section-head h2{font-size:27px!important;letter-spacing:-.025em!important}.catalog-section-head p{color:var(--clean-muted)!important}.catalog-rail-track{display:grid!important;grid-auto-flow:column!important;grid-auto-columns:calc((100% - 60px)/4)!important;gap:20px!important;overflow-x:auto!important;overflow-y:hidden!important;padding:2px 1px 14px!important;scroll-snap-type:x proximity;scrollbar-width:thin}.catalog-rail-track .catalog-card{scroll-snap-align:start}.catalog-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:30px 20px!important}
.catalog-card{min-width:0!important;background:transparent!important;border:none!important;border-radius:0!important;box-shadow:none!important;overflow:visible!important}.catalog-card:hover{transform:translateY(-4px)!important;box-shadow:none!important}.catalog-art{aspect-ratio:2/3!important;border-radius:13px!important;overflow:hidden!important;background:#151920!important;border:1px solid rgba(255,255,255,.065)!important;box-shadow:0 12px 30px rgba(0,0,0,.20)!important}.catalog-art img{width:100%!important;height:100%!important;object-fit:cover!important}.catalog-art-shade{background:linear-gradient(180deg,transparent 55%,rgba(0,0,0,.62))!important}.catalog-card-copy{padding:13px 2px 0!important}.catalog-card-copy>div{gap:8px!important;color:#7e8793!important}.catalog-card-copy h3{font-size:17px!important;line-height:1.25!important;margin:7px 0 4px!important}.catalog-card-copy p{font-size:13px!important;color:#818a96!important}
.catalog-provider-band{left:9px!important;right:9px!important;bottom:9px!important;min-height:38px!important;padding:7px 9px!important;border-radius:9px!important;background:rgba(8,10,13,.88)!important;border:1px solid rgba(255,255,255,.08)!important;box-shadow:none!important;backdrop-filter:blur(12px)}.catalog-provider-band span{max-width:54px!important}.catalog-provider-band img{max-height:22px!important;max-width:54px!important;object-fit:contain!important}.catalog-provider-band strong{font-size:9px!important;letter-spacing:.08em!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.catalog-save{top:9px!important;right:9px!important;background:rgba(8,10,13,.82)!important;border-color:rgba(255,255,255,.12)!important;box-shadow:none!important}.catalog-rating{top:9px!important;left:9px!important;background:rgba(8,10,13,.82)!important;border-color:rgba(255,255,255,.10)!important}.catalog-count{background:#11151a!important;border:1px solid var(--clean-border)!important}.catalog-load-more{background:#11151a!important;border:1px solid var(--clean-border)!important;box-shadow:none!important}
.provider-networks{margin:32px 0 40px;padding:24px;border:1px solid var(--clean-border);border-radius:16px;background:#0f1318}.provider-network-list{display:flex;flex-wrap:wrap;gap:10px}.provider-network-chip{display:inline-flex;align-items:center;min-height:40px;padding:0 14px;border-radius:999px;background:#171b21;border:1px solid rgba(255,255,255,.08);font-weight:700;font-size:13px;color:#dce1e6}.services-section,.release-section,.calendar-panel,.settings-dialog,.detail-dialog{--panel-shadow:none}.release-card,.calendar-panel,.settings-shell,.detail-dialog{box-shadow:none!important}.footer{border-top-color:var(--clean-border)!important}
@media (min-width:1700px){.catalog-rail-track{grid-auto-columns:calc((100% - 80px)/5)!important}.catalog-grid{grid-template-columns:repeat(5,minmax(0,1fr))!important}}@media (max-width:1180px){.catalog-rail-track{grid-auto-columns:calc((100% - 40px)/3)!important}.catalog-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}}@media (max-width:760px){.hero.clean-home-hero{padding-top:38px!important;padding-bottom:24px!important}.clean-home-copy h1{font-size:38px!important}.clean-home-copy p{font-size:15px}.catalog-home-section-title{align-items:start;flex-direction:column}.catalog-rail-track{grid-auto-columns:calc((100% - 14px)/2)!important;gap:14px!important}.catalog-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:24px 14px!important}.catalog-provider-hero{padding:24px!important}.provider-hero-copy h1{font-size:40px!important}}
'''
write('styles.css', styles)

readme = read('README.md')
start = readme.index('## Aktuelle Version:')
end = readme.index('## Funktionsumfang', start)
release_block = '''## Aktuelle Version: v0.5.0

**v0.5.0 – Clean Catalog & International Providers** macht StreamRadar ruhiger, übersichtlicher und internationaler: größere Poster, eine stark vereinfachte Startseite sowie getrennte Streaming-Kataloge für Österreich, USA und Japan.

## Download

### Windows x64

[**StreamRadar v0.5.0 als MSI herunterladen**](downloads/StreamRadar_0.5.0_x64_de-DE.msi)

Weitere Builds und die SHA-256-Prüfsumme liegen im Ordner [`downloads/`](downloads/).

Der Installer ist für die persönliche Nutzung weiterhin nicht code-signiert. Windows kann deshalb beim Öffnen einen Hinweis auf einen unbekannten Herausgeber anzeigen.

## Neu in v0.5.0

- cleaner Dark-UI-Look mit weniger Glow, Rahmen und visueller Unruhe
- alte Radar-Grafik auf der Startseite entfernt; direkter Einstieg in den Streaming-Katalog
- deutlich größere Poster: 4 pro normaler Desktop-Breite, 5 auf sehr breiten Displays, 3 auf kleineren Desktops und 2 mobil
- österreichische Anbieter ergänzt bzw. sichtbar gemacht: **Sky / WOW** und **discovery+**
- neuer Sidebar-Bereich **International** mit getrennten Katalogen für **USA** und **Japan**
- USA: Hulu, Peacock, AMC+, Starz, Tubi und The Roku Channel
- Japan: d Anime Store, ABEMA und U-NEXT
- internationale Providerseiten zeigen ihre echte Watch-Region und weisen darauf hin, dass dies keine Aussage über österreichische Verfügbarkeit ist
- Peacock zeigt die zugehörigen Networks NBC, Bravo, USA Network, Syfy, Telemundo und Universal Kids
- discovery+ zeigt Discovery Channel, TLC, HGTV, Food Network, Animal Planet und Investigation Discovery
- Release-Radar und Kalender bleiben weiterhin ausschließlich auf Österreich ausgerichtet

'''
readme = readme[:start] + release_block + readme[end:]
write('README.md', readme)

changelog = read('CHANGELOG.md')
entry = '''## [0.5.0] - 2026-09-02

### Added
- Multi-Region-Providerarchitektur für getrennte Kataloge in Österreich (`AT`), USA (`US`) und Japan (`JP`).
- Sidebar-Bereich **International** mit US- und Japan-Anbietern.
- Österreich: `discovery+` ergänzt; `Sky / WOW` wird ohne die bisherige Sidebar-Begrenzung vollständig angezeigt.
- USA: Hulu, Peacock, AMC+, Starz, Tubi und The Roku Channel.
- Japan: d Anime Store, ABEMA und U-NEXT.
- Provider-Network-Bereiche für Peacock und discovery+.
- Regionsbewusste Detail-Verfügbarkeit für internationale Titel.
- UI-Snapshots `OldCss/styles-v0.4.1.css` und `OldUi/catalog-v0.4.1.js`.

### Changed
- Startseite vollständig vereinfacht; die dekorative Radar-Grafik wurde entfernt.
- Katalog-Reihen verwenden große Poster statt kleiner Backdrop-Karten.
- Responsive Poster-Dichte: 5 / 4 / 3 / 2 Karten je nach Fensterbreite.
- Visuelles System ruhiger gestaltet: weniger Glow, weniger Rahmen, neutralere Flächen und klarere Typografie.
- Release-Radar bleibt bewusst auf Region Österreich beschränkt.
- App-, Tauri-, Desktop- und MSI-Version auf `0.5.0` angehoben.

### Quality
- Browser-QA erweitert um Clean-Home, große Poster, Sky/discovery+, internationale Providergruppen und Peacock-Networks.

'''
if '## [0.5.0]' not in changelog:
    insert_at = changelog.index('## [0.4.1]')
    changelog = changelog[:insert_at] + entry + changelog[insert_at:]
write('CHANGELOG.md', changelog)

tests = read('tests/e2e/streamradar.spec.js')
tests = tests.replace("version: '0.4.1'", "version: '0.5.0'")
tests = tests.replace("expect(version).toBe('0.4.1');", "expect(version).toBe('0.5.0');")
tests = tests.replace("  const published = '# StreamRadar Downloads\\n\\n### StreamRadar v0.4.2 – Windows x64\\n\\n- Version: `0.4.2`\\n';", "  const published = '# StreamRadar Downloads\\n\\n### StreamRadar v0.5.1 – Windows x64\\n\\n- Version: `0.5.1`\\n';")
tests = tests.replace("Update v0.4.2 verfügbar", "Update v0.5.1 verfügbar")
tests = tests.replace("v0.4.2 MSI herunterladen", "v0.5.1 MSI herunterladen")
tests = tests.replace("expect(state.latest).toBe('0.4.2');", "expect(state.latest).toBe('0.5.1');")
tests = tests.replace("  await expect(page.locator('#catalogSurface')).toContainText('Alles, was du');", "  await expect(page.locator('.clean-home-hero')).toContainText('Was möchtest du heute sehen?');\n  await expect(page.locator('.radar-card')).toHaveCount(0);\n  await expect(page.locator('#catalogSurface')).toContainText('Direkt losstreamen');")

old_sidebar_test = r'''test('provider sidebar includes Crunchyroll and scrolls vertically', async ({ page }) => {
  const errors = await boot(page, configuredStorage());
  await page.setViewportSize({ width: 1200, height: 560 });
  await expect(page.locator('[data-provider-name="Crunchyroll"]')).toHaveCount(1);
  const sidebar = await page.locator('.app-sidebar').evaluate(element => {
    const style = getComputedStyle(element);
    const before = element.scrollTop;
    element.scrollTop = element.scrollHeight;
    return {
      overflowY: style.overflowY,
      scrollable: element.scrollHeight > element.clientHeight,
      moved: element.scrollTop > before
    };
  });
  expect(sidebar.overflowY).toBe('auto');
  expect(sidebar.scrollable).toBe(true);
  expect(sidebar.moved).toBe(true);
  expect(errors).toEqual([]);
});'''
new_sidebar_test = r'''test('provider sidebar is complete, international and scrollable', async ({ page }) => {
  const errors = await boot(page, configuredStorage());
  await page.setViewportSize({ width: 1200, height: 560 });
  await expect(page.locator('#providerNav [data-provider-name="Crunchyroll"]')).toHaveCount(1);
  await expect(page.locator('#providerNav [data-provider-name="Sky / WOW"]')).toHaveCount(1);
  await expect(page.locator('#providerNav [data-provider-name="discovery+"]')).toHaveCount(1);
  await expect(page.locator('#internationalProviderNavUS [data-provider-name="Hulu"]')).toHaveCount(1);
  await expect(page.locator('#internationalProviderNavUS [data-provider-name="Peacock"]')).toHaveCount(1);
  await expect(page.locator('#internationalProviderNavJP [data-provider-name="d Anime Store"]')).toHaveCount(1);
  const sidebar = await page.locator('.app-sidebar').evaluate(element => {
    const style = getComputedStyle(element);
    const before = element.scrollTop;
    element.scrollTop = element.scrollHeight;
    return {
      overflowY: style.overflowY,
      scrollable: element.scrollHeight > element.clientHeight,
      moved: element.scrollTop > before
    };
  });
  expect(sidebar.overflowY).toBe('auto');
  expect(sidebar.scrollable).toBe(true);
  expect(sidebar.moved).toBe(true);
  expect(errors).toEqual([]);
});'''
if old_sidebar_test not in tests:
    raise SystemExit('Old provider sidebar E2E test not found')
tests = tests.replace(old_sidebar_test, new_sidebar_test, 1)

new_tests = r'''

test('clean catalog uses large poster cards at desktop width', async ({ page }) => {
  const errors = await boot(page, configuredStorage());
  await page.setViewportSize({ width: 1440, height: 900 });
  const card = page.locator('.catalog-rail-track .catalog-card').first();
  await expect(card).toBeVisible();
  const metrics = await card.evaluate(element => {
    const art = element.querySelector('.catalog-art');
    const rect = element.getBoundingClientRect();
    const artRect = art.getBoundingClientRect();
    return { width: rect.width, ratio: artRect.width / artRect.height };
  });
  expect(metrics.width).toBeGreaterThan(220);
  expect(metrics.ratio).toBeGreaterThan(0.62);
  expect(metrics.ratio).toBeLessThan(0.70);
  expect(errors).toEqual([]);
});

test('Peacock opens as US catalog and exposes its networks', async ({ page }) => {
  const errors = await boot(page, configuredStorage());
  await page.locator('#internationalProviderNavUS [data-provider-name="Peacock"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-streamradar-view', 'provider-peacock');
  await expect(page.locator('.catalog-provider-hero')).toContainText('INTERNATIONALER KATALOG');
  await expect(page.locator('.catalog-provider-hero')).toContainText('REGION US');
  await expect(page.locator('.provider-network-list')).toContainText('NBC');
  await expect(page.locator('.provider-network-list')).toContainText('Bravo');
  await expect(page.locator('.provider-network-list')).toContainText('Syfy');
  expect(errors).toEqual([]);
});
'''
anchor = "\ntest('release radar still contains movie events and calendar coverage'"
if 'clean catalog uses large poster cards at desktop width' not in tests:
    tests = tests.replace(anchor, new_tests + anchor, 1)
write('tests/e2e/streamradar.spec.js', tests)

print('StreamRadar v0.5.0 clean catalog + international providers applied.')
