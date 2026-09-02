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
      return {
        ...service,
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
      eventKind: mediaType === 'movie' ? 'movie-premiere' : 'series-premiere',
      eventLabel: mediaType === 'movie' ? 'Film-Premiere' : 'Neue Serie',
      eventSeason: mediaType === 'tv' ? 1 : null,
      eventEpisode: null,
      eventSource: 'tmdb-discover',
      radarEligible: mediaType === 'movie' || inWindow(baseDate),
      source: 'tmdb'
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
          const original = inferOriginalBrand(details);
          const classification = classifyRelease(item, details);
          Object.assign(item, classification, {
            originalBrand: original.brand,
            originalConfidence: original.confidence,
            originalEvidence: original.evidence,
            originalLogoPath: original.logoPath,
            originalLogoSource: original.logoSource,
            original: Boolean(original.brand),
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

  async function getDetails(mediaType, id, token) {
    const [details, providerData] = await Promise.all([
      getCoreDetails(mediaType, id, token),
      request(`/${mediaType}/${id}/watch/providers`, token)
    ]);
    const at = providerData.results?.[REGION] || {};
    const streaming = [...(at.flatrate || []), ...(at.free || []), ...(at.ads || [])];
    const uniqueStreaming = [...new Map(streaming.map(provider => [provider.provider_id, provider])).values()];
    const original = inferOriginalBrand(details);
    const classification = classifyRelease({ mediaType, releaseDate: details.release_date || details.first_air_date || '' }, details);
    return {
      ...details,
      providers: uniqueStreaming,
      watchLink: at.link || null,
      inferredOriginalBrand: original.brand,
      originalConfidence: original.confidence,
      originalEvidence: original.evidence,
      inferredOriginalLogoPath: original.logoPath,
      originalLogoSource: original.logoSource,
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
    SERVICE_DEFINITIONS,
    ORIGINAL_BRANDS,
    MOVIE_RELEASE_TYPES,
    validateToken,
    getProviderMap,
    loadRadar,
    enrichRadarMetadata,
    getDetails,
    getSeasonProviders,
    image
  };
})();