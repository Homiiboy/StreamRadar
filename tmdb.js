(() => {
  const API_BASE = 'https://api.themoviedb.org/3';
  const IMAGE_BASE = 'https://image.tmdb.org/t/p';
  const REGION = 'AT';
  const LANGUAGE = 'de-DE';

  const SERVICE_DEFINITIONS = [
    { name: 'Netflix', aliases: ['Netflix'] },
    { name: 'Disney+', aliases: ['Disney Plus', 'Disney+'] },
    { name: 'Prime Video', aliases: ['Amazon Prime Video', 'Prime Video'] },
    { name: 'HBO Max', aliases: ['HBO Max', 'Max'] },
    { name: 'Apple TV+', aliases: ['Apple TV Plus', 'Apple TV+'] },
    { name: 'Paramount+', aliases: ['Paramount Plus', 'Paramount+'] },
    { name: 'Crunchyroll', aliases: ['Crunchyroll'] },
    { name: 'Sky / WOW', aliases: ['Sky X', 'Sky Go', 'WOW'] },
    { name: 'Joyn', aliases: ['Joyn Plus', 'Joyn'] },
    { name: 'RTL+', aliases: ['RTL+', 'RTL Plus'] },
    { name: 'ORF', aliases: ['ORF ON', 'ORF'] }
  ];

  const ORIGINAL_BRANDS = [
    { name: 'Netflix', network: ['Netflix'], company: ['Netflix'] },
    { name: 'HBO', network: ['HBO'], company: ['HBO'] },
    { name: 'HBO Max', network: ['HBO Max', 'Max'], company: ['HBO Max'] },
    { name: 'Disney+', network: ['Disney+'], company: ['Disney+'] },
    { name: 'Hulu', network: ['Hulu'], company: ['Hulu'] },
    { name: 'FX', network: ['FX', 'FXX', 'FX on Hulu'], company: ['FX Productions'] },
    { name: 'Prime Video', network: ['Prime Video', 'Amazon'], company: ['Amazon Studios', 'Amazon MGM Studios'] },
    { name: 'Apple TV+', network: ['Apple TV+'], company: ['Apple Studios'] },
    { name: 'Paramount+', network: ['Paramount+'], company: ['Paramount Television Studios'] },
    { name: 'Peacock', network: ['Peacock'], company: ['Peacock'] },
    { name: 'AMC+', network: ['AMC+', 'AMC'], company: ['AMC Studios'] },
    { name: 'Crunchyroll', network: ['Crunchyroll'], company: ['Crunchyroll'] },
    { name: 'BBC', network: ['BBC One', 'BBC Two', 'BBC Three', 'BBC iPlayer'], company: ['BBC Studios'] },
    { name: 'Sky', network: ['Sky Atlantic', 'Sky One', 'Sky Max', 'Sky'], company: ['Sky Studios'] },
    { name: 'Joyn', network: ['Joyn'], company: ['Joyn'] },
    { name: 'RTL+', network: ['RTL+'], company: ['RTL'] },
    { name: 'ORF', network: ['ORF 1', 'ORF 2', 'ORF ON'], company: ['ORF'] }
  ];

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
  function matchesAlias(value, aliases) {
    const normalized = normalizeName(value);
    const candidates = aliases.map(normalizeName);
    if (candidates.includes(normalized)) return true;
    return candidates.some(candidate => candidate.length >= 4 && (normalized.includes(candidate) || candidate.includes(normalized)));
  }

  function resolveProviderMap(movieProviders, tvProviders) {
    return SERVICE_DEFINITIONS.map(service => {
      const movie = movieProviders.find(provider => matchesAlias(provider.provider_name, service.aliases));
      const tv = tvProviders.find(provider => matchesAlias(provider.provider_name, service.aliases));
      const source = movie || tv;
      return { ...service, movieProviderId: movie?.provider_id || null, tvProviderId: tv?.provider_id || null, logoPath: source?.logo_path || null, available: Boolean(movie || tv) };
    });
  }

  const formatISO = date => date.toISOString().slice(0, 10);
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
    const common = { language: LANGUAGE, watch_region: REGION, with_watch_providers: providerId, with_watch_monetization_types: 'flatrate|free|ads', include_adult: false, page: 1, sort_by: 'popularity.desc' };
    const params = mediaType === 'movie'
      ? { ...common, region: REGION, 'release_date.gte': from, 'release_date.lte': to }
      : { ...common, 'first_air_date.gte': from, 'first_air_date.lte': to };
    const data = await request(`/discover/${mediaType}`, token, params);
    return (data.results || []).map(item => normalizeRelease(item, mediaType, service));
  }

  function normalizeRelease(item, mediaType, service) {
    const date = mediaType === 'movie' ? item.release_date : item.first_air_date;
    const isAnime = mediaType === 'tv' && item.genre_ids?.includes(16) && item.original_language === 'ja';
    return {
      id: `${mediaType}-${item.id}`, tmdbId: item.id, mediaType,
      type: mediaType === 'movie' ? 'movie' : (isAnime ? 'anime' : 'series'),
      title: mediaType === 'movie' ? item.title : item.name,
      originalTitle: mediaType === 'movie' ? item.original_title : item.original_name,
      description: item.overview || 'Für diesen Titel ist derzeit keine deutsche Beschreibung hinterlegt.',
      releaseDate: date || '', posterPath: item.poster_path || null, backdropPath: item.backdrop_path || null,
      rating: Number(item.vote_average || 0), popularity: Number(item.popularity || 0), genreIds: item.genre_ids || [], originalLanguage: item.original_language || '',
      services: [service.name], serviceLogos: service.logoPath ? { [service.name]: service.logoPath } : {},
      original: null, originalBrand: null, originalConfidence: null, originalLogoPath: null, originalLogoSource: null, source: 'tmdb'
    };
  }

  function mergeReleases(groups) {
    const merged = new Map();
    groups.flat().forEach(item => {
      const current = merged.get(item.id);
      if (!current) return merged.set(item.id, item);
      item.services.forEach(service => { if (!current.services.includes(service)) current.services.push(service); });
      current.serviceLogos = { ...current.serviceLogos, ...item.serviceLogos };
    });
    return [...merged.values()];
  }

  async function validateToken(token) { await request('/configuration', token); return true; }
  async function getProviderMap(token) {
    const [movieData, tvData] = await Promise.all([
      request('/watch/providers/movie', token, { language: LANGUAGE, watch_region: REGION }),
      request('/watch/providers/tv', token, { language: LANGUAGE, watch_region: REGION })
    ]);
    return resolveProviderMap(movieData.results || [], tvData.results || []);
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

  function inferOriginalBrand(details) {
    const networks = details.networks || [];
    const companies = details.production_companies || [];
    for (const brand of ORIGINAL_BRANDS) {
      const network = networks.find(item => matchesAlias(item.name || '', brand.network));
      if (network) return { brand: brand.name, confidence: 'high', evidence: network.name, logoPath: network.logo_path || null, logoSource: 'network' };
    }
    for (const brand of ORIGINAL_BRANDS) {
      const company = companies.find(item => matchesAlias(item.name || '', brand.company));
      if (company) return { brand: brand.name, confidence: 'medium', evidence: company.name, logoPath: company.logo_path || null, logoSource: 'production_company' };
    }
    return { brand: null, confidence: null, evidence: null, logoPath: null, logoSource: null };
  }

  async function getCoreDetails(mediaType, id, token) {
    return request(`/${mediaType}/${id}`, token, { language: LANGUAGE, append_to_response: 'external_ids' });
  }

  async function enrichOriginalMetadata(releases, token, onProgress, limit = 72) {
    const candidates = releases.filter(item => item.tmdbId && item.mediaType).slice(0, limit);
    const queue = [...candidates]; let completed = 0;
    const workers = Array.from({ length: Math.min(5, queue.length) }, async () => {
      while (queue.length) {
        const item = queue.shift();
        try {
          const details = await getCoreDetails(item.mediaType, item.tmdbId, token);
          const original = inferOriginalBrand(details);
          item.originalBrand = original.brand;
          item.originalConfidence = original.confidence;
          item.originalEvidence = original.evidence;
          item.originalLogoPath = original.logoPath;
          item.originalLogoSource = original.logoSource;
          item.original = Boolean(original.brand);
          item.externalIds = details.external_ids || {};
          item.networks = (details.networks || []).map(network => network.name);
          item.productionCompanies = (details.production_companies || []).map(company => company.name);
        } catch (error) { console.warn(`StreamRadar: Original-Metadaten für ${item.id} fehlgeschlagen.`, error); }
        completed += 1; onProgress?.(completed, candidates.length);
      }
    });
    await Promise.all(workers);
    return releases;
  }

  async function getDetails(mediaType, id, token) {
    const [details, providerData] = await Promise.all([
      getCoreDetails(mediaType, id, token),
      request(`/${mediaType}/${id}/watch/providers`, token)
    ]);
    const at = providerData.results?.[REGION] || {};
    const streaming = [...(at.flatrate || []), ...(at.free || []), ...(at.ads || [])];
    const uniqueStreaming = [...new Map(streaming.map(provider => [provider.provider_id, provider])).values()];
    const original = inferOriginalBrand(details);
    return {
      ...details,
      providers: uniqueStreaming,
      watchLink: at.link || null,
      inferredOriginalBrand: original.brand,
      originalConfidence: original.confidence,
      originalEvidence: original.evidence,
      inferredOriginalLogoPath: original.logoPath,
      originalLogoSource: original.logoSource
    };
  }

  const image = (path, size = 'w500') => path ? `${IMAGE_BASE}/${size}${path}` : '';
  window.StreamRadarTMDB = { REGION, LANGUAGE, SERVICE_DEFINITIONS, ORIGINAL_BRANDS, validateToken, getProviderMap, loadRadar, enrichOriginalMetadata, getDetails, image };
})();