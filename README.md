# StreamRadar

StreamRadar ist ein persönlicher Streaming-Katalog und Release-Radar für Filme, Serien und Anime – mit anbieter-spezifischen Katalogen, Releases, Staffeln, Episoden und Kalender für Österreich.

## Aktuelle Version: v0.4.0

**v0.4.0 – Streaming Catalog & Provider Experience** stellt das gesamte verfügbare Angebot deiner Streaming-Dienste in den Mittelpunkt. Release Intelligence, Kalender und Episoden-Radar bleiben als zusätzliche Ebene erhalten.

## Download

### Windows x64

[**StreamRadar v0.4.0 als MSI herunterladen**](downloads/StreamRadar_0.4.0_x64_de-DE.msi)

Weitere Builds und die SHA-256-Prüfsumme liegen im Ordner [`downloads/`](downloads/).

Der Installer ist für die persönliche Nutzung weiterhin nicht code-signiert. Windows kann deshalb beim Öffnen einen Hinweis auf einen unbekannten Herausgeber anzeigen.

## Neu in v0.4.0

- kompletter Streaming-Katalog für verfügbare Filme und Serien – unabhängig vom Erscheinungsdatum
- Entdecken, Filme, Serien und Anime als eigene Katalogbereiche
- Provider-First-Navigation mit Netflix, Prime Video, Disney+, Apple TV+ und weiteren verfügbaren Diensten
- große anbieter-spezifische Provider-Header und deutlich sichtbarere Provider-Kennzeichnung auf Karten
- Lazy Pagination über TMDB Discover für browsebares Gesamtangebot statt starrem Release-Zeitfenster
- Release-Radar bleibt separat für Neu & aktuell, Staffeln, Episoden, Demnächst und Kalender
- Katalog-Merkliste kann auch Titel speichern, die kein aktuelles Release-Event besitzen
- neuer Runtime-Baustein `js/catalog.js`
- v0.3.0 Snapshots unter `OldCss/styles-v0.3.0.css` und `OldUi/ui-v0.3.0.js`

## Funktionsumfang

StreamRadar kombiniert:

- vollständiger TMDB/JustWatch-Streaming-Katalog pro österreichischem Watch-Provider
- TMDB-Live-Daten für zeitbasierte Release Intelligence
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
- integriertes Update-Center mit veröffentlichtem MSI-Versionscheck
- gespeicherter nativer Fensterzustand und externe Links über den Windows-Standardbrowser
- MSI-Installer für Windows x64

## Windows Desktop / MSI

StreamRadar verwendet Tauri v2. Die HTML/CSS/JavaScript-Oberfläche wird als native Windows-Anwendung verpackt und über WebView2 dargestellt.

Der GitHub-Workflow **Build StreamRadar Windows MSI** läuft auf `windows-latest`, baut die Anwendung, verifiziert die MSI und veröffentlicht sie danach unter:

```text
downloads/StreamRadar_0.4.0_x64_de-DE.msi
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
npm ci
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
KATALOG
  Entdecken
  Filme
  Serien
  Anime

ANBIETER
  Netflix / Prime Video / Disney+ / Apple TV+ / ...

RADAR
  Neu & aktuell
  Kalender
  Staffeln
  Episoden
  Demnächst

DEINE INHALTE
  Merkliste
```

Der Katalog und der Release-Radar verwenden getrennte Datenpfade: Katalogansichten besitzen **kein Release-Zeitfenster**. Der Radar bleibt zeitbasiert.

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
│   ├── StreamRadar_0.1.2_x64_de-DE.msi
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
├── js/
│   ├── original-overrides.js
│   ├── tmdb.js
│   ├── tvmaze.js
│   ├── app.js
│   ├── calendar.js
│   ├── stability.js
│   ├── polish.js
│   ├── desktop.js
│   ├── ui.js
│   └── catalog.js
├── tests/
│   ├── playwright.config.js
│   └── e2e/streamradar.spec.js
├── package.json
├── VERSION
├── CHANGELOG.md
└── README.md
```

## Asset-Regel für weitere Updates

Ab v0.1.2 gibt es keine versionsbezogenen Runtime-Dateien wie `v013.css` oder `ui013.js` mehr im Repository-Root.

Für v0.2.2 und spätere Releases gilt:

1. Die aktive Oberfläche wird direkt in `styles.css` weiterentwickelt.
2. Die aktive UI-Logik wird direkt in `js/ui.js` weiterentwickelt.
3. Vor größeren Änderungen kann der bisherige Stand optional als Snapshot in `OldCss/` bzw. `OldUi/` archiviert werden.
4. `index.html` und der Desktop-Build laden weiterhin ausschließlich `styles.css` sowie die Runtime-Dateien unter `js/`.
5. Die Archive werden niemals mitgeladen und beeinflussen die aktuelle App nicht.

Damit bleiben die Runtime-Dateinamen stabil, während die Historie trotzdem nachvollziehbar bleibt.

## Versionierung

StreamRadar verwendet Semantic Versioning (`MAJOR.MINOR.PATCH`). v0.1.2 ist ein kompatibler UI/UX-Patch auf dem ersten vollständigen v0.1.0-Desktop-Meilenstein.

## Grenzen des aktuellen Builds

- Einstellungen, Cache und Merkliste bleiben lokal und werden nicht zwischen Geräten synchronisiert.
- Persistenz läuft weiterhin über `localStorage`; SQLite ist für eine spätere Desktop-Ausbaustufe vorgesehen.
- Episoden im 90-Tage-Fenster können wegen des kürzeren TVmaze-Schedule-Horizonts weniger vollständig sein.
- Der MSI-Installer ist nicht code-signiert.
- Automatische App-Updates sind noch nicht aktiviert.

## Status

`v0.4.0` – Streaming Catalog & Provider Experience


### Film-Radar

StreamRadar v0.2.2 bietet einen eigenen **Filme**-Bereich. Film-Releases bleiben gleichzeitig Bestandteil des Release-Kalenders und der 90-Tage-Timeline.
