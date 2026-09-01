# StreamRadar

StreamRadar ist ein persönlicher Streaming-Release-Radar für Filme, Serien, Anime, Originals, neue Staffeln und Episoden – optimiert für Österreich.

## Aktuelle Version: v0.1.2

**v0.1.2 – UI/UX Polish** verfeinert das v0.1.1-Desktop-Redesign mit einer Premium-Detailansicht, globaler Suche, besser navigierbaren Content-Rows, „Neu seit deinem letzten Besuch“ und einer konsolidierten CSS-Basis.

## Download

### Windows x64

[**StreamRadar v0.1.2 als MSI herunterladen**](downloads/StreamRadar_0.1.2_x64_de-DE.msi)

Weitere Builds und die SHA-256-Prüfsumme liegen im Ordner [`downloads/`](downloads/).

Der Installer ist für die persönliche Nutzung weiterhin nicht code-signiert. Windows kann deshalb beim Öffnen einen Hinweis auf einen unbekannten Herausgeber anzeigen.

## Neu in v0.1.2

- neue **Premium-Detailansicht** mit Backdrop, Poster, Release Intelligence, Herkunft, Providern und nächster Episode
- globale Schnell-Suche mit Suchoverlay und **Ctrl+K**
- einheitliche SVG-Icons statt gemischter Text-/Unicode-Symbole
- Pfeilnavigation und sauberer Scroll-Zustand für horizontale Content-Rows
- neuer Bereich **Neu seit deinem letzten Besuch** auf Basis lokal gespeicherter Radar-Event-IDs
- `styles.css` konsolidiert alle historischen visuellen Patches bis v0.1.1
- `OldCss/` ist jetzt ein echtes Archiv und wird nicht mehr zur Laufzeit geladen
- aktuelle UI-Schicht `ui.js` und Styling `styles.css`
- zentraler sichtbarer App-/Desktop-Versionsstand auf `0.1.2`

## Funktionsumfang

StreamRadar kombiniert:

- TMDB-Live-Daten mit österreichischen Watch-Providern
- TVmaze Web Schedule für neue Episoden und Staffelstarts
- Release Intelligence für Film-Premieren, Serienstarts, Staffelstarts und Episoden
- Origin Intelligence für Original, Network, Studio und Herkunftsmarke
- Provider-/Network-/Studio-Logos
- Kalender mit Tag, Woche, Monat und 90 Tagen
- chronologische Release-Timeline
- `.ics`-/iCalendar-Export
- persönliche Anbieter über **Meine Anbieter**
- persistente Sortierung
- lokale Merkliste mit JSON-Backup/-Import
- lokalen Radar-Cache mit Offline-Fallback
- Tauri-v2-Desktop-App für Windows
- MSI-Installer für Windows x64

## Windows Desktop / MSI

StreamRadar verwendet Tauri v2. Die HTML/CSS/JavaScript-Oberfläche wird als native Windows-Anwendung verpackt und über WebView2 dargestellt.

Der GitHub-Workflow **Build StreamRadar Windows MSI** läuft auf `windows-latest`, baut die Anwendung, verifiziert die MSI und veröffentlicht sie danach unter:

```text
downloads/StreamRadar_0.1.2_x64_de-DE.msi
```

Beim finalen Main-Build wird außerdem automatisch die SHA-256-Prüfsumme in `downloads/README.md` eingetragen.

### Desktop-App selbst bauen

Voraussetzungen:

- Windows
- Node.js 22+
- Rust stable
- Microsoft C++ Build Tools
- WebView2
- WiX/VBScript-Voraussetzungen für Tauri-MSI

Dann:

```bash
npm install
npm run desktop:build
```

Das Build-Skript packt die statische Oberfläche nach `dist/`, generiert die Windows-Icons aus `assets/streamradar-icon.svg` und erzeugt anschließend das MSI.

## Datenquellen

- **TMDB** – Titel, Bilder, Release-Dates, Networks, Produktionsfirmen, Staffeln, Logos und Watch-Provider
- **JustWatch via TMDB** – Streaming-Verfügbarkeit in Österreich
- **TVmaze** – Web-/Streaming-Schedule und Episodeninformationen

Der TMDB API Read Access Token wird ausschließlich lokal gespeichert und niemals in das Repository geschrieben.

## Navigation in v0.1.1

```text
Entdecken
Kalender
Staffeln
Episoden
Demnächst
Merkliste
```

Die Desktop-Version verwendet dafür eine linke Sidebar. Auf kleineren Fenstern wird sie als Off-Canvas-Navigation eingeblendet.

## Kalender

Die Kalenderansicht bietet:

```text
Tag
Woche
Monat
90 Tage
```

Die Monatsansicht kombiniert Monatsraster und Timeline. Die übrigen Modi fokussieren stärker auf die chronologische Timeline. Aktive Provider-, Herkunfts-, Originals- und Merkliste-Filter gelten auch dort.

## Personalisierung und Offline-Nutzung

Unter ⚙ können persönliche Anbieter ausgewählt werden. **Meine Anbieter** filtert Feed, Home-Rows, Kalender und Timeline auf diese Dienste.

Der letzte vollständige Radar wird lokal gepuffert. Ein frischer Cache wird beim Start sofort angezeigt und danach mit TMDB/TVmaze aktualisiert. Bei Netzwerk- oder API-Problemen kann der letzte gespeicherte Datenstand weiterverwendet werden.

## Projektstruktur

```text
StreamRadar/
├── .github/workflows/
│   ├── validate.yml
│   └── build-msi.yml
├── downloads/
│   ├── README.md
│   ├── StreamRadar_0.1.0_x64_de-DE.msi
│   └── StreamRadar_0.1.1_x64_de-DE.msi
├── assets/
│   └── streamradar-icon.svg
├── scripts/
│   └── build-desktop.mjs
├── src-tauri/
│   ├── capabilities/default.json
│   ├── src/lib.rs
│   ├── src/main.rs
│   ├── build.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── index.html
├── styles.css
├── OldCss/v003.css … v011.css
├── original-overrides.js
├── tmdb.js
├── tvmaze.js
├── app.js
├── calendar.js
├── stability.js
├── polish.js
├── desktop.js
├── ui011.js
├── package.json
├── VERSION
├── CHANGELOG.md
└── README.md
```

## Versionierung

StreamRadar verwendet Semantic Versioning (`MAJOR.MINOR.PATCH`). v0.1.1 ist ein kompatibler UI/UX-Patch auf dem ersten vollständigen v0.1.0-Desktop-Meilenstein.

## Grenzen von v0.1.1

- Einstellungen, Cache und Merkliste bleiben lokal und werden nicht zwischen Geräten synchronisiert.
- Persistenz läuft weiterhin über `localStorage`; SQLite ist für eine spätere Desktop-Ausbaustufe vorgesehen.
- Episoden im 90-Tage-Fenster können wegen des kürzeren TVmaze-Schedule-Horizonts weniger vollständig sein.
- Der MSI-Installer ist nicht code-signiert.
- Automatische App-Updates sind noch nicht aktiviert.

## Status

`v0.1.1` – Desktop UI/UX Redesign
