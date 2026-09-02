(() => {
  const VERSION = '0.2.1';
  const isDesktop = Boolean(window.__TAURI_INTERNALS__);

  document.documentElement.dataset.streamradarVersion = VERSION;
  document.documentElement.dataset.streamradarRuntime = isDesktop ? 'desktop' : 'web';

  if (isDesktop) {
    document.body.classList.add('desktop-app');
    const status = document.querySelector('#dataStatus');
    if (status && !document.querySelector('#desktopRuntimeBadge')) {
      const badge = document.createElement('span');
      badge.id = 'desktopRuntimeBadge';
      badge.className = 'desktop-runtime-badge';
      badge.textContent = 'WINDOWS APP';
      badge.title = `StreamRadar Desktop v${VERSION}`;
      status.insertBefore(badge, document.querySelector('#statusAction'));
    }
  }

  window.StreamRadarDesktop = Object.freeze({ version: VERSION, isDesktop });
})();
