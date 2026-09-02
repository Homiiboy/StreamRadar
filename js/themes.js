/* StreamRadar v0.5.2 — selectable visual themes */
(() => {
  const VERSION = '0.5.2';
  const STORAGE_KEY = 'streamradar-theme-v1';
  const ORDER = ['radar', 'cinema', 'midnight', 'oled', 'netflix', 'cyberpunk', 'glass'];
  const THEMES = Object.freeze({
    radar: {
      name: 'Radar',
      description: 'Der klare StreamRadar-Look mit Mint-Akzent.',
      metaColor: '#0b0f14'
    },
    cinema: {
      name: 'Cinema',
      description: 'Dunkler Kino-Look mit warmem Rot und kräftigeren Kontrasten.',
      metaColor: '#0b0809'
    },
    midnight: {
      name: 'Midnight',
      description: 'Tiefes Navy mit Blau-Violett und weicherem Glass-Look.',
      metaColor: '#080b14'
    },
    oled: {
      name: 'OLED',
      description: 'Nahezu reines Schwarz, reduziert und besonders ruhig.',
      metaColor: '#000000'
    },
    netflix: {
      name: 'Netflix',
      description: 'Streaming-Look in Schwarz und Rot mit kompakten Flächen und starkem Fokus auf Poster.',
      metaColor: '#080808'
    },
    cyberpunk: {
      name: 'Cyberpunk',
      description: 'Neon-Cyan, Magenta, härtere Kanten und futuristische Akzente.',
      metaColor: '#02070a'
    },
    glass: {
      name: 'Apple TV Glass',
      description: 'Große Radien, transparente Flächen und ein ruhiger Frosted-Glass-Look.',
      metaColor: '#09101b'
    }
  });

  function normalizeTheme(value) {
    return THEMES[value] ? value : 'radar';
  }

  function currentTheme() {
    return normalizeTheme(localStorage.getItem(STORAGE_KEY) || document.documentElement.dataset.streamradarTheme);
  }

  function patchVersionSurface() {
    document.documentElement.dataset.streamradarVersion = VERSION;
    window.StreamRadarVersion = VERSION;

    document.querySelectorAll('.footer-meta span').forEach(node => {
      if (/^Version\s+/i.test(node.textContent || '') && node.textContent !== `Version ${VERSION}`) {
        node.textContent = `Version ${VERSION}`;
      }
    });

    document.querySelectorAll('.about-version-card strong').forEach(node => {
      const current = node.textContent || '';
      const next = current.replace(/StreamRadar\s+\d+\.\d+\.\d+/i, `StreamRadar ${VERSION}`);
      if (next !== current) node.textContent = next;
    });
  }

  function syncThemeControls(theme) {
    document.querySelectorAll('[data-theme-option]').forEach(button => {
      const active = button.dataset.themeOption === theme;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
      const state = button.querySelector('.theme-option-state');
      const label = active ? 'Aktiv' : 'Auswählen';
      if (state && state.textContent !== label) state.textContent = label;
    });

    const pulse = document.querySelector('#themePulse');
    if (pulse) {
      const data = THEMES[theme];
      pulse.title = `Design: ${data.name} · klicken zum Wechseln`;
      pulse.setAttribute('aria-label', `Aktuelles Design ${data.name}. Nächstes Design auswählen.`);
    }
  }

  function applyTheme(theme, { persist = true, announce = false } = {}) {
    const next = normalizeTheme(theme);
    document.documentElement.dataset.streamradarTheme = next;
    if (document.body) document.body.dataset.streamradarTheme = next;
    if (persist) localStorage.setItem(STORAGE_KEY, next);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEMES[next].metaColor);

    syncThemeControls(next);
    patchVersionSurface();

    window.dispatchEvent(new CustomEvent('streamradar:theme-change', {
      detail: { id: next, ...THEMES[next] }
    }));

    if (announce) {
      const live = document.querySelector('#streamradarThemeLive');
      if (live) live.textContent = `Design ${THEMES[next].name} aktiviert.`;
    }

    return next;
  }

  function themePreview(theme) {
    return `<span class="theme-preview theme-preview-${theme}" aria-hidden="true">
      <i class="theme-preview-sidebar"></i>
      <i class="theme-preview-hero"></i>
      <i class="theme-preview-poster one"></i>
      <i class="theme-preview-poster two"></i>
      <i class="theme-preview-accent"></i>
    </span>`;
  }

  function ensureSettingsThemePicker() {
    const page = document.querySelector('.settings-page[data-settings-page="general"]');
    if (!page || page.querySelector('#streamradarThemeSettings')) return;

    const group = document.createElement('div');
    group.id = 'streamradarThemeSettings';
    group.className = 'settings-group theme-settings-group';
    group.innerHTML = `<div class="theme-settings-head">
        <div><h3>Design</h3><p>Wähle den Look von StreamRadar. Die Änderung wird sofort angewendet und auf diesem Gerät gespeichert.</p></div>
        <span class="theme-live" id="streamradarThemeLive" aria-live="polite"></span>
      </div>
      <div class="theme-option-grid">
        ${ORDER.map(id => {
          const theme = THEMES[id];
          return `<button type="button" class="theme-option" data-theme-option="${id}" aria-pressed="false">
            ${themePreview(id)}
            <span class="theme-option-copy"><strong>${theme.name}</strong><small>${theme.description}</small></span>
            <span class="theme-option-state">Auswählen</span>
          </button>`;
        }).join('')}
      </div>`;

    const firstGroup = page.querySelector('.settings-group');
    if (firstGroup?.nextSibling) page.insertBefore(group, firstGroup.nextSibling);
    else page.appendChild(group);

    group.querySelectorAll('[data-theme-option]').forEach(button => {
      button.addEventListener('click', () => applyTheme(button.dataset.themeOption, { announce: true }));
    });

    syncThemeControls(currentTheme());
  }

  function installThemePulse() {
    const button = document.querySelector('#themePulse');
    if (!button || button.dataset.themeCycleInstalled === 'true') return;
    button.dataset.themeCycleInstalled = 'true';
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const active = currentTheme();
      const index = ORDER.indexOf(active);
      applyTheme(ORDER[(index + 1) % ORDER.length], { announce: true });
    }, true);
  }

  function refreshInjectedSurface() {
    ensureSettingsThemePicker();
    installThemePulse();
    syncThemeControls(currentTheme());
    patchVersionSurface();
  }

  applyTheme(currentTheme(), { persist: false });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refreshInjectedSurface, { once: true });
  } else {
    refreshInjectedSurface();
  }

  const observer = new MutationObserver(refreshInjectedSurface);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY) applyTheme(event.newValue, { persist: false });
  });

  window.StreamRadarThemes = Object.freeze({
    version: VERSION,
    themes: THEMES,
    getTheme: currentTheme,
    setTheme: theme => applyTheme(theme)
  });
})();
