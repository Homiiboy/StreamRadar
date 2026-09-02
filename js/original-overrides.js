(() => {
  const EXACT = {
    // Beispiel für spätere manuelle Korrekturen:
    // 'tv:12345': { action:'force', brand:'FX', originType:'network', qualifiesAsOriginal:true, note:'Manuell bestätigt.' },
    // 'movie:67890': { action:'deny', note:'Produktionsfirma ist kein belastbares Original-Signal.' }
  };

  const TITLE_RULES = [
    // Nur für Fälle verwenden, in denen keine stabile TMDB-ID bekannt ist.
    // { mediaType:'tv', title:'Beispieltitel', action:'force', brand:'HBO', originType:'network', qualifiesAsOriginal:true, note:'Manuell bestätigt.' }
  ];

  function normalizeTitle(value = '') {
    return String(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function getOverride(mediaType, tmdbId, title = '') {
    const exact = EXACT[`${mediaType}:${tmdbId}`];
    if (exact) return { ...exact, source:'manual-id' };
    const normalized = normalizeTitle(title);
    const rule = TITLE_RULES.find(item => item.mediaType === mediaType && normalizeTitle(item.title) === normalized);
    return rule ? { ...rule, source:'manual-title' } : null;
  }

  window.StreamRadarOriginalOverrides = { EXACT, TITLE_RULES, getOverride };

  // v0.5.1 theme layer is loaded here so existing HTML remains backward-compatible.
  if (!document.querySelector('link[data-streamradar-themes]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'themes.css';
    link.dataset.streamradarThemes = 'true';
    document.head.appendChild(link);
  }
  if (!document.querySelector('script[data-streamradar-themes]')) {
    const script = document.createElement('script');
    script.src = 'js/themes.js';
    script.defer = true;
    script.dataset.streamradarThemes = 'true';
    document.head.appendChild(script);
  }
})();
