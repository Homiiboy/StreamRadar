from pathlib import Path

ROOT = Path('.')


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def write(path, text):
    (ROOT / path).write_text(text, encoding='utf-8', newline='\n')


def replace_once(text, old, new, label):
    if old not in text:
        if new in text:
            return text
        raise SystemExit(f'Missing marker in {label}: {old[:140]!r}')
    return text.replace(old, new, 1)

catalog = read('js/catalog.js')

catalog = replace_once(
    catalog,
    "  const CATALOG_VIEWS = new Set(['catalog-home','catalog-movies','catalog-series','catalog-anime','catalog-watchlist']);\n  const releaseSetView = setView;\n",
    "  const CATALOG_VIEWS = new Set(['catalog-home','catalog-all','catalog-movies','catalog-series','catalog-anime','catalog-watchlist']);\n  const releaseSetView = setView;\n  const releaseRenderReleases = renderReleases;\n",
    'catalog views/render capture'
)

catalog = replace_once(
    catalog,
    "  const catalogState = {\n    view:'catalog-home', provider:null, page:1, loading:false, hasMore:false,\n    items:[], allItems:new Map(), providerMap:[], error:null, query:'', requestSerial:0\n  };\n",
    "  const catalogState = {\n    view:'catalog-home', provider:null, page:1, loading:false, hasMore:false,\n    items:[], allItems:new Map(), providerMap:[], error:null, query:'', requestSerial:0\n  };\n  let providerMapPromise = null;\n",
    'provider map promise'
)

old_provider = '''  async function ensureProviderMap() {
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
'''
new_provider = '''  async function ensureProviderMap() {
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
  }
'''
catalog = replace_once(catalog, old_provider, new_provider, 'provider map dedupe')

catalog = replace_once(
    catalog,
    "      'catalog-home':['ENTDECKEN','Dein Streaming-Katalog'],\n      'catalog-movies':['FILME','Filme streamen'],",
    "      'catalog-home':['ENTDECKEN','Dein Streaming-Katalog'],\n      'catalog-all':['KATALOG','Gesamtes Streaming-Angebot'],\n      'catalog-movies':['FILME','Filme streamen'],",
    'catalog all title'
)

old_card = '''  function catalogCard(item, layout='poster') {
    const key = String(item.entityId || item.id);
    const saved = state.watchlist.has(key);
    const year = String(item.releaseDate || '').slice(0,4);
    const type = item.type === 'movie' ? 'FILM' : item.type === 'anime' ? 'ANIME' : 'SERIE';
    return `<article class="catalog-card catalog-${layout}" data-catalog-id="${escapeHTML(item.id)}" tabindex="0">
'''
new_card = '''  function catalogCard(item, layout='poster') {
    const key = String(item.entityId || item.id);
    const saved = state.watchlist.has(key);
    const year = String(item.releaseDate || '').slice(0,4);
    const type = item.type === 'movie' ? 'FILM' : item.type === 'anime' ? 'ANIME' : 'SERIE';
    const cardTheme = themeFor(item.services?.[0]);
    return `<article class="catalog-card catalog-${layout}" data-catalog-id="${escapeHTML(item.id)}" tabindex="0" style="--item-provider:${cardTheme.accent};--item-glow:${cardTheme.glow}">
'''
catalog = replace_once(catalog, old_card, new_card, 'catalog card theme')

catalog = replace_once(
    catalog,
    "    if (state.view === 'catalog-home') html = renderHome(catalogState.items);\n    else if (state.view === 'catalog-movies')",
    "    if (state.view === 'catalog-home') html = renderHome(catalogState.items);\n    else if (state.view === 'catalog-all') html = renderGrid('Gesamtes Streaming-Angebot','KATALOG',catalogState.items,'Alle aktuell geladenen Filme, Serien und Anime deiner Streaming-Dienste – unabhängig vom Erscheinungsdatum.');\n    else if (state.view === 'catalog-movies')",
    'catalog all render'
)

search_marker = '''  function installInteractions() {
'''
search_helpers = r'''  function catalogSearchItems(query) {
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

'''
if 'function renderCatalogSearchOverlay(' not in catalog:
    catalog = replace_once(catalog, search_marker, search_helpers + search_marker, 'catalog search helpers')

setview_marker = '''  setView = function(view) {
'''
render_wrapper = '''  renderReleases = function(...args) {
    const result = releaseRenderReleases(...args);
    if (isCatalogView(state.view)) setCatalogChrome(state.view);
    return result;
  };

'''
if 'const result = releaseRenderReleases(...args);' not in catalog:
    catalog = replace_once(catalog, setview_marker, render_wrapper + setview_marker, 'catalog render guard')

old_search = '''  if (searchInput) {
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
'''
new_search = '''  if (searchInput) {
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
'''
catalog = replace_once(catalog, old_search, new_search, 'catalog search/init')
write('js/catalog.js', catalog)

tests = read('tests/e2e/streamradar.spec.js')
tests = tests.replace("await page.locator('#searchInput').fill('Neon District');\n  const result = page.locator('.global-search-result').filter({ hasText: 'Neon District' }).first();", "await page.locator('#searchInput').fill('Midnight Protocol');\n  const result = page.locator('.global-search-result').filter({ hasText: 'Midnight Protocol' }).first();")
tests = tests.replace("await expect(page.locator('#detailDialog h2')).toContainText('Neon District');", "await expect(page.locator('#detailDialog h2')).toContainText('Midnight Protocol');")
needle = "  await expect(page.locator('#catalogSurface')).toContainText('Alles, was du');\n\n  await page.locator('.sidebar-link[data-view=\"catalog-movies\"]').click();"
replacement = "  await expect(page.locator('#catalogSurface')).toContainText('Alles, was du');\n  await page.locator('[data-catalog-action=\"catalog-all\"]').first().click();\n  await expect(page.locator('body')).toHaveAttribute('data-streamradar-view', 'catalog-all');\n  await expect(page.locator('#catalogSurface')).toContainText('Gesamtes Streaming-Angebot');\n\n  await page.locator('.sidebar-link[data-view=\"catalog-movies\"]').click();"
tests = replace_once(tests, needle, replacement, 'catalog-all test')
write('tests/e2e/streamradar.spec.js', tests)

print('v0.4.0 self-review fixes applied.')
