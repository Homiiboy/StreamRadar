# StreamRadar Runtime JavaScript

Dieser Ordner enthält die aktiven Browser-/Desktop-Runtime-Dateien.

Die Ladereihenfolge in `index.html` ist absichtlich fest:

1. `original-overrides.js`
2. `tmdb.js`
3. `tvmaze.js`
4. `app.js`
5. `calendar.js`
6. `stability.js`
7. `polish.js`
8. `desktop.js`
9. `ui.js`

`OldUi/` bleibt ausschließlich Archiv und wird nicht zur Laufzeit oder im Tauri-Desktop-Paket geladen.

- `catalog.js` – v0.4.0 Streaming-Katalog, Provider-Ansichten und Lazy Pagination; wird bewusst nach `ui.js` geladen.
