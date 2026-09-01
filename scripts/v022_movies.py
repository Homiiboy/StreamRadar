from pathlib import Path

def edit(path, changes):
    p=Path(path); s=p.read_text(encoding='utf-8')
    for old,new in changes:
        if old not in s: raise SystemExit(f'{path}: missing {old[:80]!r}')
        s=s.replace(old,new,1)
    p.write_text(s,encoding='utf-8',newline='\n')

edit('index.html',[(
'      <button class="nav-link sidebar-link active" data-view="discover"><span class="sidebar-icon">⌂</span><span>Entdecken</span></button>\n      <button class="nav-link sidebar-link" data-view="calendar">',
'      <button class="nav-link sidebar-link active" data-view="discover"><span class="sidebar-icon">⌂</span><span>Entdecken</span></button>\n      <button class="nav-link sidebar-link" data-view="movies"><span class="sidebar-icon">◆</span><span>Filme</span></button>\n      <button class="nav-link sidebar-link" data-view="calendar">')])

edit('js/app.js',[(
"  if (state.view === 'today') return dayDistance(item.releaseDate) === 0;\n  if (state.view === 'seasons')",
"  if (state.view === 'today') return dayDistance(item.releaseDate) === 0;\n  if (state.view === 'movies') return item.mediaType === 'movie' || item.type === 'movie';\n  if (state.view === 'seasons')"),(
"    today: eligible.filter(item => dayDistance(item.releaseDate) === 0).length,\n    seasons:",
"    today: eligible.filter(item => dayDistance(item.releaseDate) === 0).length,\n    movies: eligible.filter(item => item.mediaType === 'movie' || item.type === 'movie').length,\n    seasons:"),(
"    ['today', 'Heute', counts.today, 'Events heute'],\n    ['seasons',",
"    ['today', 'Heute', counts.today, 'Events heute'],\n    ['movies', 'Filme', counts.movies, 'im Radar'],\n    ['seasons',"),(
"  if (view === 'today') { $('#viewKicker').textContent = 'HEUTE'; $('#viewTitle').textContent = 'Heute erschienen'; }\n  else if (view === 'seasons')",
"  if (view === 'today') { $('#viewKicker').textContent = 'HEUTE'; $('#viewTitle').textContent = 'Heute erschienen'; }\n  else if (view === 'movies') { $('#viewKicker').textContent = 'FILM-RADAR'; $('#viewTitle').textContent = 'Filme'; }\n  else if (view === 'seasons')")])

edit('js/ui.js',[(
"    discover: ['ENTDECKEN', 'Dein Streaming-Radar'],\n    calendar:",
"    discover: ['ENTDECKEN', 'Dein Streaming-Radar'],\n    movies: ['FILM-RADAR', 'Filme'],\n    calendar:"),(
"    calendar:'<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\">",
"    movies:'<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M5 4h14v16H5z\"/><circle cx=\"9\" cy=\"9\" r=\"2\"/><circle cx=\"15\" cy=\"9\" r=\"2\"/><circle cx=\"9\" cy=\"15\" r=\"2\"/><circle cx=\"15\" cy=\"15\" r=\"2\"/></svg>',\n    calendar:'<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\">"),(
"const viewIcons = { discover:'home', calendar:'calendar'",
"const viewIcons = { discover:'home', movies:'movies', calendar:'calendar'"),(
'<option value="discover">Entdecken</option><option value="calendar">Kalender</option>',
'<option value="discover">Entdecken</option><option value="movies">Filme</option><option value="calendar">Kalender</option>')])
# All current startup/last-view allowlists should recognize Movies.
p=Path('js/ui.js'); s=p.read_text(encoding='utf-8'); s=s.replace("['discover','calendar','upcoming','watchlist']","['discover','movies','calendar','upcoming','watchlist']").replace("['discover','calendar','seasons','episodes','upcoming','watchlist']","['discover','movies','calendar','seasons','episodes','upcoming','watchlist']"); p.write_text(s,encoding='utf-8',newline='\n')

edit('js/calendar.js',[(
"<div><strong>${counts.total}</strong><span>Releases</span></div><div><strong>${counts['season-premiere'] || 0}</strong><span>Staffelstarts</span></div>",
"<div><strong>${counts.total}</strong><span>Releases</span></div><div><strong>${counts['movie-premiere'] || 0}</strong><span>Filme</span></div><div><strong>${counts['season-premiere'] || 0}</strong><span>Staffelstarts</span></div>")])

p=Path('tests/e2e/streamradar.spec.js'); s=p.read_text(encoding='utf-8')
if 'movies view and calendar include movie releases' not in s:
    s += '''\n\ntest('movies view and calendar include movie releases', async ({ page }) => {\n  const errors = await boot(page, configuredStorage());\n  await page.locator('.sidebar-link[data-view="movies"]').click();\n  await expect(page.locator('body')).toHaveAttribute('data-streamradar-view', 'movies');\n  await expect(page.locator('.release-card').filter({ hasText: 'Red Horizon' })).toBeVisible();\n  await expect(page.locator('.release-card').filter({ hasText: 'Neon District' })).toHaveCount(0);\n  await page.locator('.sidebar-link[data-view="calendar"]').click();\n  await page.locator('[data-calendar-mode="90"]').click();\n  await expect(page.locator('#calendarStats')).toContainText('Filme');\n  await expect(page.locator('.timeline-event').filter({ hasText: 'Red Horizon' })).toBeVisible();\n  expect(errors).toEqual([]);\n});\n'''
p.write_text(s,encoding='utf-8',newline='\n')
print('movies migration done')
