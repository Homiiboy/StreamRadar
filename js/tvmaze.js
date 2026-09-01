(() => {
  const API_BASE = 'https://api.tvmaze.com';

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  async function request(path, attempt = 0) {
    const response = await fetch(`${API_BASE}${path}`, { headers: { accept: 'application/json' } });
    if (response.status === 429 && attempt < 2) {
      await sleep(900 * (attempt + 1));
      return request(path, attempt + 1);
    }
    if (!response.ok) {
      const error = new Error(`TVMAZE_${response.status}`);
      error.status = response.status;
      throw error;
    }
    return response.json();
  }

  async function lookupShow(externalIds = {}, title = '') {
    const imdb = externalIds.imdb_id || externalIds.imdb;
    const tvdb = externalIds.tvdb_id || externalIds.thetvdb;
    if (imdb) {
      try { return await request(`/lookup/shows?imdb=${encodeURIComponent(imdb)}`); }
      catch (error) { if (error.status !== 404) throw error; }
    }
    if (tvdb) {
      try { return await request(`/lookup/shows?thetvdb=${encodeURIComponent(tvdb)}`); }
      catch (error) { if (error.status !== 404) throw error; }
    }
    if (!title) return null;
    try { return await request(`/singlesearch/shows?q=${encodeURIComponent(title)}`); }
    catch (error) { if (error.status === 404) return null; throw error; }
  }

  function toDate(value) {
    if (!value) return null;
    const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatISO(date) {
    const copy = new Date(date);
    copy.setHours(12, 0, 0, 0);
    return copy.toISOString().slice(0, 10);
  }

  function normalizeTitle(value = '') {
    return String(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function episodeSummary(episode) {
    if (!episode) return null;
    return {
      id: episode.id,
      name: episode.name || `Episode ${episode.number || ''}`.trim(),
      season: episode.season || null,
      number: episode.number || null,
      airdate: episode.airdate || '',
      airtime: episode.airtime || '',
      airstamp: episode.airstamp || null,
      runtime: episode.runtime || null,
      type: episode.type || null,
      image: episode.image?.original || episode.image?.medium || null,
      url: episode.url || null,
      seasonPremiere: episode.number === 1
    };
  }

  async function getSeriesRadar(externalIds = {}, title = '') {
    const show = await lookupShow(externalIds, title);
    if (!show) return null;

    const [details, seasons, episodes] = await Promise.all([
      request(`/shows/${show.id}?embed[]=nextepisode&embed[]=previousepisode`),
      request(`/shows/${show.id}/seasons`),
      request(`/shows/${show.id}/episodes`)
    ]);

    const now = new Date();
    now.setHours(12, 0, 0, 0);
    const futureLimit = new Date(now);
    futureLimit.setDate(futureLimit.getDate() + 120);

    const upcoming = (episodes || [])
      .filter(episode => {
        const date = toDate(episode.airdate);
        return date && date >= now && date <= futureLimit;
      })
      .sort((a, b) => toDate(a.airdate) - toDate(b.airdate))
      .slice(0, 8)
      .map(episodeSummary);

    const embeddedNext = details._embedded?.nextepisode || null;
    const nextEpisode = episodeSummary(embeddedNext) || upcoming[0] || null;
    const previousEpisode = episodeSummary(details._embedded?.previousepisode || null);
    const seasonMap = (seasons || []).map(season => ({
      id: season.id,
      number: season.number,
      premiereDate: season.premiereDate,
      endDate: season.endDate,
      episodeOrder: season.episodeOrder
    }));

    return {
      tvmazeId: show.id,
      url: show.url || details.url || null,
      status: details.status || null,
      network: details.webChannel?.name || details.network?.name || null,
      country: details.webChannel?.country?.code || details.network?.country?.code || null,
      nextEpisode,
      previousEpisode,
      upcoming,
      seasons: seasonMap,
      nextIsNewSeason: Boolean(nextEpisode?.seasonPremiere && nextEpisode?.season && previousEpisode?.season && nextEpisode.season > previousEpisode.season)
    };
  }

  function indexPush(map, key, item) {
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }

  function buildReleaseIndex(releases) {
    const index = new Map();
    releases.filter(item => item.mediaType === 'tv').forEach(item => {
      const external = item.externalIds || {};
      const imdb = external.imdb_id || external.imdb;
      const tvdb = external.tvdb_id || external.thetvdb;
      if (imdb) indexPush(index, `imdb:${String(imdb).toLowerCase()}`, item);
      if (tvdb) indexPush(index, `tvdb:${tvdb}`, item);
      indexPush(index, `title:${normalizeTitle(item.originalTitle || '')}`, item);
      indexPush(index, `title:${normalizeTitle(item.title || '')}`, item);
    });
    return index;
  }

  function pickIndexed(index, keys) {
    for (const key of keys) {
      const matches = key ? index.get(key) : null;
      if (matches?.length) return matches[0];
    }
    return null;
  }

  function matchScheduleShow(show, index) {
    if (!show) return null;
    const imdb = show.externals?.imdb;
    const tvdb = show.externals?.thetvdb;
    return pickIndexed(index, [
      imdb ? `imdb:${String(imdb).toLowerCase()}` : null,
      tvdb ? `tvdb:${tvdb}` : null,
      show.name ? `title:${normalizeTitle(show.name)}` : null
    ]);
  }

  function scheduleDates(pastDays = 1, futureDays = 14) {
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    const result = [];
    for (let offset = -pastDays; offset <= futureDays; offset += 1) {
      const date = new Date(now);
      date.setDate(date.getDate() + offset);
      result.push(formatISO(date));
    }
    return result;
  }

  async function getWebSchedule(date) {
    return request(`/schedule/web?date=${encodeURIComponent(date)}`);
  }

  function eventFromSchedule(entry, base) {
    const show = entry._embedded?.show || entry.show || null;
    const episode = episodeSummary(entry);
    if (!show || !episode?.airdate || !base) return null;

    const season = Number(episode.season || 0) || null;
    const number = Number(episode.number || 0) || null;
    const seriesPremiere = season === 1 && number === 1;
    const seasonPremiere = season > 1 && number === 1;
    const eventKind = seriesPremiere ? 'series-premiere' : seasonPremiere ? 'season-premiere' : 'episode';
    const eventLabel = seriesPremiere ? 'Neue Serie' : seasonPremiere ? `Neue Staffel ${season}` : 'Neue Episode';
    const channel = show.webChannel?.name || show.network?.name || null;

    return {
      ...base,
      id: `${base.entityId || base.id}:tvmaze:${episode.id}`,
      entityId: base.entityId || base.id,
      releaseDate: episode.airdate,
      eventKind,
      eventLabel,
      eventSeason: season,
      eventEpisode: number,
      eventEpisodeName: episode.name || null,
      eventSource: 'tvmaze-web-schedule',
      eventRuntime: episode.runtime || null,
      eventAirtime: episode.airtime || '',
      eventAirstamp: episode.airstamp || null,
      eventChannel: channel,
      tvmazeEpisodeId: episode.id,
      tvmazeUrl: episode.url || show.url || null,
      tvmazeShowId: show.id || null,
      radarEligible: true,
      source: 'tvmaze'
    };
  }

  async function getGlobalEpisodeEvents(releases, onProgress, options = {}) {
    const pastDays = Number.isInteger(options.pastDays) ? options.pastDays : 1;
    const futureDays = Number.isInteger(options.futureDays) ? options.futureDays : 14;
    const maxPerSeries = Number.isInteger(options.maxPerSeries) ? options.maxPerSeries : 4;
    const dates = scheduleDates(pastDays, futureDays);
    const index = buildReleaseIndex(releases);
    const queue = [...dates];
    const events = [];
    const matchedEntities = new Set();
    let completed = 0;
    let errors = 0;

    const workers = Array.from({ length: Math.min(2, queue.length) }, async () => {
      while (queue.length) {
        const date = queue.shift();
        try {
          const schedule = await getWebSchedule(date);
          (schedule || []).forEach(entry => {
            const show = entry._embedded?.show || entry.show || null;
            const base = matchScheduleShow(show, index);
            if (!base) return;
            const event = eventFromSchedule(entry, base);
            if (!event) return;
            matchedEntities.add(String(base.entityId || base.id));
            events.push(event);
          });
        } catch (error) {
          errors += 1;
          console.warn(`StreamRadar: TVmaze-Web-Schedule für ${date} konnte nicht geladen werden.`, error);
        }
        completed += 1;
        onProgress?.(completed, dates.length);
        await sleep(90);
      }
    });

    await Promise.all(workers);

    const byEpisode = new Map();
    events.forEach(event => {
      const key = event.tvmazeEpisodeId ? `episode:${event.tvmazeEpisodeId}` : `${event.entityId}:${event.releaseDate}:${event.eventSeason}:${event.eventEpisode}`;
      if (!byEpisode.has(key)) byEpisode.set(key, event);
    });

    const grouped = new Map();
    [...byEpisode.values()]
      .sort((a, b) => toDate(a.releaseDate) - toDate(b.releaseDate))
      .forEach(event => {
        const key = String(event.entityId || event.id);
        if (!grouped.has(key)) grouped.set(key, []);
        if (grouped.get(key).length < maxPerSeries) grouped.get(key).push(event);
      });

    return {
      events: [...grouped.values()].flat(),
      stats: {
        days: dates.length,
        matchedShows: matchedEntities.size,
        events: [...grouped.values()].reduce((sum, list) => sum + list.length, 0),
        errors
      }
    };
  }

  window.StreamRadarTVMaze = {
    getSeriesRadar,
    getGlobalEpisodeEvents
  };
})();