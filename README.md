# StreamRadar

StreamRadar ist ein persönlicher Streaming-Release-Radar für Filme, Serien, Anime, Originals, neue Staffeln und Episoden – optimiert für Österreich.

## Aktuelle Version: v0.2.0

**v0.2.0 – Personalization & Settings** macht aus dem Release-Radar eine persönliche Streaming-Desktop-App mit Onboarding, Einstellungs-Center, Anbieter-/Inhaltspräferenzen, persönlichem Home-Scoring und portablem Backup.

## Download

### Windows x64

[**StreamRadar v0.2.0 als MSI herunterladen**](downloads/StreamRadar_0.2.0_x64_de-DE.msi)

Weitere Builds und die SHA-256-Prüfsumme liegen im Ordner [`downloads/`](downloads/).

Der Installer ist für die persönliche Nutzung weiterhin nicht code-signiert. Windows kann deshalb beim Öffnen einen Hinweis auf einen unbekannten Herausgeber anzeigen.

## Neu in v0.2.0

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
downloads/StreamRadar_0.2.0_x64_de-DE.msi
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

## Navigation

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
│   ├── StreamRadar_0.1.1_x64_de-DE.msi
│   └── StreamRadar_0.2.0_x64_de-DE.msi
├── assets/
│   └── streamradar-icon.svg
├── OldCss/
│   ├── README.md
│   └── historische CSS-Snapshots
├── OldUi/
│   ├── README.md
│   └── historische UI-JavaScript-Snapshots
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
├── ui.js
├── original-overrides.js
├── tmdb.js
├── tvmaze.js
├── app.js
├── calendar.js
├── stability.js
├── polish.js
├── desktop.js
├── package.json
├── VERSION
├── CHANGELOG.md
└── README.md
```

## Asset-Regel für weitere Updates

Ab v0.1.2 gibt es keine versionsbezogenen Runtime-Dateien wie `v013.css` oder `ui013.js` mehr im Repository-Root.

Für v0.1.3 und spätere Releases gilt:

1. Die aktive Oberfläche wird direkt in `styles.css` weiterentwickelt.
2. Die aktive UI-Logik wird direkt in `ui.js` weiterentwickelt.
3. Vor größeren Änderungen kann der bisherige Stand optional als Snapshot in `OldCss/` bzw. `OldUi/` archiviert werden.
4. `index.html` und der Desktop-Build laden weiterhin ausschließlich `styles.css` und `ui.js`.
5. Die Archive werden niemals mitgeladen und beeinflussen die aktuelle App nicht.

Damit bleiben die Runtime-Dateinamen stabil, während die Historie trotzdem nachvollziehbar bleibt.

## Versionierung

StreamRadar verwendet Semantic Versioning (`MAJOR.MINOR.PATCH`). v0.1.2 ist ein kompatibler UI/UX-Patch auf dem ersten vollständigen v0.1.0-Desktop-Meilenstein.

## Grenzen von v0.1.2

- Einstellungen, Cache und Merkliste bleiben lokal und werden nicht zwischen Geräten synchronisiert.
- Persistenz läuft weiterhin über `localStorage`; SQLite ist für eine spätere Desktop-Ausbaustufe vorgesehen.
- Episoden im 90-Tage-Fenster können wegen des kürzeren TVmaze-Schedule-Horizonts weniger vollständig sein.
- Der MSI-Installer ist nicht code-signiert.
- Automatische App-Updates sind noch nicht aktiviert.

## Status

`v0.1.2` – UI/UX Polish
