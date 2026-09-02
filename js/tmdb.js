(() => {
  const API_BASE = 'https://api.themoviedb.org/3';
  const IMAGE_BASE = 'https://image.tmdb.org/t/p';
  const REGION = 'AT';
  const LANGUAGE = 'de-DE';
  const PROVIDER_REGIONS = ['AT', 'US', 'JP'];
  const overrides = window.StreamRadarOriginalOverrides || { getOverride: () => null };

  const SERVICE_DEFINITIONS = [
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
  ];

  const ORIGINAL_BRANDS = [
    { name:'Netflix', category:'platform', network:['Netflix'], company:['Netflix','Netflix Studios'], companyOriginal:true, priority:30 },
    { name:'HBO Max', category:'platform', network:['HBO Max','Max'], company:['HBO Max'], companyOriginal:true, priority:30 },
    { name:'HBO', category:'network', network:['HBO'], company:['HBO'], companyOriginal:true, priority:28 },
    { name:'Disney+', category:'platform', network:['Disney+'], company:['Disney+'], companyOriginal:true, priority:30 },
    { name:'Hulu', category:'platform', network:['Hulu','FX on Hulu'], company:['Hulu'], companyOriginal:true, priority:28 },
    { name:'FX', category:'network', network:['FX','FXX'], company:['FX Productions'], companyOriginal:true, priority:29 },
    { name:'Prime Video', category:'platform', network:['Prime Video','Amazon Prime Video'], company:['Amazon Studios','Amazon MGM Studios'], companyOriginal:true, priority:30 },
    { name:'Apple TV+', category:'platform', network:['Apple TV+'], company:['Apple Studios','Apple TV+'], companyOriginal:true, priority:30 },
    { name:'Paramount+', category:'platform', network:['Paramount+'], company:['Paramount Television Studios'], companyOriginal:true, priority:30 },
    { name:'Showtime', category:'network', network:['Showtime'], company:['Showtime Networks','Showtime Networks Inc.'], companyOriginal:true, priority:27 },
    { name:'Peacock', category:'platform', network:['Peacock'], company:['Peacock'], companyOriginal:true, priority:30 },
    { name:'AMC+', category:'platform', network:['AMC+'], company:['AMC Networks'], companyOriginal:true, priority:29 },
    { name:'AMC', category:'network', network:['AMC'], company:['AMC Studios'], companyOriginal:true, priority:27 },
    { name:'Crunchyroll', category:'platform', network:['Crunchyroll'], company:['Crunchyroll'], companyOriginal:true, priority:30 },
    { name:'Sky', category:'network', network:['Sky Atlantic','Sky One','Sky Max','Sky'], company:['Sky Studios'], companyOriginal:true, priority:27 },
    { name:'BBC', category:'broadcaster', network:['BBC One','BBC Two','BBC Three','BBC Four','BBC iPlayer'], company:['BBC Studios'], companyOriginal:true, priority:25 },
    { name:'CANAL+', category:'broadcaster', network:['Canal+','CANAL+'], company:['Canal+','STUDIOCANAL'], companyOriginal:true, priority:25 },
    { name:'CBS', category:'network', network:['CBS'], company:['CBS Studios','CBS Television Studios'], companyOriginal:true, priority:24 },
    { name:'NBC', category:'network', network:['NBC'], company:['Universal Television','NBCUniversal'], companyOriginal:false, priority:23 },
    { name:'ABC', category:'network', network:['ABC'], company:['ABC Studios','ABC Signature'], companyOriginal:true, priority:24 },
    { name:'FOX', category:'network', network:['FOX','Fox'], company:['Fox Entertainment','20th Television'], companyOriginal:false, priority:23 },
    { name:'Starz', category:'network', network:['Starz'], company:['Starz'], companyOriginal:true, priority:24 },
    { name:'Joyn', category:'platform', network:['Joyn'], company:['Joyn'], companyOriginal:true, priority:28 },
    { name:'RTL+', category:'platform', network:['RTL+'], company:['RTL'], companyOriginal:true, priority:27 },
    { name:'ORF', category:'broadcaster', network:['ORF 1','ORF 2','ORF III','ORF ON'], company:['ORF'], companyOriginal:true, priority:26 },
    { name:'Marvel Studios', category:'studio', network:[], company:['Marvel Studios'], companyOriginal:false, priority:20 },
    { name:'Lucasfilm', category:'studio', network:[], company:['Lucasfilm Ltd.','Lucasfilm'], companyOriginal:false, priority:20 },
    { name:'Pixar', category:'studio', network:[], company:['Pixar','Pixar Animation Studios'], companyOriginal:false, priority:20 },
    { name:'Walt Disney Studios', category:'studio', network:[], company:['Walt Disney Pictures','Walt Disney Studios Motion Pictures'], companyOriginal:false, priority:18 },
    { name:'National Geographic', category:'brand', network:['National Geographic'], company:['National Geographic'], companyOriginal:false, priority:20 },
    { name:'Warner Bros.', category:'studio', network:[], company:['Warner Bros. Television','Warner Bros. Pictures','Warner Bros. Entertainment'], companyOriginal:false, priority:16 },
    { name:'Sony Pictures', category:'studio', network:[], company:['Sony Pictures Television','Sony Pictures Entertainment'], companyOriginal:false, priority:16 },
    { name:'A24', category:'studio', network:[], company:['A24'], companyOriginal:false, priority:16 }
  ];

  const MOVIE_RELEASE_TYPES = {
    1: 'Film-Premiere',
    2: 'Kinostart (limitiert)',
    3: 'Kinostart',
    4: 'Digital-Premiere',
    5: 'Home-Release',
    6: 'TV-Premiere'
  };

  const jsonHeaders = token => ({ accept: 'application/json', Authorization: `Bearer ${token}` });

  async function request(path, token, params = {}) {
    if (!token) throw new Error('TMDB_TOKEN_MISSING');
    const url = new URL(`${API_BASE}${path}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    });
    const response = await fetch(url, { headers: jsonHeaders(token) });
    if (!response.ok) {
      const error = new Error(`TMDB_${response.status}`);
      error.status = response.status;
      throw error;
    }
    return response.json();
  }

  const normalizeName = (value = '') => value.toLowerCase().replace(/[+&._-]/g, ' ').replace(/\s+/g, ' ').trim();
  function aliasScore(value, aliases = []) {
    const normalized = normalizeName(value);
    if (!normalized) return 0;
    let best = 0;
    aliases.map(normalizeName).filter(Boolean).forEach(candidate => {
      if (normalized === candidate) best = Math.max(best, 100);
      else if (candidate.length >= 4 && (normalized.includes(candidate) || candidate.includes(normalized))) best = Math.max(best, 86);
    });
    return best;
  }
  function matchesAlias(value, aliases) { return aliasScore(value, aliases) > 0; }

  function resolveProviderMap(movieProviders, tvProviders, definitions = SERVICE_DEFINITIONS, region = REGION) {
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
  }

  const formatISO = date => date.toISOString().slice(0, 10);
  const parseISO = value => {
    if (!value) return null;
    const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  function dayDistance(value) {
    const date = parseISO(value);
    if (!date) return 99999;
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    return Math.round((date - now) / 86400000);
  }
  function inWindow(value, pastDays = 35, futureDays = 90) {
    const days = dayDistance(value);
    return days >= -pastDays && days <= futureDays;
  }
  function dateWindow() {
    const now = new Date(); now.setHours(12, 0, 0, 0);
    const past = new Date(now); past.setDate(past.getDate() - 35);
    const future = new Date(now); future.setDate(future.getDate() + 90);
    return { from: formatISO(past), to: formatISO(future) };
  }

  async function discoverForProvider(service, mediaType, token) {
    const providerId = mediaType === 'movie' ? service.movieProviderId : service.tvProviderId;
    if (!providerId) return [];
    const { from, to } = dateWindow();
    const common = {
      language: LANGUAGE,
      watch_region: REGION,
      with_watch_providers: providerId,
      with_watch_monetization_types: 'flatrate|free|ads',
      include_adult: false,
      page: 1,
      sort_by: 'popularity.desc'
    };
    const params = mediaType === 'movie'
      ? { ...common, region: REGION, 'release_date.gte': from, 'release_date.lte': to }
      : { ...common, 'air_date.gte': from, 'air_date.lte': to, include_null_first_air_dates: false };
    const data = await request(`/discover/${mediaType}`, token, params);
    return (data.results || []).map(item => normalizeRelease(item, mediaType, service));
  }

  function normalizeRelease(item, mediaType, service) {
    const baseDate = mediaType === 'movie' ? item.release_date : item.first_air_date;
    const isAnime = mediaType === 'tv' && item.genre_ids?.includes(16) && item.original_language === 'ja';
    return {
      id: `${mediaType}-${item.id}`,
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
      popularity: Number(item.popularity || 0),
      genreIds: item.genre_ids || [],
      originalLanguage: item.original_language || '',
      services: [service.name],
      serviceLogos: service.logoPath ? { [service.name]: service.logoPath } : {},
      original: null,
      originalBrand: null,
      originalConfidence: null,
      originalLogoPath: null,
      originalLogoSource: null,
      originType: null,
      originLabel: null,
      originalScore: null,
      originalReason: null,
      overrideApplied: false,
      eventKind: mediaType === 'movie' ? 'movie-premiere' : 'series-premiere',
      eventLabel: mediaType === 'movie' ? 'Film-Premiere' : 'Neue Serie',
      eventSeason: mediaType === 'tv' ? 1 : null,
      eventEpisode: null,
      eventSource: 'tmdb-discover',
      radarEligible: mediaType === 'movie' || inWindow(baseDate),
      source: 'tmdb'
    };
  }

  function normalizeCatalogItem(item, mediaType, service) {
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
      watchRegion: service.region || REGION,
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
    const watchRegion = service.region || REGION;
    const params = {
      language: LANGUAGE,
      watch_region: watchRegion,
      with_watch_providers: providerId,
      with_watch_monetization_types: 'flatrate|free|ads',
      include_adult: false,
      page,
      sort_by: options.sortBy || 'popularity.desc'
    };
    if (mediaType === 'movie') params.region = watchRegion;
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

  function mergeReleases(groups) {
    const merged = new Map();
    groups.flat().forEach(item => {
      const current = merged.get(item.entityId);
      if (!current) return merged.set(item.entityId, item);
      item.services.forEach(service => { if (!current.services.includes(service)) current.services.push(service); });
      current.serviceLogos = { ...current.serviceLogos, ...item.serviceLogos };
      if ((item.popularity || 0) > (current.popularity || 0)) current.popularity = item.popularity;
    });
    return [...merged.values()]
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 120);
  }

  async function validateToken(token) { await request('/configuration', token); return true; }
  async function getProviderMap(token, region = REGION) {
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
  }

  async function loadRadar(token, onProgress) {
    const providerMap = await getProviderMap(token);
    const jobs = [];
    providerMap.filter(service => service.available).forEach(service => {
      if (service.movieProviderId) jobs.push({ service, mediaType: 'movie' });
      if (service.tvProviderId) jobs.push({ service, mediaType: 'tv' });
    });
    const total = jobs.length, groups = []; let completed = 0;
    const workers = Array.from({ length: Math.min(5, total) }, async () => {
      while (jobs.length) {
        const job = jobs.shift();
        try { groups.push(await discoverForProvider(job.service, job.mediaType, token)); }
        catch (error) { console.warn(`StreamRadar: ${job.service.name}/${job.mediaType} konnte nicht geladen werden.`, error); }
        completed += 1; onProgress?.(completed, total);
      }
    });
    await Promise.all(workers);
    return { releases: mergeReleases(groups), providers: providerMap };
  }

  function brandDefinition(name) { return ORIGINAL_BRANDS.find(item => item.name === name) || null; }
  function originLabelFor(definition, qualifiesAsOriginal) {
    if (definition?.category === 'studio') return 'Studio / Brand';
    if (definition?.category === 'brand') return 'Herkunftsmarke';
    return qualifiesAsOriginal ? 'Original von' : 'Herkunft';
  }

  function inferOriginalBrand(details, mediaType = 'tv', tmdbId = null, title = '') {
    const manual = overrides.getOverride?.(mediaType, tmdbId, title || details.name || details.title || '');
    if (manual?.action === 'deny') {
      return {
        brand:null, confidence:'manual', evidence:manual.note || 'Manuell ausgeschlossen', logoPath:null, logoSource:null,
        originType:'manual', originLabel:'Manuell geprüft', score:100, reason:manual.note || 'Manueller Ausschluss',
        qualifiesAsOriginal:false, overrideApplied:true
      };
    }
    if (manual?.action === 'force' && manual.brand) {
      const definition = brandDefinition(manual.brand);
      const qualifies = manual.qualifiesAsOriginal ?? definition?.companyOriginal ?? true;
      return {
        brand:manual.brand, confidence:'manual', evidence:manual.note || 'Manuell bestätigt', logoPath:manual.logoPath || null,
        logoSource:'manual', originType:manual.originType || definition?.category || 'manual',
        originLabel:manual.originLabel || originLabelFor(definition, qualifies), score:100,
        reason:manual.note || 'Manuelle Override-Regel', qualifiesAsOriginal:Boolean(qualifies), overrideApplied:true
      };
    }

    const networks = details.networks || [];
    const companies = details.production_companies || [];
    const candidates = [];

    ORIGINAL_BRANDS.forEach(definition => {
      networks.forEach(network => {
        const match = aliasScore(network.name || '', definition.network || []);
        if (!match) return;
        const score = Math.min(100, (match === 100 ? 96 : 86) + Math.min(4, definition.priority || 0) / 10);
        candidates.push({
          definition, score, evidence:network.name, logoPath:network.logo_path || null, logoSource:'network',
          originType:definition.category, qualifiesAsOriginal:true,
          reason:`Network-Treffer: ${network.name}`
        });
      });

      companies.forEach(company => {
        const match = aliasScore(company.name || '', definition.company || []);
        if (!match) return;
        const base = match === 100 ? 74 : 63;
        const score = base + Math.min(5, definition.priority || 0) / 10;
        candidates.push({
          definition, score, evidence:company.name, logoPath:company.logo_path || null, logoSource:'production_company',
          originType:definition.category, qualifiesAsOriginal:Boolean(definition.companyOriginal),
          reason:`Produktionsfirma: ${company.name}`
        });
      });
    });

    candidates.sort((a, b) => b.score - a.score || (b.definition.priority || 0) - (a.definition.priority || 0));
    const selected = candidates.find(candidate => candidate.score >= 70);
    if (!selected) {
      return { brand:null, confidence:null, evidence:null, logoPath:null, logoSource:null, originType:null, originLabel:null, score:null, reason:null, qualifiesAsOriginal:false, overrideApplied:false };
    }

    const confidence = selected.score >= 90 ? 'high' : selected.score >= 70 ? 'medium' : 'low';
    return {
      brand:selected.definition.name,
      confidence,
      evidence:selected.evidence,
      logoPath:selected.logoPath,
      logoSource:selected.logoSource,
      originType:selected.originType,
      originLabel:originLabelFor(selected.definition, selected.qualifiesAsOriginal),
      score:Math.round(selected.score),
      reason:selected.reason,
      qualifiesAsOriginal:selected.qualifiesAsOriginal,
      overrideApplied:false
    };
  }

  function chooseMovieRelease(details, fallbackDate) {
    const regional = details.release_dates?.results?.find(entry => entry.iso_3166_1 === REGION)?.release_dates || [];
    const candidates = regional
      .map(entry => ({ date: String(entry.release_date || '').slice(0, 10), type: Number(entry.type || 0), note: entry.note || '' }))
      .filter(entry => entry.date && inWindow(entry.date));

    if (!candidates.length) {
      return { date: fallbackDate || details.release_date || '', type: null, label: 'Film-Premiere', source: 'tmdb-fallback' };
    }

    const typeRank = { 4: 0, 6: 1, 1: 2, 3: 3, 2: 4, 5: 5 };
    candidates.sort((a, b) => {
      const rank = (typeRank[a.type] ?? 9) - (typeRank[b.type] ?? 9);
      if (rank) return rank;
      const aDays = dayDistance(a.date), bDays = dayDistance(b.date);
      const aScore = Math.abs(aDays) + (aDays < 0 ? 3 : 0);
      const bScore = Math.abs(bDays) + (bDays < 0 ? 3 : 0);
      return aScore - bScore;
    });

    const selected = candidates[0];
    return { ...selected, label: MOVIE_RELEASE_TYPES[selected.type] || 'Film-Premiere', source: 'tmdb-release-dates' };
  }

  function chooseTvEvent(details, fallbackDate) {
    const firstAirDate = details.first_air_date || fallbackDate || '';
    if (inWindow(firstAirDate, 35, 90)) {
      return { date:firstAirDate, kind:'series-premiere', label:'Neue Serie', season:1, episode:1, episodeName:details.name || null, source:'tmdb-first-air-date', eligible:true };
    }

    const seasons = (details.seasons || [])
      .filter(season => Number(season.season_number) > 0 && season.air_date && inWindow(season.air_date, 21, 90))
      .sort((a, b) => {
        const aDays = dayDistance(a.air_date), bDays = dayDistance(b.air_date);
        const aScore = Math.abs(aDays) + (aDays < 0 ? 2 : 0);
        const bScore = Math.abs(bDays) + (bDays < 0 ? 2 : 0);
        return aScore - bScore;
      });

    if (seasons.length) {
      const season = seasons[0];
      return { date:season.air_date, kind:'season-premiere', label:`Neue Staffel ${season.season_number}`, season:season.season_number, episode:1, episodeName:null, source:'tmdb-season-air-date', eligible:true };
    }

    const next = details.next_episode_to_air;
    const previous = details.last_episode_to_air;
    const episode = next?.air_date && inWindow(next.air_date, 7, 30)
      ? next
      : (previous?.air_date && inWindow(previous.air_date, 7, 0) ? previous : null);

    if (episode) {
      const isSeasonPremiere = Number(episode.episode_number) === 1 && Number(episode.season_number) > 1;
      return {
        date: episode.air_date,
        kind: isSeasonPremiere ? 'season-premiere' : 'episode',
        label: isSeasonPremiere ? `Neue Staffel ${episode.season_number}` : 'Neue Episode',
        season: episode.season_number || null,
        episode: episode.episode_number || null,
        episodeName: episode.name || null,
        source: next === episode ? 'tmdb-next-episode' : 'tmdb-last-episode',
        eligible: true
      };
    }

    return { date:fallbackDate || firstAirDate, kind:'series-premiere', label:'Serie', season:null, episode:null, episodeName:null, source:'tmdb-unclassified', eligible:false };
  }

  function classifyRelease(item, details) {
    if (item.mediaType === 'movie') {
      const release = chooseMovieRelease(details, item.releaseDate);
      return {
        releaseDate: release.date,
        eventKind: 'movie-premiere',
        eventLabel: release.label,
        eventSeason: null,
        eventEpisode: null,
        eventEpisodeName: null,
        eventSource: release.source,
        releaseType: release.type,
        radarEligible: Boolean(release.date && inWindow(release.date))
      };
    }

    const event = chooseTvEvent(details, item.releaseDate);
    return {
      releaseDate: event.date,
      eventKind: event.kind,
      eventLabel: event.label,
      eventSeason: event.season,
      eventEpisode: event.episode,
      eventEpisodeName: event.episodeName,
      eventSource: event.source,
      releaseType: null,
      radarEligible: event.eligible
    };
  }

  async function getCoreDetails(mediaType, id, token) {
    const append = mediaType === 'movie' ? 'external_ids,release_dates' : 'external_ids';
    return request(`/${mediaType}/${id}`, token, { language: LANGUAGE, append_to_response: append });
  }

  async function enrichRadarMetadata(releases, token, onProgress) {
    const candidates = releases.filter(item => item.tmdbId && item.mediaType);
    const queue = [...candidates]; let completed = 0;
    const workers = Array.from({ length: Math.min(5, queue.length) }, async () => {
      while (queue.length) {
        const item = queue.shift();
        try {
          const details = await getCoreDetails(item.mediaType, item.tmdbId, token);
          const origin = inferOriginalBrand(details, item.mediaType, item.tmdbId, item.originalTitle || item.title);
          const classification = classifyRelease(item, details);
          Object.assign(item, classification, {
            originalBrand: origin.brand,
            originalConfidence: origin.confidence,
            originalEvidence: origin.evidence,
            originalLogoPath: origin.logoPath,
            originalLogoSource: origin.logoSource,
            originType: origin.originType,
            originLabel: origin.originLabel,
            originalScore: origin.score,
            originalReason: origin.reason,
            overrideApplied: origin.overrideApplied,
            original: Boolean(origin.brand && origin.qualifiesAsOriginal),
            externalIds: details.external_ids || {},
            networks: (details.networks || []).map(network => network.name),
            productionCompanies: (details.production_companies || []).map(company => company.name)
          });
        } catch (error) {
          console.warn(`StreamRadar: Metadaten für ${item.id} fehlgeschlagen.`, error);
        }
        completed += 1;
        onProgress?.(completed, candidates.length);
      }
    });
    await Promise.all(workers);
    return releases;
  }

  async function getDetails(mediaType, id, token, region = REGION) {
    const [details, providerData] = await Promise.all([
      getCoreDetails(mediaType, id, token),
      request(`/${mediaType}/${id}/watch/providers`, token)
    ]);
    const regional = providerData.results?.[region] || {};
    const streaming = [...(regional.flatrate || []), ...(regional.free || []), ...(regional.ads || [])];
    const uniqueStreaming = [...new Map(streaming.map(provider => [provider.provider_id, provider])).values()];
    const origin = inferOriginalBrand(details, mediaType, id, details.original_name || details.original_title || details.name || details.title || '');
    const classification = classifyRelease({ mediaType, releaseDate: details.release_date || details.first_air_date || '' }, details);
    return {
      ...details,
      providers: uniqueStreaming,
      watchLink: regional.link || null,
      inferredOriginalBrand: origin.brand,
      originalConfidence: origin.confidence,
      originalEvidence: origin.evidence,
      inferredOriginalLogoPath: origin.logoPath,
      originalLogoSource: origin.logoSource,
      originType: origin.originType,
      originLabel: origin.originLabel,
      originalScore: origin.score,
      originalReason: origin.reason,
      overrideApplied: origin.overrideApplied,
      qualifiesAsOriginal: origin.qualifiesAsOriginal,
      classification
    };
  }

  async function getSeasonProviders(seriesId, seasonNumber, token) {
    if (!seriesId || !seasonNumber) return null;
    try {
      const data = await request(`/tv/${seriesId}/season/${seasonNumber}/watch/providers`, token);
      const at = data.results?.[REGION] || {};
      const streaming = [...(at.flatrate || []), ...(at.free || []), ...(at.ads || [])];
      return { providers:[...new Map(streaming.map(provider => [provider.provider_id, provider])).values()], watchLink:at.link || null };
    } catch (error) {
      console.warn('StreamRadar: Season-Provider konnten nicht geladen werden.', error);
      return null;
    }
  }

  const image = (path, size = 'w500') => path ? `${IMAGE_BASE}/${size}${path}` : '';

  window.StreamRadarTMDB = {
    REGION,
    LANGUAGE,
    PROVIDER_REGIONS,
    SERVICE_DEFINITIONS,
    ORIGINAL_BRANDS,
    MOVIE_RELEASE_TYPES,
    validateToken,
    getProviderMap,
    getAllProviderMaps,
    loadRadar,
    loadCatalogPage,
    discoverCatalogForProvider,
    mergeCatalogItems,
    enrichRadarMetadata,
    getDetails,
    getSeasonProviders,
    image
  };
})();
