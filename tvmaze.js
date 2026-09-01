(() => {
  const API_BASE = 'https://api.tvmaze.com';

  async function request(path) {
    const response = await fetch(`${API_BASE}${path}`, { headers: { accept: 'application/json' } });
    if (!response.ok) {
      const error = new Error(`TVMAZE_${response.status}`);
      error.status = response.status;
      throw error;
    }
    return response.json();
  }

  async function lookupShow(externalIds = {}, title = '') {
    const imdb = externalIds.imdb_id;
    const tvdb = externalIds.tvdb_id;
    if (imdb) {
      try { return await request(`/lookup/shows?imdb=${encodeURIComponent(imdb)}`); } catch (e) { if (e.status !== 404) throw e; }
    }
    if (tvdb) {
      try { return await request(`/lookup/shows?thetvdb=${encodeURIComponent(tvdb)}`); } catch (e) { if (e.status !== 404) throw e; }
    }
    if (!title) return null;
    try { return await request(`/singlesearch/shows?q=${encodeURIComponent(title)}`); } catch (e) { if (e.status === 404) return null; throw e; }
  }

  function toDate(value) {
    if (!value) return null;
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function episodeSummary(episode) {
    if (!episode) return null;
    return {
      id: episode.id,
      name: episode.name || `Episode ${episode.number || ''}`.trim(),
      season: episode.season || null,
      number: episode.number || null,
      airdate: episode.airdate || '',
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
      .filter(ep => {
        const date = toDate(ep.airdate);
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

  window.StreamRadarTVMaze = { getSeriesRadar };
})();