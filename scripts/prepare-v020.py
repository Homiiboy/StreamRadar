from pathlib import Path
import json
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def write(path, text):
    (ROOT / path).write_text(text, encoding='utf-8')


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'Missing expected text for {label}')
    return text.replace(old, new, 1)

# Archive the last stable consolidated runtime before changing the active files.
(ROOT / 'OldCss').mkdir(exist_ok=True)
(ROOT / 'OldUi').mkdir(exist_ok=True)
shutil.copyfile(ROOT / 'styles.css', ROOT / 'OldCss' / 'styles-v0.1.2.css')
shutil.copyfile(ROOT / 'ui.js', ROOT / 'OldUi' / 'ui-v0.1.2.js')

css = r'''

/* ================================================================
   StreamRadar v0.2.0 — Personalization & Settings
   ================================================================ */

body[data-density="compact"] .shell{width:min(1480px,calc(100% - 38px))}
body[data-density="compact"] .media-rail{margin-top:22px}
body[data-density="compact"] .rail-track{grid-auto-columns:minmax(215px,260px);gap:12px}
body[data-density="compact"] .release-grid{gap:14px}
body[data-density="compact"] .release-card{min-height:0}

.settings-dialog.v020-settings{width:min(1120px,calc(100vw - 34px));max-width:none;padding:0;overflow:hidden;background:#090c12;border:1px solid rgba(255,255,255,.11)}
.settings-dialog.v020-settings::backdrop{background:rgba(0,0,0,.74);backdrop-filter:blur(14px)}
.settings-dialog.v020-settings .dialog-close{z-index:6;top:18px;right:18px}
.settings-center{display:grid;grid-template-columns:245px minmax(0,1fr);min-height:660px}
.settings-nav{padding:30px 18px 24px;border-right:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,rgba(98,247,199,.055),transparent 28%),#080b10}
.settings-nav-brand{padding:0 12px 28px}
.settings-nav-brand strong{display:block;font:700 20px/1.1 "Space Grotesk",sans-serif}
.settings-nav-brand span{display:block;margin-top:6px;color:var(--muted);font-size:11px;letter-spacing:.16em}
.settings-tabs{display:grid;gap:5px}
.settings-tab{display:flex;align-items:center;gap:11px;width:100%;min-height:44px;padding:0 12px;border:1px solid transparent;border-radius:11px;background:transparent;color:var(--muted);font:600 13px/1 Inter,sans-serif;text-align:left;cursor:pointer}
.settings-tab svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8}
.settings-tab:hover{color:#fff;background:rgba(255,255,255,.045)}
.settings-tab.active{color:#fff;border-color:rgba(98,247,199,.2);background:linear-gradient(90deg,rgba(98,247,199,.12),rgba(98,247,199,.025))}
.settings-nav-foot{margin:28px 12px 0;padding-top:20px;border-top:1px solid rgba(255,255,255,.08);color:var(--muted);font-size:11px;line-height:1.6}
.settings-main{min-width:0;padding:42px 42px 34px;overflow:auto;max-height:min(760px,88vh)}
.settings-page{display:none;animation:v020Fade .18s ease}
.settings-page.active{display:block}
@keyframes v020Fade{from{opacity:.35;transform:translateY(3px)}to{opacity:1;transform:none}}
.settings-page-head{margin-bottom:28px;padding-right:34px}
.settings-page-head h2{margin:5px 0 8px;font:700 clamp(27px,3vw,38px)/1.05 "Space Grotesk",sans-serif}
.settings-page-head p{max-width:710px;margin:0;color:var(--muted);line-height:1.65}
.settings-group{padding:20px 0;border-top:1px solid rgba(255,255,255,.08)}
.settings-group:first-of-type{border-top:0}
.settings-group h3{margin:0 0 6px;font:700 15px/1.2 Inter,sans-serif}
.settings-group>p{margin:0 0 16px;color:var(--muted);font-size:13px;line-height:1.55}
.setting-row{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:14px 0}
.setting-row+.setting-row{border-top:1px solid rgba(255,255,255,.055)}
.setting-copy strong{display:block;font-size:13px}
.setting-copy span{display:block;margin-top:4px;color:var(--muted);font-size:12px;line-height:1.45}
.setting-select{min-width:190px;height:39px;padding:0 34px 0 12px;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:#0d1118;color:#fff}
.setting-switch{position:relative;display:inline-flex;width:44px;height:24px;flex:0 0 auto}
.setting-switch input{position:absolute;opacity:0;pointer-events:none}
.setting-switch span{width:44px;height:24px;border-radius:999px;background:#242a34;border:1px solid rgba(255,255,255,.1);transition:.18s}
.setting-switch span::after{content:"";position:absolute;top:4px;left:4px;width:16px;height:16px;border-radius:50%;background:#c7ced8;transition:.18s}
.setting-switch input:checked+span{background:rgba(98,247,199,.25);border-color:rgba(98,247,199,.4)}
.setting-switch input:checked+span::after{transform:translateX(20px);background:var(--accent)}
.pref-chip-grid{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}
.pref-chip{position:relative;display:inline-flex}
.pref-chip input{position:absolute;opacity:0}
.pref-chip span{display:flex;align-items:center;gap:8px;min-height:39px;padding:0 14px;border:1px solid rgba(255,255,255,.11);border-radius:999px;background:#0d1118;color:var(--muted);font-size:12px;font-weight:650;cursor:pointer}
.pref-chip input:checked+span{color:#fff;border-color:rgba(98,247,199,.42);background:rgba(98,247,199,.11);box-shadow:inset 0 0 0 1px rgba(98,247,199,.07)}
.settings-provider-actions{display:flex;gap:8px;margin-bottom:14px}
.settings-provider-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
.settings-provider{display:flex;align-items:center;gap:10px;min-height:54px;padding:9px 11px;border:1px solid rgba(255,255,255,.09);border-radius:12px;background:rgba(255,255,255,.025);cursor:pointer}
.settings-provider:hover{border-color:rgba(255,255,255,.18)}
.settings-provider:has(input:checked){border-color:rgba(98,247,199,.32);background:rgba(98,247,199,.07)}
.settings-provider img,.settings-provider i{width:30px;height:30px;border-radius:8px;object-fit:contain;background:#fff}
.settings-provider i{background:linear-gradient(135deg,#27303a,#11151b)}
.settings-provider span{min-width:0;flex:1;font-size:12px;font-weight:650}
.settings-provider input{accent-color:var(--accent)}
.token-inline{display:grid;grid-template-columns:1fr auto;gap:9px;margin-top:12px}
.token-inline input{height:42px;padding:0 13px;border:1px solid rgba(255,255,255,.13);border-radius:10px;background:#0a0e14;color:#fff;min-width:0}
.settings-inline-status{min-height:18px;margin-top:8px;color:var(--muted);font-size:12px}
.settings-inline-status.success{color:var(--accent)}
.settings-inline-status.warning{color:#ffb968}
.backup-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}
.backup-card{padding:18px;border:1px solid rgba(255,255,255,.09);border-radius:14px;background:rgba(255,255,255,.025)}
.backup-card strong{display:block;margin-bottom:5px;font-size:13px}
.backup-card p{min-height:38px;margin:0 0 14px;color:var(--muted);font-size:12px;line-height:1.5}
.about-version-card{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center;margin-top:18px;padding:20px;border:1px solid rgba(98,247,199,.16);border-radius:16px;background:linear-gradient(135deg,rgba(98,247,199,.08),rgba(124,109,255,.045))}
.about-version-mark{display:grid;place-items:center;width:54px;height:54px;border-radius:16px;border:1px solid rgba(98,247,199,.25);font:800 18px "Space Grotesk";color:var(--accent);background:#0a0e13}
.about-version-card strong{display:block;font-size:17px}
.about-version-card span{display:block;margin-top:4px;color:var(--muted);font-size:12px}

.v020-personal-rail{position:relative}
.v020-personal-rail .rail-heading h2::after{content:" FÜR DICH";display:inline-flex;margin-left:10px;vertical-align:middle;padding:4px 7px;border-radius:999px;background:rgba(98,247,199,.1);color:var(--accent);font:700 9px/1 Inter;letter-spacing:.1em}
.personal-score{position:absolute;top:9px;left:9px;z-index:3;padding:4px 7px;border-radius:999px;background:rgba(7,9,13,.78);border:1px solid rgba(255,255,255,.12);font-size:9px;font-weight:800;letter-spacing:.08em;backdrop-filter:blur(8px)}
.personalization-summary{display:flex;align-items:center;gap:8px;margin-top:13px;color:var(--muted);font-size:11px}
.personalization-summary b{color:var(--accent)}

.onboarding-overlay{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 25% 15%,rgba(98,247,199,.12),transparent 28%),rgba(3,5,8,.92);backdrop-filter:blur(18px)}
.onboarding-card{width:min(920px,100%);min-height:580px;display:grid;grid-template-columns:220px minmax(0,1fr);overflow:hidden;border:1px solid rgba(255,255,255,.13);border-radius:24px;background:#090d13;box-shadow:0 35px 100px rgba(0,0,0,.55)}
.onboarding-aside{padding:32px 24px;background:linear-gradient(180deg,rgba(98,247,199,.09),transparent 42%),#070a0f;border-right:1px solid rgba(255,255,255,.08)}
.onboarding-logo{font:800 22px "Space Grotesk";letter-spacing:-.02em}
.onboarding-logo span{color:var(--accent)}
.onboarding-progress{display:grid;gap:14px;margin-top:46px}
.onboarding-progress div{display:flex;align-items:center;gap:10px;color:#5e6672;font-size:11px;font-weight:700}
.onboarding-progress i{display:grid;place-items:center;width:25px;height:25px;border-radius:50%;border:1px solid #303844;font-style:normal;font-size:10px}
.onboarding-progress div.active{color:#fff}.onboarding-progress div.active i,.onboarding-progress div.done i{border-color:rgba(98,247,199,.55);background:rgba(98,247,199,.12);color:var(--accent)}
.onboarding-main{display:flex;flex-direction:column;min-width:0;padding:46px 48px 32px}
.onboarding-step{display:none;flex:1}.onboarding-step.active{display:block;animation:v020Fade .2s ease}
.onboarding-step h1{margin:7px 0 12px;font:700 clamp(34px,5vw,54px)/.98 "Space Grotesk";letter-spacing:-.045em}
.onboarding-step h1 span{color:var(--accent)}
.onboarding-step>p{max-width:620px;color:var(--muted);font-size:14px;line-height:1.7}
.onboarding-feature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:28px}
.onboarding-feature{padding:16px;border:1px solid rgba(255,255,255,.08);border-radius:13px;background:rgba(255,255,255,.025)}
.onboarding-feature strong{display:block;font-size:12px}.onboarding-feature span{display:block;margin-top:5px;color:var(--muted);font-size:11px;line-height:1.45}
.onboarding-provider-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;max-height:290px;overflow:auto;margin-top:20px;padding-right:5px}
.onboarding-actions{display:flex;justify-content:space-between;align-items:center;gap:12px;padding-top:28px;border-top:1px solid rgba(255,255,255,.07)}
.onboarding-actions-right{display:flex;gap:9px}
.onboarding-token{margin-top:24px}
.onboarding-token input{width:100%;height:46px;padding:0 14px;border:1px solid rgba(255,255,255,.13);border-radius:11px;background:#070b10;color:#fff}
.onboarding-hint{margin-top:8px;color:var(--muted);font-size:11px;line-height:1.5}
.onboarding-error{min-height:18px;margin-top:9px;color:#ff9b8d;font-size:11px}

@media(max-width:840px){
  .settings-center{grid-template-columns:1fr}.settings-nav{border-right:0;border-bottom:1px solid rgba(255,255,255,.08);padding:20px}.settings-nav-brand{padding-bottom:14px}.settings-tabs{grid-template-columns:repeat(5,1fr);overflow:auto}.settings-tab{justify-content:center;padding:0 9px}.settings-tab span{display:none}.settings-nav-foot{display:none}.settings-main{padding:28px 22px}.settings-provider-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .onboarding-card{grid-template-columns:1fr}.onboarding-aside{padding:20px 24px;border-right:0;border-bottom:1px solid rgba(255,255,255,.08)}.onboarding-progress{grid-template-columns:repeat(4,1fr);margin-top:18px}.onboarding-progress div{justify-content:center}.onboarding-progress span{display:none}.onboarding-main{padding:30px 26px 24px}.onboarding-feature-grid{grid-template-columns:1fr}.onboarding-provider-grid{grid-template-columns:repeat(2,1fr)}
}
@media(max-width:560px){.settings-provider-grid,.backup-grid,.onboarding-provider-grid{grid-template-columns:1fr}.setting-row{align-items:flex-start;flex-direction:column;gap:10px}.setting-select{width:100%}.token-inline{grid-template-columns:1fr}.onboarding-main{padding:26px 20px 20px}.onboarding-step h1{font-size:36px}}
'''

js = r'''

/* StreamRadar v0.2.0 — Personalization & Settings */
(() => {
  const VERSION = '0.2.0';
  const CONFIG_KEY = 'streamradar-personalization-v2';
  const ONBOARDING_KEY = 'streamradar-onboarding-v2-complete';
  const LAST_VIEW_KEY = 'streamradar-last-view-v2';
  const TOKEN_STORAGE_KEY = 'streamradar-tmdb-token';
  const PROVIDERS_STORAGE_KEY = 'streamradar-preferred-providers';
  const PROVIDERS_ONLY_STORAGE_KEY = 'streamradar-preferred-providers-only';
  const defaultConfig = {
    rememberLastView: true,
    defaultView: 'discover',
    density: 'comfortable',
    mediaPreferences: ['movie', 'series', 'anime'],
    originalsBoost: true,
    showEpisodesHome: true,
    horizonDays: 30
  };
  let config = loadConfig();
  let settingsTab = 'general';
  const baseRenderReleases = renderReleases;
  const baseSetView = setView;

  const ICONS = {
    general:'<svg viewBox="0 0 24 24"><path d="M4 5h16M4 12h16M4 19h16"/><circle cx="8" cy="5" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="10" cy="19" r="2"/></svg>',
    providers:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3z"/></svg>',
    content:'<svg viewBox="0 0 24 24"><path d="M12 3 5 7v10l7 4 7-4V7z"/><path d="m8 10 4 2 4-2M12 12v5"/></svg>',
    data:'<svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>',
    about:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></svg>'
  };

  function loadConfig() {
    const saved = safeJSON(localStorage.getItem(CONFIG_KEY) || '{}', {});
    const merged = { ...defaultConfig, ...(saved && typeof saved === 'object' ? saved : {}) };
    merged.mediaPreferences = Array.isArray(merged.mediaPreferences) && merged.mediaPreferences.length ? merged.mediaPreferences.filter(value => ['movie','series','anime'].includes(value)) : [...defaultConfig.mediaPreferences];
    if (!['comfortable','compact'].includes(merged.density)) merged.density = 'comfortable';
    if (!['discover','calendar','upcoming','watchlist'].includes(merged.defaultView)) merged.defaultView = 'discover';
    if (![14,30,60,90].includes(Number(merged.horizonDays))) merged.horizonDays = 30;
    return merged;
  }

  function persistConfig({ render = true } = {}) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    applyConfigSurface();
    if (render) renderReleases();
  }

  function applyConfigSurface() {
    document.body.dataset.density = config.density;
    document.documentElement.dataset.streamradarVersion = VERSION;
    window.StreamRadarVersion = VERSION;
  }

  function providerNames() {
    return window.StreamRadarStability?.getAllProviders?.() || tmdb.SERVICE_DEFINITIONS.map(service => service.name);
  }

  function preferredProviders() {
    return window.StreamRadarStability?.getPreferredProviders?.() || safeJSON(localStorage.getItem(PROVIDERS_STORAGE_KEY) || '[]', []);
  }

  function providerLogo(name) {
    try {
      const provider = providerFor(name);
      return provider?.logoPath || provider?.logo_path || '';
    } catch {
      const service = tmdb.SERVICE_DEFINITIONS.find(item => item.name === name);
      return service?.logoPath || '';
    }
  }

  function setProviders(names, rerender = true) {
    const api = window.StreamRadarStability;
    if (api?.setPreferredProviders) api.setPreferredProviders(names, { render:rerender });
    else {
      localStorage.setItem(PROVIDERS_STORAGE_KEY, JSON.stringify(names));
      if (rerender) renderReleases();
    }
  }

  function setProvidersOnly(value, rerender = true) {
    const api = window.StreamRadarStability;
    if (api?.setPreferredProvidersOnly) api.setPreferredProvidersOnly(Boolean(value), { render:rerender });
    else {
      localStorage.setItem(PROVIDERS_ONLY_STORAGE_KEY, String(Boolean(value)));
      if (rerender) renderReleases();
    }
  }

  function providersOnly() {
    return window.StreamRadarStability?.isPreferredProvidersOnly?.() ?? localStorage.getItem(PROVIDERS_ONLY_STORAGE_KEY) === 'true';
  }

  function personalScore(item) {
    let score = 0;
    const prefs = new Set(config.mediaPreferences);
    const preferred = new Set(preferredProviders());
    if ((item.services || []).some(service => preferred.has(service))) score += 42;
    if (prefs.has(item.type)) score += 25;
    if (config.originalsBoost && item.original) score += 18;
    if (state.watchlist.has(watchKey(item))) score += 9;
    const distance = dayDistance(item.releaseDate);
    if (distance >= 0 && distance <= 7) score += 18 - distance * 2;
    else if (distance > 7 && distance <= config.horizonDays) score += Math.max(2, 12 - Math.floor(distance / 5));
    score += Math.min(12, Math.round((item.popularity || 0) / 20));
    return score;
  }

  function personalSource() {
    const selected = new Set(config.mediaPreferences);
    const horizon = Number(config.horizonDays) || 30;
    return state.releases
      .filter(item => item.radarEligible !== false)
      .filter(item => selected.has(item.type))
      .filter(item => config.showEpisodesHome || item.eventKind !== 'episode')
      .filter(item => dayDistance(item.releaseDate) >= -2 && dayDistance(item.releaseDate) <= horizon)
      .map(item => ({ item, score:personalScore(item) }))
      .sort((a,b) => b.score - a.score || sortByRadarRelevance(a.item,b.item));
  }

  function personalCard(entry) {
    const item = entry.item;
    const path = item.backdropPath || item.posterPath;
    const art = path ? `<img src="${tmdb.image(path, item.backdropPath ? 'w780' : 'w500')}" alt="" loading="lazy"/>` : `<span class="rail-monogram">${escapeHTML(item.title.slice(0,2))}</span>`;
    return `<article class="rail-card v020-personal-card" tabindex="0" role="button" data-v020-id="${escapeHTML(item.id)}" style="--rail-accent:${item.accent}"><div class="rail-art">${art}<span class="rail-gradient"></span><span class="personal-score">MATCH ${Math.min(99, Math.max(50, entry.score))}</span><span class="rail-event">${escapeHTML(eventLabel(item))}</span></div><div class="rail-copy"><strong>${escapeHTML(item.title)}</strong><span>${escapeHTML(item.services?.[0] || item.originalBrand || 'Streaming')} · ${escapeHTML(formatReleaseDate(item.releaseDate))}</span></div></article>`;
  }

  function renderPersonalizedHome() {
    const root = $('#homeRails');
    if (!root || state.view !== 'discover') return;
    root.querySelectorAll('.v020-personal-rail').forEach(node => node.remove());
    const blocked = Boolean($('#searchInput')?.value.trim() || $('#typeFilter')?.value !== 'all' || $('#eventFilter')?.value !== 'all' || $('#periodFilter')?.value !== 'all' || $('#brandFilter')?.value !== 'all' || $('#originalsOnly')?.checked || state.service !== 'all');
    if (blocked) return;
    const scored = personalSource();
    if (!scored.length) return;
    const preferred = new Set(preferredProviders());
    const forYou = scored.slice(0, 12);
    const atProviders = scored.filter(entry => (entry.item.services || []).some(service => preferred.has(service))).slice(0, 12);
    const selectedText = config.mediaPreferences.map(type => ({movie:'Filme',series:'Serien',anime:'Anime'})[type]).join(' · ');
    const rows = [`<section class="media-rail v020-personal-rail"><div class="rail-heading"><div><span class="section-kicker">PERSONALISIERT</span><h2>Dein Radar-Mix</h2><div class="personalization-summary"><b>${preferred.size}</b> Anbieter · ${escapeHTML(selectedText)} · ${config.originalsBoost ? 'Originals priorisiert' : 'neutrale Herkunft'}</div></div></div><div class="rail-track">${forYou.map(personalCard).join('')}</div></section>`];
    if (atProviders.length && preferred.size < providerNames().length) rows.push(`<section class="media-rail v020-personal-rail"><div class="rail-heading"><div><span class="section-kicker">DEINE ANBIETER</span><h2>Bei deinen Diensten</h2></div></div><div class="rail-track">${atProviders.map(personalCard).join('')}</div></section>`);
    const newSince = root.querySelector('.new-since-rail');
    if (newSince) newSince.insertAdjacentHTML('afterend', rows.join(''));
    else root.insertAdjacentHTML('afterbegin', rows.join(''));
    root.querySelectorAll('.v020-personal-card').forEach(card => {
      card.onclick = () => openDetails(card.dataset.v020Id);
      card.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openDetails(card.dataset.v020Id); } };
    });
  }

  function notify(message, type = 'info') {
    let root = $('#toastStack');
    if (!root) {
      root = document.createElement('div'); root.id = 'toastStack'; root.className = 'toast-stack'; document.body.appendChild(root);
    }
    const toast = document.createElement('div'); toast.className = `radar-toast ${type}`; toast.textContent = message; root.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 220); }, 3200);
  }

  function providerGridMarkup(scope = 'settings') {
    const selected = new Set(preferredProviders());
    return providerNames().map(name => {
      const logo = providerLogo(name);
      return `<label class="settings-provider ${scope === 'onboarding' ? 'onboarding-provider' : ''}">${logo ? `<img src="${tmdb.image(logo,'w92')}" alt="" loading="lazy"/>` : '<i></i>'}<span>${escapeHTML(name)}</span><input type="checkbox" value="${escapeHTML(name)}" ${selected.has(name) ? 'checked' : ''}/></label>`;
    }).join('');
  }

  function settingsMarkup() {
    return `<div class="settings-center">
      <aside class="settings-nav"><div class="settings-nav-brand"><strong>StreamRadar</strong><span>PERSONALIZATION CENTER</span></div><nav class="settings-tabs">
        <button class="settings-tab" data-settings-tab="general">${ICONS.general}<span>Allgemein</span></button>
        <button class="settings-tab" data-settings-tab="providers">${ICONS.providers}<span>Anbieter</span></button>
        <button class="settings-tab" data-settings-tab="content">${ICONS.content}<span>Inhalte</span></button>
        <button class="settings-tab" data-settings-tab="data">${ICONS.data}<span>Daten & Backup</span></button>
        <button class="settings-tab" data-settings-tab="about">${ICONS.about}<span>Über</span></button>
      </nav><div class="settings-nav-foot">Einstellungen werden lokal auf diesem Gerät gespeichert.<br/>Version ${VERSION}</div></aside>
      <div class="settings-main">
        <section class="settings-page" data-settings-page="general"><div class="settings-page-head"><span class="section-kicker">ALLGEMEIN</span><h2>StreamRadar für dich</h2><p>Lege fest, wie die Desktop-App startet und wie dicht Informationen dargestellt werden.</p></div>
          <div class="settings-group"><div class="setting-row"><div class="setting-copy"><strong>Letzte Ansicht merken</strong><span>Öffnet StreamRadar dort, wo du zuletzt gearbeitet hast.</span></div><label class="setting-switch"><input id="prefRememberView" type="checkbox" ${config.rememberLastView?'checked':''}/><span></span></label></div>
          <div class="setting-row"><div class="setting-copy"><strong>Standardansicht</strong><span>Wird verwendet, wenn die letzte Ansicht nicht gemerkt wird.</span></div><select class="setting-select" id="prefDefaultView"><option value="discover">Entdecken</option><option value="calendar">Kalender</option><option value="upcoming">Demnächst</option><option value="watchlist">Merkliste</option></select></div>
          <div class="setting-row"><div class="setting-copy"><strong>Informationsdichte</strong><span>Kompakt zeigt mehr Inhalte gleichzeitig.</span></div><select class="setting-select" id="prefDensity"><option value="comfortable">Komfortabel</option><option value="compact">Kompakt</option></select></div></div>
        </section>
        <section class="settings-page" data-settings-page="providers"><div class="settings-page-head"><span class="section-kicker">MEINE ANBIETER</span><h2>Deine Streaming-Dienste</h2><p>Diese Auswahl fließt in deinen persönlichen Home-Feed ein und kann den gesamten Radar auf abonnierte Dienste begrenzen.</p></div><div class="settings-group"><div class="setting-row"><div class="setting-copy"><strong>Nur meine Anbieter im Radar</strong><span>Blendet andere Streaming-Dienste aus Feed und Kalender aus.</span></div><label class="setting-switch"><input id="settingsProvidersOnly" type="checkbox" ${providersOnly()?'checked':''}/><span></span></label></div><div class="settings-provider-actions"><button class="text-button" id="settingsProvidersAll">Alle wählen</button><button class="text-button" id="settingsProvidersNone">Keine wählen</button></div><div class="settings-provider-grid" id="settingsProviderGrid">${providerGridMarkup()}</div></div></section>
        <section class="settings-page" data-settings-page="content"><div class="settings-page-head"><span class="section-kicker">INHALTE</span><h2>Was soll wichtiger sein?</h2><p>Diese Präferenzen verändern die Gewichtung auf der Startseite, ohne Inhalte aus der Datenbank zu löschen.</p></div><div class="settings-group"><h3>Medienarten</h3><p>Wähle mindestens eine Medienart für deinen persönlichen Mix.</p><div class="pref-chip-grid"><label class="pref-chip"><input type="checkbox" data-media-pref="movie" ${config.mediaPreferences.includes('movie')?'checked':''}/><span>🎬 Filme</span></label><label class="pref-chip"><input type="checkbox" data-media-pref="series" ${config.mediaPreferences.includes('series')?'checked':''}/><span>▣ Serien</span></label><label class="pref-chip"><input type="checkbox" data-media-pref="anime" ${config.mediaPreferences.includes('anime')?'checked':''}/><span>◈ Anime</span></label></div></div><div class="settings-group"><div class="setting-row"><div class="setting-copy"><strong>Originals stärker gewichten</strong><span>Originals deiner bevorzugten Plattformen bekommen mehr Relevanz.</span></div><label class="setting-switch"><input id="prefOriginalsBoost" type="checkbox" ${config.originalsBoost?'checked':''}/><span></span></label></div><div class="setting-row"><div class="setting-copy"><strong>Episoden auf Home anzeigen</strong><span>Deaktivieren, wenn Home stärker auf Filme und Staffelstarts fokussieren soll.</span></div><label class="setting-switch"><input id="prefEpisodesHome" type="checkbox" ${config.showEpisodesHome?'checked':''}/><span></span></label></div><div class="setting-row"><div class="setting-copy"><strong>Persönlicher Zeitraum</strong><span>Wie weit der „Für dich“-Mix in die Zukunft schauen soll.</span></div><select class="setting-select" id="prefHorizon"><option value="14">14 Tage</option><option value="30">30 Tage</option><option value="60">60 Tage</option><option value="90">90 Tage</option></select></div></div></section>
        <section class="settings-page" data-settings-page="data"><div class="settings-page-head"><span class="section-kicker">DATEN & BACKUP</span><h2>Verbindung und Sicherung</h2><p>TMDB bleibt lokal verbunden. Backups enthalten bewusst keinen API-Token.</p></div><div class="settings-group"><h3>TMDB API Read Access Token</h3><p>Der Token wird nur im lokalen Browser-/App-Speicher hinterlegt.</p><div class="token-inline"><input type="password" id="tmdbToken" placeholder="eyJhbGciOiJIUzI1NiJ9…" autocomplete="off" spellcheck="false"/><button class="primary-button" id="saveToken">Verbinden</button></div><div class="settings-inline-status" id="settingsStatus"></div><button class="text-button" id="clearToken" type="button">Token entfernen</button></div><div class="settings-group"><h3>StreamRadar Backup</h3><p>Exportiert Personalisierung, Anbieter und Merkliste in eine portable JSON-Datei. Der TMDB-Token ist ausgeschlossen.</p><div class="backup-grid"><div class="backup-card"><strong>Backup exportieren</strong><p>Für Umzug, Neuinstallation oder Versionswechsel.</p><button class="ghost-button" id="exportStreamRadarBackup">Backup speichern</button></div><div class="backup-card"><strong>Backup importieren</strong><p>Stellt Einstellungen und Merkliste aus einem StreamRadar-Backup wieder her.</p><button class="ghost-button" id="importStreamRadarBackup">Backup auswählen</button><input type="file" id="streamRadarBackupFile" accept="application/json,.json" hidden/></div></div></div></section>
        <section class="settings-page" data-settings-page="about"><div class="settings-page-head"><span class="section-kicker">ÜBER STREAMRADAR</span><h2>Personal Streaming Release Intelligence</h2><p>Privater Release-Radar für Österreich mit TMDB, JustWatch-Providern und TVmaze-Schedule.</p></div><div class="about-version-card"><div class="about-version-mark">SR</div><div><strong>StreamRadar ${VERSION}</strong><span>Personalization & Settings · Windows Desktop / Web</span></div></div><div class="settings-group"><div class="setting-row"><div class="setting-copy"><strong>Aktive UI-Dateien</strong><span>styles.css + ui.js · historische Snapshots liegen ausschließlich im Archiv.</span></div></div><div class="setting-row"><div class="setting-copy"><strong>Datenregion</strong><span>Österreich (AT) · Sprache de-DE/de-AT.</span></div></div><div class="setting-row"><div class="setting-copy"><strong>Installer</strong><span>Windows x64 MSI · für persönliche Nutzung aktuell unsigniert.</span></div></div></div></section>
      </div></div>`;
  }

  function activateSettingsTab(tab) {
    settingsTab = tab;
    $$('.settings-tab').forEach(button => button.classList.toggle('active', button.dataset.settingsTab === tab));
    $$('.settings-page').forEach(page => page.classList.toggle('active', page.dataset.settingsPage === tab));
  }

  function syncConfigFromSettings() {
    config.rememberLastView = Boolean($('#prefRememberView')?.checked);
    config.defaultView = $('#prefDefaultView')?.value || config.defaultView;
    config.density = $('#prefDensity')?.value || config.density;
    config.originalsBoost = Boolean($('#prefOriginalsBoost')?.checked);
    config.showEpisodesHome = Boolean($('#prefEpisodesHome')?.checked);
    config.horizonDays = Number($('#prefHorizon')?.value || config.horizonDays);
    const media = $$('[data-media-pref]:checked').map(input => input.dataset.mediaPref);
    if (media.length) config.mediaPreferences = media;
    persistConfig();
  }

  async function connectToken() {
    const input = $('#tmdbToken');
    const status = $('#settingsStatus');
    const button = $('#saveToken');
    const token = input?.value.trim() || '';
    if (!token) { if (status) { status.textContent = 'Bitte zuerst einen Token eintragen.'; status.className = 'settings-inline-status warning'; } return; }
    if (button) button.disabled = true;
    try {
      await tmdb.validateToken(token);
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      if (status) { status.textContent = 'TMDB verbunden. Live-Daten werden aktualisiert …'; status.className = 'settings-inline-status success'; }
      await loadLiveData({ closeSettings:false });
    } catch (error) {
      if (status) { status.textContent = error?.status === 401 || error?.status === 403 ? 'Token ungültig oder nicht autorisiert.' : 'TMDB konnte nicht erreicht werden.'; status.className = 'settings-inline-status warning'; }
    } finally { if (button) button.disabled = false; }
  }

  function removeToken() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    if ($('#tmdbToken')) $('#tmdbToken').value = '';
    useDemo('TMDB-Verbindung wurde entfernt.');
    if ($('#settingsStatus')) { $('#settingsStatus').textContent = 'Token entfernt.'; $('#settingsStatus').className = 'settings-inline-status'; }
  }

  function exportBackup() {
    const payload = {
      app:'StreamRadar', format:2, version:VERSION, exportedAt:new Date().toISOString(),
      personalization:config,
      preferredProviders:preferredProviders(),
      preferredProvidersOnly:providersOnly(),
      watchlist:[...state.watchlist]
    };
    const blob = new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href=url; link.download=`streamradar-backup-${new Date().toISOString().slice(0,10)}.json`; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    notify('StreamRadar-Backup wurde erstellt.');
  }

  async function importBackup(event) {
    const file = event.target.files?.[0]; event.target.value=''; if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (data?.app !== 'StreamRadar' || !data.personalization || !Array.isArray(data.watchlist)) throw new Error('FORMAT');
      config = { ...defaultConfig, ...data.personalization };
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
      if (Array.isArray(data.preferredProviders)) setProviders(data.preferredProviders, false);
      if (typeof data.preferredProvidersOnly === 'boolean') setProvidersOnly(data.preferredProvidersOnly, false);
      state.watchlist = new Set(data.watchlist.map(String).filter(Boolean)); localStorage.setItem(WATCHLIST_KEY, JSON.stringify([...state.watchlist]));
      applyConfigSurface(); installSettingsCenter(); renderReleases(); notify('Backup erfolgreich wiederhergestellt.');
    } catch { notify('Diese Datei ist kein gültiges StreamRadar-Backup.', 'warning'); }
  }

  function installSettingsCenter() {
    const dialog = $('#settingsDialog'); const root = dialog?.querySelector('.settings-content'); if (!dialog || !root) return;
    dialog.classList.add('v020-settings'); root.innerHTML = settingsMarkup();
    $$('.settings-tab').forEach(button => button.onclick = () => activateSettingsTab(button.dataset.settingsTab));
    activateSettingsTab(settingsTab);
    $('#prefDefaultView').value = config.defaultView; $('#prefDensity').value = config.density; $('#prefHorizon').value = String(config.horizonDays);
    ['prefRememberView','prefDefaultView','prefDensity','prefOriginalsBoost','prefEpisodesHome','prefHorizon'].forEach(id => { const node=$(`#${id}`); if (node) node.onchange=syncConfigFromSettings; });
    $$('[data-media-pref]').forEach(input => input.onchange = event => { const checked=$$('[data-media-pref]:checked'); if (!checked.length) { event.target.checked=true; notify('Mindestens eine Medienart muss aktiv bleiben.', 'warning'); return; } syncConfigFromSettings(); });
    $('#settingsProvidersOnly').onchange = event => setProvidersOnly(event.target.checked);
    $('#settingsProvidersAll').onclick = () => { setProviders(providerNames(), false); installSettingsCenter(); renderReleases(); };
    $('#settingsProvidersNone').onclick = () => { setProviders([], false); installSettingsCenter(); renderReleases(); };
    $$('#settingsProviderGrid input').forEach(input => input.onchange = () => setProviders($$('#settingsProviderGrid input:checked').map(node => node.value)));
    $('#tmdbToken').value = localStorage.getItem(TOKEN_STORAGE_KEY) || '';
    $('#settingsStatus').textContent = state.mode === 'live' ? 'Verbunden. Live-Daten sind aktiv.' : 'Noch nicht mit TMDB verbunden.';
    $('#saveToken').onclick = connectToken; $('#clearToken').onclick = removeToken;
    $('#exportStreamRadarBackup').onclick = exportBackup; $('#importStreamRadarBackup').onclick = () => $('#streamRadarBackupFile').click(); $('#streamRadarBackupFile').onchange = importBackup;
  }

  function onboardingMarkup() {
    const tokenExists = Boolean(localStorage.getItem(TOKEN_STORAGE_KEY));
    return `<div class="onboarding-overlay" id="onboardingOverlay"><div class="onboarding-card"><aside class="onboarding-aside"><div class="onboarding-logo">Stream<span>Radar</span></div><div class="onboarding-progress"><div data-progress="0"><i>1</i><span>Willkommen</span></div><div data-progress="1"><i>2</i><span>TMDB</span></div><div data-progress="2"><i>3</i><span>Anbieter</span></div><div data-progress="3"><i>4</i><span>Für dich</span></div></div></aside><main class="onboarding-main">
      <section class="onboarding-step" data-onboarding-step="0"><span class="section-kicker">V0.2.0 · PERSONALIZATION</span><h1>Dein Radar.<br/><span>Deine Regeln.</span></h1><p>In wenigen Schritten richtet StreamRadar deinen persönlichen Release-Radar ein. Alles wird lokal auf diesem Gerät gespeichert.</p><div class="onboarding-feature-grid"><div class="onboarding-feature"><strong>Deine Anbieter</strong><span>Priorisiere nur die Dienste, die für dich relevant sind.</span></div><div class="onboarding-feature"><strong>Deine Inhalte</strong><span>Filme, Serien, Anime und Originals nach deinen Präferenzen.</span></div><div class="onboarding-feature"><strong>Deine Daten</strong><span>Token und Einstellungen bleiben lokal.</span></div></div></section>
      <section class="onboarding-step" data-onboarding-step="1"><span class="section-kicker">DATENQUELLE</span><h1>TMDB <span>verbinden</span></h1><p>${tokenExists?'Dein vorhandener TMDB-Token wurde erkannt. Du kannst direkt fortfahren oder ihn ersetzen.':'Für Live-Daten benötigt StreamRadar deinen TMDB API Read Access Token. Du kannst diesen Schritt auch überspringen und zunächst den Demo-Modus verwenden.'}</p><div class="onboarding-token"><input type="password" id="onboardingToken" placeholder="${tokenExists?'Vorhandener Token wird beibehalten':'TMDB API Read Access Token'}" autocomplete="off"/><div class="onboarding-hint">Der Token wird nicht in Backups oder das GitHub-Repository geschrieben.</div><div class="onboarding-error" id="onboardingTokenError"></div></div></section>
      <section class="onboarding-step" data-onboarding-step="2"><span class="section-kicker">MEINE ANBIETER</span><h1>Was nutzt <span>du?</span></h1><p>Wähle deine Streaming-Dienste. Du kannst diese Auswahl später jederzeit im Einstellungs-Center ändern.</p><div class="settings-provider-actions"><button class="text-button" id="onboardingProvidersAll">Alle wählen</button><button class="text-button" id="onboardingProvidersNone">Keine wählen</button></div><div class="onboarding-provider-grid" id="onboardingProviderGrid">${providerGridMarkup('onboarding')}</div></section>
      <section class="onboarding-step" data-onboarding-step="3"><span class="section-kicker">DEIN MIX</span><h1>Was ist dir <span>wichtig?</span></h1><p>Diese Auswahl beeinflusst die Reihenfolge im persönlichen Home-Feed. Nichts wird dauerhaft ausgeblendet.</p><div class="pref-chip-grid"><label class="pref-chip"><input type="checkbox" data-onboarding-media="movie" ${config.mediaPreferences.includes('movie')?'checked':''}/><span>🎬 Filme</span></label><label class="pref-chip"><input type="checkbox" data-onboarding-media="series" ${config.mediaPreferences.includes('series')?'checked':''}/><span>▣ Serien</span></label><label class="pref-chip"><input type="checkbox" data-onboarding-media="anime" ${config.mediaPreferences.includes('anime')?'checked':''}/><span>◈ Anime</span></label></div><div class="settings-group"><div class="setting-row"><div class="setting-copy"><strong>Originals priorisieren</strong><span>Gibt Originals im persönlichen Mix mehr Gewicht.</span></div><label class="setting-switch"><input id="onboardingOriginals" type="checkbox" ${config.originalsBoost?'checked':''}/><span></span></label></div><div class="setting-row"><div class="setting-copy"><strong>Neue Episoden auf Home</strong><span>Zeigt episodische Releases auch im persönlichen Mix.</span></div><label class="setting-switch"><input id="onboardingEpisodes" type="checkbox" ${config.showEpisodesHome?'checked':''}/><span></span></label></div></div></section>
      <div class="onboarding-actions"><button class="text-button" id="onboardingSkip" type="button">Später einrichten</button><div class="onboarding-actions-right"><button class="ghost-button" id="onboardingBack" type="button">Zurück</button><button class="primary-button" id="onboardingNext" type="button">Weiter</button></div></div></main></div></div>`;
  }

  function showOnboarding() {
    if (localStorage.getItem(ONBOARDING_KEY) === 'true' || $('#onboardingOverlay')) return;
    document.body.insertAdjacentHTML('beforeend', onboardingMarkup());
    let step = 0;
    const render = () => {
      $$('[data-onboarding-step]').forEach(node => node.classList.toggle('active', Number(node.dataset.onboardingStep) === step));
      $$('[data-progress]').forEach(node => { const index=Number(node.dataset.progress); node.classList.toggle('active', index===step); node.classList.toggle('done', index<step); });
      $('#onboardingBack').style.visibility = step ? 'visible' : 'hidden'; $('#onboardingNext').textContent = step === 3 ? 'StreamRadar starten' : 'Weiter';
    };
    const finish = async () => {
      const token = $('#onboardingToken')?.value.trim();
      if (token) {
        try { $('#onboardingNext').disabled=true; await tmdb.validateToken(token); localStorage.setItem(TOKEN_STORAGE_KEY,token); }
        catch { $('#onboardingTokenError').textContent='Dieser Token konnte nicht validiert werden.'; step=1; render(); $('#onboardingNext').disabled=false; return; }
      }
      const selectedProviders = $$('#onboardingProviderGrid input:checked').map(input => input.value); if (selectedProviders.length) setProviders(selectedProviders,false);
      const media = $$('[data-onboarding-media]:checked').map(input => input.dataset.onboardingMedia); if (media.length) config.mediaPreferences=media;
      config.originalsBoost=Boolean($('#onboardingOriginals')?.checked); config.showEpisodesHome=Boolean($('#onboardingEpisodes')?.checked); persistConfig({render:false});
      localStorage.setItem(ONBOARDING_KEY,'true'); $('#onboardingOverlay')?.remove(); installSettingsCenter(); renderReleases(); if (localStorage.getItem(TOKEN_STORAGE_KEY)) loadLiveData(); notify('Dein persönlicher StreamRadar ist eingerichtet.');
    };
    $('#onboardingNext').onclick = async () => { if (step < 3) { step += 1; render(); } else await finish(); };
    $('#onboardingBack').onclick = () => { step=Math.max(0,step-1); render(); };
    $('#onboardingSkip').onclick = () => { localStorage.setItem(ONBOARDING_KEY,'true'); $('#onboardingOverlay').remove(); notify('Einrichtung übersprungen. Du kannst sie in den Einstellungen nachholen.'); };
    $('#onboardingProvidersAll').onclick = () => $$('#onboardingProviderGrid input').forEach(input => input.checked=true);
    $('#onboardingProvidersNone').onclick = () => $$('#onboardingProviderGrid input').forEach(input => input.checked=false);
    render();
  }

  renderReleases = function() {
    const result = baseRenderReleases();
    renderPersonalizedHome();
    return result;
  };

  setView = function(view) {
    if (config.rememberLastView && ['discover','calendar','seasons','episodes','upcoming','watchlist'].includes(view)) localStorage.setItem(LAST_VIEW_KEY, view);
    return baseSetView(view);
  };

  function restoreStartupView() {
    const view = config.rememberLastView ? localStorage.getItem(LAST_VIEW_KEY) : config.defaultView;
    const target = ['discover','calendar','seasons','episodes','upcoming','watchlist'].includes(view) ? view : config.defaultView;
    if (target && target !== state.view) { state.view = target; renderReleases(); }
  }

  applyConfigSurface();
  installSettingsCenter();
  restoreStartupView();
  renderReleases();
  queueMicrotask(showOnboarding);

  window.StreamRadarPersonalization = Object.freeze({
    VERSION,
    getConfig: () => ({...config}),
    openSettings: tab => { settingsTab = tab || 'general'; installSettingsCenter(); openSettings(); activateSettingsTab(settingsTab); },
    exportBackup,
    renderPersonalizedHome
  });
})();
'''

# Active CSS and JS stay in stable filenames.
styles = read('styles.css')
if 'StreamRadar v0.2.0 — Personalization & Settings' not in styles:
    styles = styles.rstrip() + css + '\n'
write('styles.css', styles)

ui = read('ui.js')
ui = ui.replace('/* StreamRadar consolidated UI runtime — current version 0.1.2 */', '/* StreamRadar consolidated UI runtime — current version 0.2.0 */', 1)
if 'StreamRadar v0.2.0 — Personalization & Settings' not in ui:
    ui = ui.rstrip() + js + '\n'
write('ui.js', ui)

# Expose controlled provider setters from the existing stability layer.
stability = read('stability.js')
old_api = "    getPreferredProviders: () => [...preferredProviders],\n    isPreferredProvidersOnly: () => preferredProvidersOnly,\n    getSortMode: () => sortMode"
new_api = "    getPreferredProviders: () => [...preferredProviders],\n    getAllProviders: () => [...allProviderNames],\n    setPreferredProviders: (names, options = {}) => {\n      const allowed = new Set(allProviderNames);\n      preferredProviders = new Set((Array.isArray(names) ? names : []).map(String).filter(name => allowed.has(name)));\n      localStorage.setItem(PROVIDERS_KEY, JSON.stringify([...preferredProviders]));\n      renderProviderPreferences();\n      updatePersonalMode();\n      updateSettingsSummary();\n      if (options.render !== false) renderReleases();\n      return [...preferredProviders];\n    },\n    isPreferredProvidersOnly: () => preferredProvidersOnly,\n    setPreferredProvidersOnly: (value, options = {}) => {\n      preferredProvidersOnly = Boolean(value);\n      localStorage.setItem(PROVIDERS_ONLY_KEY, String(preferredProvidersOnly));\n      const input = $('#preferredProvidersOnly');\n      if (input) input.checked = preferredProvidersOnly;\n      updatePersonalMode();\n      if (options.render !== false) renderReleases();\n      return preferredProvidersOnly;\n    },\n    getSortMode: () => sortMode"
if old_api not in stability:
    raise SystemExit('Could not locate StreamRadarStability API block')
stability = stability.replace(old_api, new_api, 1)
write('stability.js', stability)

# Version bump core runtime and desktop metadata.
app = read('app.js').replace("const APP_VERSION = '0.1.2';", "const APP_VERSION = '0.2.0';", 1)
write('app.js', app)

desktop = read('desktop.js').replace("const VERSION = '0.1.2';", "const VERSION = '0.2.0';", 1)
write('desktop.js', desktop)

index = read('index.html')
index = index.replace('V0.1.2', 'V0.2.0').replace('v0.1.2', 'v0.2.0').replace('Version 0.1.2', 'Version 0.2.0')
index = index.replace('UI/UX Polish mit Premium-Detailansicht, globaler Suche, SVG-Icons, Rail-Navigation, „Neu seit deinem letzten Besuch“ und konsolidierter CSS-Basis.', 'Personalization & Settings mit Onboarding, Einstellungs-Center, persönlichem Home-Feed, Anbieter-/Inhaltspräferenzen und Backup/Restore.')
write('index.html', index)

write('VERSION', '0.2.0\n')

package = json.loads(read('package.json'))
package['version'] = '0.2.0'
write('package.json', json.dumps(package, ensure_ascii=False, indent=2) + '\n')

tauri = json.loads(read('src-tauri/tauri.conf.json'))
tauri['version'] = '0.2.0'
write('src-tauri/tauri.conf.json', json.dumps(tauri, ensure_ascii=False, indent=2) + '\n')

cargo = read('src-tauri/Cargo.toml')
cargo = re.sub(r'(?m)^version = "0\.1\.2"$', 'version = "0.2.0"', cargo, count=1)
write('src-tauri/Cargo.toml', cargo)

# Changelog section.
changelog = read('CHANGELOG.md')
section = '''## [0.2.0] - 2026-09-01

### Added
- Vollständiges **Personalization Center** mit Bereichen Allgemein, Anbieter, Inhalte, Daten & Backup und Über StreamRadar.
- First-Run-Onboarding für TMDB-Verbindung, Streaming-Anbieter und persönliche Inhaltspräferenzen.
- Persönlicher Home-Feed **Dein Radar-Mix** mit Relevanz-Scoring aus Anbieterwahl, Medienpräferenzen, Originals, Merkliste und Release-Nähe.
- Zusätzliche Reihe **Bei deinen Diensten** für ausgewählte Streaming-Anbieter.
- Präferenzen für Filme, Serien, Anime, Originals-Gewichtung, Episoden auf Home und persönlichen Zukunftshorizont.
- Wahl zwischen komfortabler und kompakter Informationsdichte.
- Letzte Ansicht bzw. Standardansicht kann für den App-Start gespeichert werden.
- Vollständiges StreamRadar-Backup/Restore für Personalisierung, Anbieter und Merkliste; der TMDB-Token wird bewusst nicht exportiert.
- Stabile Provider-Setter im `StreamRadarStability`-API, damit alte und neue Personalisierungsoberflächen dieselbe Datenquelle verwenden.

### Changed
- Aktive UI bleibt ausschließlich in `styles.css` und `ui.js`; vor v0.2.0 wurden konsolidierte v0.1.2-Snapshots nach `OldCss/` und `OldUi/` archiviert.
- Der bisherige technische TMDB-Einstellungsdialog wurde zu einem vollständigen Einstellungs-Center ausgebaut.
- Home-Personalisierung arbeitet ergänzend zur bestehenden Release Intelligence und verändert keine Rohdaten.
- App-, Desktop-, Tauri- und MSI-Version wurden auf `0.2.0` angehoben.

### Desktop
- Tauri-MSI und EXE werden als v0.2.0 gebaut.
- Der finale Main-Build veröffentlicht `downloads/StreamRadar_0.2.0_x64_de-DE.msi` automatisch im Repository.
- Der Installer bleibt für die persönliche Nutzung unsigniert.

'''
anchor = '## [0.1.2] - 2026-09-01'
if section not in changelog:
    changelog = changelog.replace(anchor, section + anchor, 1)
write('CHANGELOG.md', changelog)

# README current-version surfaces; keep historic changelog references intact where useful.
readme = read('README.md')
readme = re.sub(r'## Aktuelle Version: v0\.1\.2\n\n\*\*v0\.1\.2[^\n]*\*\*[^\n]*', '## Aktuelle Version: v0.2.0\n\n**v0.2.0 – Personalization & Settings** macht aus dem Release-Radar eine persönliche Streaming-Desktop-App mit Onboarding, Einstellungs-Center, Anbieter-/Inhaltspräferenzen, persönlichem Home-Scoring und portablem Backup.', readme, count=1)
readme = readme.replace('StreamRadar v0.1.2 als MSI herunterladen', 'StreamRadar v0.2.0 als MSI herunterladen').replace('downloads/StreamRadar_0.1.2_x64_de-DE.msi', 'downloads/StreamRadar_0.2.0_x64_de-DE.msi')
start = readme.find('## Neu in v0.1.2')
end = readme.find('\n## Funktionsumfang', start)
if start != -1 and end != -1:
    replacement = '''## Neu in v0.2.0

- vollständiges **Personalization Center** statt rein technischem Token-Dialog
- First-Run-Onboarding für TMDB, Anbieter und Inhaltspräferenzen
- persönlicher Home-Bereich **Dein Radar-Mix** mit Relevanz-Scoring
- optionale Reihe **Bei deinen Diensten**
- Präferenzen für Filme, Serien, Anime, Originals, Episoden und Zukunftshorizont
- komfortable oder kompakte Informationsdichte
- letzte bzw. Standardansicht beim Start merken
- StreamRadar-Backup/Restore für Einstellungen, Anbieter und Merkliste ohne API-Token
- aktive UI bleibt dauerhaft in `styles.css` und `ui.js`; stabile v0.1.2-Snapshots liegen im Archiv
- zentraler App-/Desktop-Versionsstand `0.2.0`
'''
    readme = readme[:start] + replacement + readme[end:]
readme = readme.replace('StreamRadar_0.1.2_x64_de-DE.msi', 'StreamRadar_0.2.0_x64_de-DE.msi')
readme = readme.replace('`v0.1.1` – Desktop UI/UX Redesign', '`v0.2.0` – Personalization & Settings')
readme = readme.replace('v0.1.1 ist ein kompatibler UI/UX-Patch auf dem ersten vollständigen v0.1.0-Desktop-Meilenstein.', 'v0.2.0 ist der erste größere Funktions-Meilenstein nach dem UI/UX-Redesign und führt die Personalisierung als eigene Produktsäule ein.')
readme = readme.replace('## Grenzen von v0.1.1', '## Grenzen von v0.2.0')
# Update project tree entries for consolidated runtime archives.
readme = readme.replace('├── OldCss/v003.css … v011.css', '├── OldCss/\n│   ├── v003.css … v012.css\n│   └── styles-v0.1.2.css')
readme = readme.replace('├── ui011.js', '├── ui.js\n├── OldUi/\n│   ├── ui011.js\n│   ├── ui012.js\n│   └── ui-v0.1.2.js')
write('README.md', readme)

# Archive docs describe the snapshot rule.
oldcss = read('OldCss/README.md')
if 'styles-v0.1.2.css' not in oldcss:
    oldcss += '\nZusätzlich können konsolidierte Release-Snapshots wie `styles-v0.1.2.css` abgelegt werden. Die aktive Anwendung lädt ausschließlich `styles.css`.\n'
write('OldCss/README.md', oldcss)

oldui = read('OldUi/README.md')
if 'ui-v0.1.2.js' not in oldui:
    oldui += '\nVor größeren Releases kann ein konsolidierter Snapshot wie `ui-v0.1.2.js` archiviert werden. Die aktive Anwendung lädt ausschließlich `ui.js`.\n'
write('OldUi/README.md', oldui)

print('Prepared StreamRadar v0.2.0 personalization release.')
