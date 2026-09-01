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
    { name: 'Sky / WOW', aliases: ['Sky X', 'Sky Go', 'WOW', 'Sky'] },
    { name: 'Joyn', aliases: ['Joyn Plus', 'Joyn'] },
    { name: 'RTL+', aliases: ['RTL+', 'RTL Plus'] },
    { name: 'ORF', aliases: ['ORF ON', 'ORF'] }
  ];

  const jsonHeaders = token => ({
    accept: 'application/json',
    Authorization: `Bearer ${token}`
  });

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

  function normalizeName(value = '') {
    return value.toLowerCase().replace(/[+&._-]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function matchesAlias(providerName, aliases) {
    const normalized = normalizeName(providerName);
    return aliases.some(alias => {
      const candidate = normalizeName(alias);
      return normalized === candidate || normalized.includes(candidate) || candidate.includes(normalized);
    });
  }

  function resolveProviderMap(movieProviders, tvProviders) {
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
  }

  function formatISO(date) {
    return date.toISOString().slice(0, 10);
  }

  function dateWindow() {
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    const past = new Date(now);
    past.setDate(past.getDate() - 35);
    const future = new Date(now);
    future.setDate(future.getDate() + 90);
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
      page: 1
    };

    const params = mediaType === 'movie'
      ? { ...common, 'release_date.gte': from, 'release_date.lte': to, sort_by: 'release_date.desc' }
      : { ...common, 'first_air_date.gte': from, 'first_air_date.lte': to, sort_by: 'first_air_date.desc' };

    const data = await request(`/discover/${mediaType}`, token, params);
    return (data.results || []).map(item => normalizeRelease(item, mediaType, service));
  }

  function normalizeRelease(item, mediaType, service) {
    const date = mediaType === 'movie' ? item.release_date : item.first_air_date;
    const isAnime = mediaType === 'tv' && item.genre_ids?.includes(16) && item.original_language === 'ja';
    return {
      id: `${mediaType}-${item.id}`,
      tmdbId: item.id,
      mediaType,
      type: mediaType === 'movie' ? 'movie' : (isAnime ? 'anime' : 'series'),
      title: mediaType === 'movie' ? item.title : item.name,
      originalTitle: mediaType === 'movie' ? item.original_title : item.original_name,
      description: item.overview || 'Für diesen Titel ist derzeit keine deutsche Beschreibung hinterlegt.',
      releaseDate: date || '',
      posterPath: item.poster_path || null,
      backdropPath: item.backdrop_path || null,
      rating: Number(item.vote_average || 0),
      popularity: Number(item.popularity || 0),
      genreIds: item.genre_ids || [],
      originalLanguage: item.original_language || '',
      services: [service.name],
      serviceLogos: service.logoPath ? { [service.name]: service.logoPath } : {},
      original: null,
      source: 'tmdb'
    };
  }

  function mergeReleases(groups) {
    const merged = new Map();
    groups.flat().forEach(item => {
      const current = merged.get(item.id);
      if (!current) {
        merged.set(item.id, item);
        return;
      }
      item.services.forEach(service => {
        if (!current.services.includes(service)) current.services.push(service);
      });
      current.serviceLogos = { ...current.serviceLogos, ...item.serviceLogos };
    });
    return [...merged.values()];
  }

  async function validateToken(token) {
    await request('/configuration', token);
    return true;
  }

  async function getProviderMap(token) {
    const [movieData, tvData] = await Promise.all([
      request('/watch/providers/movie', token, { language: LANGUAGE, watch_region: REGION }),
      request('/watch/providers/tv', token, { language: LANGUAGE, watch_region: REGION })
    ]);
    return resolveProviderMap(movieData.results || [], tvData.results || []);
  }

  async function loadRadar(token, onProgress) {
    const providerMap = await getProviderMap(token);
    const availableServices = providerMap.filter(service => service.available);
    const jobs = [];

    availableServices.forEach(service => {
      if (service.movieProviderId) jobs.push({ service, mediaType: 'movie' });
      if (service.tvProviderId) jobs.push({ service, mediaType: 'tv' });
    });

    const groups = [];
    let completed = 0;
    const workers = Array.from({ length: Math.min(5, jobs.length) }, async () => {
      while (jobs.length) {
        const job = jobs.shift();
        try {
          groups.push(await discoverForProvider(job.service, job.mediaType, token));
        } catch (error) {
          console.warn(`StreamRadar: ${job.service.name}/${job.mediaType} konnte nicht geladen werden.`, error);
        }
        completed += 1;
        onProgress?.(completed, completed + jobs.length);
      }
    });

    await Promise.all(workers);
    return { releases: mergeReleases(groups), providers: providerMap };
  }

  async function getDetails(mediaType, id, token) {
    const [details, providerData] = await Promise.all([
      request(`/${mediaType}/${id}`, token, { language: LANGUAGE }),
      request(`/${mediaType}/${id}/watch/providers`, token)
    ]);
    const at = providerData.results?.[REGION] || {};
    const streaming = [...(at.flatrate || []), ...(at.free || []), ...(at.ads || [])];
    return {
      ...details,
      providers: streaming,
      watchLink: at.link || null
    };
  }

  function image(path, size = 'w500') {
    return path ? `${IMAGE_BASE}/${size}${path}` : '';
  }

  window.StreamRadarTMDB = {
    REGION,
    LANGUAGE,
    SERVICE_DEFINITIONS,
    validateToken,
    getProviderMap,
    loadRadar,
    getDetails,
    image
  };
})();
