(() => {
  const VERSION = '0.0.8';
  const calendarState = {
    mode: 'month',
    anchor: new Date(),
    selectedDate: null,
    watchlistOnly: false
  };

  const pad = value => String(value).padStart(2, '0');
  const iso = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const clone = date => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
  const fromISO = value => {
    if (!value) return null;
    const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0, 0);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const addDays = (date, days) => { const next = clone(date); next.setDate(next.getDate() + days); return next; };
  const addMonths = (date, months) => { const next = clone(date); next.setDate(1); next.setMonth(next.getMonth() + months); return next; };
  const startOfWeek = date => {
    const start = clone(date);
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
    return start;
  };
  const endOfMonth = date => new Date(date.getFullYear(), date.getMonth() + 1, 0, 12, 0, 0, 0);
  const fmtDay = date => new Intl.DateTimeFormat('de-AT', { weekday:'short', day:'2-digit', month:'short' }).format(date);
  const fmtLong = date => new Intl.DateTimeFormat('de-AT', { weekday:'long', day:'2-digit', month:'long', year:'numeric' }).format(date);
  const fmtMonth = date => new Intl.DateTimeFormat('de-AT', { month:'long', year:'numeric' }).format(date);

  function calendarFilteredEvents() {
    const query = $('#searchInput')?.value.trim().toLowerCase() || '';
    const type = $('#typeFilter')?.value || 'all';
    const event = $('#eventFilter')?.value || 'all';
    const originals = Boolean($('#originalsOnly')?.checked);
    const brand = $('#brandFilter')?.value || 'all';

    return state.releases.filter(item => {
      if (!item?.releaseDate || item.radarEligible === false) return false;
      const haystack = `${item.title || ''} ${item.originalTitle || ''} ${(item.services || []).join(' ')} ${item.originalBrand || ''} ${item.eventEpisodeName || ''} ${item.eventChannel || ''}`.toLowerCase();
      return (state.service === 'all' || item.services?.includes(state.service) || item.originalBrand === state.service)
        && (type === 'all' || item.type === type)
        && (event === 'all' || item.eventKind === event)
        && (!originals || item.original === true)
        && (brand === 'all' || item.originalBrand === brand)
        && (!calendarState.watchlistOnly || state.watchlist.has(watchKey(item)))
        && (!query || haystack.includes(query));
    });
  }

  function range() {
    const anchor = clone(calendarState.anchor);
    if (calendarState.mode === 'day') {
      const day = calendarState.selectedDate ? fromISO(calendarState.selectedDate) : anchor;
      return { from:day, to:day, label:fmtLong(day) };
    }
    if (calendarState.mode === 'week') {
      const from = startOfWeek(anchor);
      const to = addDays(from, 6);
      return { from, to, label:`${fmtDay(from)} – ${fmtDay(to)}` };
    }
    if (calendarState.mode === '90') {
      const from = clone(anchor);
      const to = addDays(from, 89);
      return { from, to, label:`90 Tage ab ${fmtDay(from)}` };
    }
    const from = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12, 0, 0, 0);
    const to = endOfMonth(anchor);
    return { from, to, label:fmtMonth(anchor) };
  }

  function eventsInRange(events, currentRange = range()) {
    const from = iso(currentRange.from);
    const to = iso(currentRange.to);
    return events.filter(item => item.releaseDate >= from && item.releaseDate <= to)
      .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate) || sortByRadarRelevance(a, b));
  }

  function providerLogo(item) {
    const service = item.services?.[0];
    const path = item.serviceLogos?.[service] || providerFor(service)?.logoPath;
    return path ? `<img src="${tmdb.image(path, 'w92')}" alt="" loading="lazy"/>` : '<span class="calendar-logo-fallback"></span>';
  }

  function originLogo(item) {
    const path = item.originalLogoPath || brandLogoPath(item.originalBrand);
    return path ? `<img src="${tmdb.image(path, 'w92')}" alt="" loading="lazy"/>` : '';
  }

  function renderMonthGrid(allEvents) {
    const root = $('#calendarGrid');
    if (!root) return;
    const anchor = clone(calendarState.anchor);
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12, 0, 0, 0);
    const start = startOfWeek(first);
    const today = iso(new Date());
    const byDate = new Map();
    allEvents.forEach(item => {
      const list = byDate.get(item.releaseDate) || [];
      list.push(item);
      byDate.set(item.releaseDate, list);
    });

    const headers = ['Mo','Di','Mi','Do','Fr','Sa','So'].map(day => `<span class="calendar-weekday">${day}</span>`).join('');
    const cells = Array.from({ length:42 }, (_, index) => {
      const date = addDays(start, index);
      const dateISO = iso(date);
      const items = byDate.get(dateISO) || [];
      const outside = date.getMonth() !== anchor.getMonth();
      const selected = calendarState.selectedDate === dateISO;
      const busy = items.length >= 5 ? 'is-busy' : items.length >= 3 ? 'is-warm' : '';
      const previews = items.slice(0, 3).map(item => `<span class="calendar-mini-event event-${escapeHTML(item.eventKind || 'unknown')}" title="${escapeHTML(`${eventLabel(item)} · ${item.title}`)}">${providerLogo(item)}<b>${escapeHTML(item.title)}</b></span>`).join('');
      return `<button class="calendar-day ${outside ? 'outside' : ''} ${selected ? 'selected' : ''} ${dateISO === today ? 'today' : ''} ${busy}" data-calendar-date="${dateISO}"><span class="calendar-day-number">${date.getDate()}</span>${items.length ? `<span class="calendar-day-count">${items.length}</span>` : ''}<span class="calendar-mini-list">${previews}</span>${items.length > 3 ? `<small>+${items.length - 3} weitere</small>` : ''}</button>`;
    }).join('');
    root.innerHTML = `<div class="calendar-weekdays">${headers}</div><div class="calendar-days">${cells}</div>`;
    $$('[data-calendar-date]').forEach(button => button.onclick = () => {
      calendarState.selectedDate = button.dataset.calendarDate;
      calendarState.anchor = fromISO(button.dataset.calendarDate) || calendarState.anchor;
      calendarState.mode = 'day';
      renderCalendar();
    });
  }

  function renderTimeline(allEvents) {
    const root = $('#calendarTimeline');
    if (!root) return;
    const currentRange = range();
    const ranged = eventsInRange(allEvents, currentRange);
    const groups = new Map();
    ranged.forEach(item => {
      const list = groups.get(item.releaseDate) || [];
      list.push(item);
      groups.set(item.releaseDate, list);
    });

    if (!ranged.length) {
      root.innerHTML = '<div class="calendar-empty"><strong>Keine Releases in diesem Zeitraum</strong><span>Ändere Zeitraum, Anbieter oder Filter.</span></div>';
      return;
    }

    root.innerHTML = [...groups.entries()].map(([dateISO, items]) => {
      const date = fromISO(dateISO);
      return `<section class="timeline-day"><div class="timeline-date"><strong>${escapeHTML(date ? fmtLong(date) : dateISO)}</strong><span>${items.length} ${items.length === 1 ? 'Release' : 'Releases'}</span></div><div class="timeline-events">${items.map(item => {
        const episode = item.eventKind === 'episode' ? `S${item.eventSeason || '?'}E${item.eventEpisode || '?'}` : item.eventKind === 'season-premiere' ? `Staffel ${item.eventSeason || '?'}` : '';
        const origin = item.originalBrand ? `<span class="timeline-origin">${originLogo(item)}${escapeHTML(item.originalBrand)}</span>` : '';
        return `<button class="timeline-event event-${escapeHTML(item.eventKind || 'unknown')}" data-calendar-event="${escapeHTML(item.id)}"><span class="timeline-provider">${providerLogo(item)}</span><span class="timeline-copy"><small>${escapeHTML(eventLabel(item))}${episode ? ` · ${escapeHTML(episode)}` : ''}</small><strong>${escapeHTML(item.title)}</strong><span>${escapeHTML(item.services?.join(' · ') || 'Streaming')}${item.eventEpisodeName ? ` · ${escapeHTML(item.eventEpisodeName)}` : ''}</span></span>${origin}<span class="timeline-arrow">→</span></button>`;
      }).join('')}</div></section>`;
    }).join('');

    $$('[data-calendar-event]').forEach(button => button.onclick = () => openDetails(button.dataset.calendarEvent));
  }

  function renderCalendarSummary(allEvents) {
    const root = $('#calendarStats');
    if (!root) return;
    const ranged = eventsInRange(allEvents);
    const counts = ranged.reduce((acc, item) => {
      acc.total += 1;
      acc[item.eventKind] = (acc[item.eventKind] || 0) + 1;
      return acc;
    }, { total:0 });
    const byDate = ranged.reduce((map, item) => map.set(item.releaseDate, (map.get(item.releaseDate) || 0) + 1), new Map());
    const busiest = [...byDate.entries()].sort((a, b) => b[1] - a[1])[0];
    root.innerHTML = `<div><strong>${counts.total}</strong><span>Releases</span></div><div><strong>${counts['season-premiere'] || 0}</strong><span>Staffelstarts</span></div><div><strong>${counts.episode || 0}</strong><span>Episoden</span></div><div><strong>${(counts['movie-premiere'] || 0) + (counts['series-premiere'] || 0)}</strong><span>Premieren</span></div>${busiest ? `<div class="calendar-busiest"><strong>${busiest[1]}</strong><span>vollster Tag · ${escapeHTML(fmtDay(fromISO(busiest[0])))}</span></div>` : ''}`;
  }

  function renderCalendar() {
    const panel = $('#calendarPanel');
    if (!panel) return;
    const active = state.view === 'calendar';
    panel.hidden = !active;
    $('#releaseGrid').hidden = active;
    $('#loadingGrid').classList.toggle('calendar-hidden', active);
    $('#emptyState').classList.toggle('calendar-hidden', active);
    if (!active) return;

    const events = calendarFilteredEvents();
    $('#calendarRangeLabel').textContent = range().label;
    $$('[data-calendar-mode]').forEach(button => button.classList.toggle('active', button.dataset.calendarMode === calendarState.mode));
    $('#calendarWatchlistOnly').checked = calendarState.watchlistOnly;
    renderMonthGrid(events);
    renderCalendarSummary(events);
    renderTimeline(events);
  }

  function move(direction) {
    if (calendarState.mode === 'day') calendarState.anchor = addDays(calendarState.anchor, direction);
    else if (calendarState.mode === 'week') calendarState.anchor = addDays(calendarState.anchor, direction * 7);
    else if (calendarState.mode === '90') calendarState.anchor = addDays(calendarState.anchor, direction * 90);
    else calendarState.anchor = addMonths(calendarState.anchor, direction);
    calendarState.selectedDate = calendarState.mode === 'day' ? iso(calendarState.anchor) : null;
    renderCalendar();
  }

  function setCalendarMode(mode) {
    calendarState.mode = mode;
    if (mode === 'day' && !calendarState.selectedDate) calendarState.selectedDate = iso(calendarState.anchor);
    renderCalendar();
  }

  function exportICS() {
    const events = eventsInRange(calendarFilteredEvents());
    if (!events.length) return;
    const escapeICS = value => String(value || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    const dateICS = value => String(value || '').replaceAll('-', '');
    const rows = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//StreamRadar//Release Calendar//DE','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
    events.forEach(item => {
      const detail = item.eventKind === 'episode' ? `S${item.eventSeason || '?'}E${item.eventEpisode || '?'}` : item.eventKind === 'season-premiere' ? `Staffel ${item.eventSeason || '?'}` : eventLabel(item);
      rows.push('BEGIN:VEVENT');
      rows.push(`UID:${escapeICS(`${item.entityId || item.id}-${item.eventKind || 'release'}-${item.eventSeason || 0}-${item.eventEpisode || 0}-${item.releaseDate}@streamradar`)}`);
      rows.push(`DTSTART;VALUE=DATE:${dateICS(item.releaseDate)}`);
      rows.push(`SUMMARY:${escapeICS(`${eventLabel(item)}: ${item.title}`)}`);
      rows.push(`DESCRIPTION:${escapeICS(`${detail} · ${(item.services || []).join(' · ')}${item.originalBrand ? ` · Herkunft: ${item.originalBrand}` : ''}`)}`);
      rows.push('END:VEVENT');
    });
    rows.push('END:VCALENDAR');
    const blob = new Blob([rows.join('\r\n')], { type:'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `streamradar-${calendarState.mode}-${iso(calendarState.anchor)}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const baseSetView = setView;
  const baseRenderReleases = renderReleases;

  setView = function(view) {
    if (view !== 'calendar') {
      baseSetView(view);
      renderCalendar();
      return;
    }
    state.view = 'calendar';
    $$('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.view === 'calendar'));
    $('#viewKicker').textContent = 'RELEASE-KALENDER';
    $('#viewTitle').textContent = 'Kalender & Timeline';
    baseRenderReleases();
    renderCalendar();
    $('#releases').scrollIntoView({ behavior:'smooth' });
  };

  renderReleases = function() {
    baseRenderReleases();
    renderCalendar();
  };

  $('#calendarPrev').onclick = () => move(-1);
  $('#calendarNext').onclick = () => move(1);
  $('#calendarToday').onclick = () => {
    calendarState.anchor = clone(new Date());
    calendarState.selectedDate = calendarState.mode === 'day' ? iso(calendarState.anchor) : null;
    renderCalendar();
  };
  $$('[data-calendar-mode]').forEach(button => button.onclick = () => setCalendarMode(button.dataset.calendarMode));
  $('#calendarWatchlistOnly').onchange = event => { calendarState.watchlistOnly = event.target.checked; renderCalendar(); };
  $('#calendarExport').onclick = exportICS;
  ['#searchInput','#typeFilter','#eventFilter','#brandFilter','#originalsOnly'].forEach(selector => {
    const element = $(selector);
    if (!element) return;
    element.addEventListener(element.tagName === 'INPUT' && element.type === 'search' ? 'input' : 'change', () => { if (state.view === 'calendar') renderCalendar(); });
  });

  window.StreamRadarCalendar = { VERSION, render:renderCalendar, exportICS };
})();
