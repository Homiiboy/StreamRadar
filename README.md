# StreamRadar

StreamRadar ist ein persönlicher Streaming-Release-Radar für Filme, Serien, Anime, Originals, neue Staffeln und Episoden – optimiert für Österreich.

## Aktuelle Version: v0.1.0

**v0.1.0 – First Complete Radar** ist der erste größere Meilenstein und zugleich die erste installierbare Windows-Desktop-Version.

## Download

### Windows x64

[**StreamRadar v0.1.0 als MSI herunterladen**](downloads/StreamRadar_0.1.0_x64_de-DE.msi)

Weitere Hinweise, Prüfsumme und zukünftige Installer liegen im Ordner [`downloads/`](downloads/).

Der Installer ist noch nicht code-signiert. Windows kann deshalb beim Öffnen einen Hinweis auf einen unbekannten Herausgeber anzeigen.

### Was v0.1.0 zusammenführt

- TMDB-Live-Daten mit österreichischen Watch-Providern
- TVmaze Web Schedule für neue Episoden und Staffelstarts
- Release Intelligence für Film-Premieren, neue Serien, neue Staffeln und neue Episoden
- Origin Intelligence für Original, Network, Studio und Herkunftsmarke
- Provider-/Network-/Studio-Logos
- Kalender mit Tag, Woche, Monat und 90 Tagen
- chronologische Release-Timeline
- `.ics`-/iCalendar-Export
- persönliche Anbieter über **Meine Anbieter**
- persistente Sortierung
- lokale Merkliste mit JSON-Backup/-Import
- lokaler Radar-Cache mit Offline-Fallback
- Deduplizierung und Cache-Härtung aus v0.0.10
- responsive Web-Oberfläche
- **Tauri-v2-Desktop-App für Windows**
- **MSI-Installer für Windows x64**
- eigenes StreamRadar-App-Icon

## Windows Desktop / MSI

StreamRadar v0.1.0 verwendet Tauri v2. Die bestehende HTML/CSS/JavaScript-Oberfläche wird als native Windows-Anwendung verpackt; Windows rendert die Oberfläche über WebView2.

Der GitHub-Workflow **Build StreamRadar Windows MSI** läuft auf `windows-latest` und erstellt:

```text
StreamRadar_0.1.0_x64_de-DE.msi
```

sowie die kompilierte Windows-Anwendung.

Nach einem erfolgreichen Build wird der Installer sowohl als GitHub-Actions-Artefakt als auch dauerhaft unter folgendem Pfad im Repository veröffentlicht:

```text
downloads/StreamRadar_0.1.0_x64_de-DE.msi
```

Der Installer ist in v0.1.0 noch **nicht code-signiert**. Windows SmartScreen kann deshalb bei einem heruntergeladenen Installer eine Warnung anzeigen. Code Signing ist für einen späteren Release vorgesehen.

### Desktop-App selbst bauen

Voraussetzungen für einen MSI-Build:

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

Das Skript erzeugt zuerst die Icon-Sets aus `assets/streamradar-icon.svg`, baut anschließend das statische Frontend nach `dist/` und lässt Tauri das MSI erzeugen.

## Desktop Icon

Die editierbare Icon-Quelle liegt unter:

```text
assets/streamradar-icon.svg
```

Tauri generiert daraus beim Desktop-Build die benötigten Windows-Icons (`.ico` und PNG-Größen). Das Design kombiniert Radar, Play-Symbol und Film-/Streaming-Elemente im cyan/blauen StreamRadar-Look.

## Datenquellen

- **TMDB** – Titel, Bilder, Release-Dates, Networks, Produktionsfirmen, Staffeln, Logos und Watch-Provider
- **JustWatch via TMDB** – Streaming-Verfügbarkeit in Österreich
- **TVmaze** – Web-/Streaming-Schedule und Episodeninformationen

Der TMDB API Read Access Token wird lokal gespeichert und nicht in das GitHub-Repository geschrieben.

## Release Intelligence

StreamRadar behandelt Inhalte als konkrete Release-Events:

- **Film-Premiere** / Digital- oder TV-Premiere
- **Neue Serie**
- **Neue Staffel**
- **Neue Episode**

TMDB bestimmt die österreichische Provider-Relevanz. TVmaze ergänzt aktuelle und kommende Streaming-Episoden.

## Origin Intelligence

StreamRadar trennt:

- Streaming-Original
- Network/Broadcaster
- Studio
- Herkunfts-/Franchisemarke

Dadurch wird beispielsweise Marvel Studios nicht automatisch zu einem Disney+-Original. Bekannte Sonderfälle können über `original-overrides.js` korrigiert werden.

## Kalender

Die Kalenderansicht bietet:

```text
Tag
Woche
Monat
90 Tage
```

Die Monatsansicht kombiniert Monatsraster und Timeline. Die übrigen Modi fokussieren stärker auf eine chronologische Timeline. Aktive Provider-, Herkunfts- und Merkliste-Filter gelten auch für den Kalender.

## Personalisierung und Offline-Nutzung

Unter ⚙ können persönliche Anbieter ausgewählt werden. **Meine Anbieter** filtert Feed, Kalender und Timeline auf diese Dienste.

Der letzte vollständige Radar wird lokal gepuffert. Ein frischer Cache wird beim Start sofort angezeigt und anschließend mit TMDB/TVmaze aktualisiert. Bei Netzwerk- oder API-Problemen kann der letzte gespeicherte Datenstand weiterverwendet werden.

## Web-Version starten

```bash
python -m http.server 8080
```

Danach `http://localhost:8080` öffnen.

## Projektstruktur

```text
StreamRadar/
├── .github/workflows/
│   ├── validate.yml
│   └── build-msi.yml
├── downloads/
│   ├── README.md
│   └── StreamRadar_0.1.0_x64_de-DE.msi
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
├── v003.css … v0100.css
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

## Versionierung

StreamRadar verwendet Semantic Versioning:

```text
MAJOR.MINOR.PATCH
```

- `PATCH`: Fehlerbehebungen und kleine kompatible Verbesserungen
- `MINOR`: größere rückwärtskompatible Feature-Pakete
- `MAJOR`: Breaking Changes / grundlegende Neustrukturierung

Mit `0.1.0` beginnt der erste vollständige Produkt-Meilenstein nach der `0.0.x`-Aufbauphase.

## Grenzen von v0.1.0

- TMDB-Token, Einstellungen, Cache und Merkliste sind weiterhin lokal und werden nicht zwischen Geräten synchronisiert.
- Die Desktop-App verwendet in v0.1.0 weiterhin `localStorage`; SQLite ist für eine spätere Desktop-Ausbaustufe vorgesehen.
- Episoden im 90-Tage-Fenster können aufgrund des kürzeren TVmaze-Schedule-Horizonts weniger vollständig sein.
- Der MSI-Installer ist noch nicht mit einem Windows-Code-Signing-Zertifikat signiert.
- Automatische App-Updates sind noch nicht aktiviert.

## Status

`v0.1.0` – First Complete Radar & Windows Desktop MSI
