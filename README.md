# StreamRadar

StreamRadar ist ein persönlicher Streaming-Katalog und Release-Radar für Filme, Serien und Anime. Die App kombiniert anbieter-spezifische Kataloge, Release Intelligence, Staffel-/Episodeninformationen, Kalender, Merkliste und lokale Personalisierung in einer Windows-Desktop-App auf Basis von Tauri v2.

## Aktuelle Version: v0.5.2

**v0.5.2 – Themes & Visual Personalization** erweitert das in v0.5.1 eingeführte Theme-System auf sieben deutlich unterschiedliche Designs. Die Oberfläche kann direkt in den Einstellungen umgeschaltet werden; die Auswahl bleibt lokal gespeichert.

### Neu in v0.5.2

- sieben auswählbare Designs statt vier
- neue Themes **Netflix**, **Cyberpunk** und **Apple TV Glass**
- Netflix: Schwarz/Rot, kompaktere Flächen und stärkerer Poster-Fokus
- Cyberpunk: Neon-Cyan/Magenta, schärfere Kanten und futuristische Raster-/Glow-Akzente
- Apple TV Glass: größere Radien, Frosted Glass, Blur und transparentere Oberflächen
- bestehende Designs **Radar**, **Cinema**, **Midnight** und **OLED** bleiben erhalten
- Theme-Auswahl wird über `localStorage` gespeichert und nach einem Neustart wiederhergestellt
- Palette-Button in der Topbar schaltet zyklisch durch alle Designs
- alle Theme-Styles wurden in die zentrale `styles.css` integriert; eine separate `themes.css` ist nicht mehr nötig
- Browser-Regressionstests prüfen alle sieben Themes, direkte Auswahl und Persistenz
- Release-/Build-Konfiguration auf v0.5.2 aktualisiert

## Download

### Windows x64

[**StreamRadar v0.5.2 als MSI herunterladen**](downloads/StreamRadar_0.5.2_x64_de-DE.msi)

Alle noch im Repository verfügbaren MSI-Versionen und die SHA-256-Prüfsumme des neuesten Builds liegen im Ordner [`downloads/`](downloads/). Zusätzlich ist v0.5.2 inklusive MSI im nativen [GitHub-Releases-Bereich](../../releases) veröffentlicht.

Der Installer ist für die persönliche Nutzung nicht code-signiert. Windows kann deshalb beim Öffnen einen Hinweis auf einen unbekannten Herausgeber anzeigen.

## Designs

Unter **Einstellungen → Allgemein → Design** stehen aktuell folgende Themes zur Verfügung:

| Design | Charakter |
| --- | --- |
| **Radar** | ursprünglicher StreamRadar-Look mit Mint-Akzent |
| **Cinema** | dunkler Kino-Look mit warmem Rot |
| **Midnight** | tiefes Navy, Blau/Violett und weicherer Glass-Look |
| **OLED** | nahezu reines Schwarz, reduziert und kontrastreich |
| **Netflix** | Schwarz/Rot, kompakt und stark auf Content-Poster fokussiert |
| **Cyberpunk** | Neon-Cyan/Magenta, Grid, Glow und kantigere Geometrie |
| **Apple TV Glass** | Frosted Glass, große Radien, Blur und transparente Flächen |

Die Designs verändern nur die visuelle Darstellung. Katalog-, Radar-, Kalender-, Provider- und Merkliste-Daten bleiben identisch.

## Releases

Die komplette StreamRadar-Historie seit dem ersten MVP:

| Version | Schwerpunkt | Windows MSI |
| --- | --- | --- |
| **v0.5.2** | Themes & Visual Personalization | [MSI](downloads/StreamRadar_0.5.2_x64_de-DE.msi) |
| **v0.5.1** | Selectable Themes | [MSI](downloads/StreamRadar_0.5.1_x64_de-DE.msi) |
| **v0.5.0** | Clean Catalog & International Providers | [MSI](downloads/StreamRadar_0.5.0_x64_de-DE.msi) |
| **v0.4.1** | Provider Sidebar Fixes / Crunchyroll | [MSI](downloads/StreamRadar_0.4.1_x64_de-DE.msi) |
| **v0.4.0** | Streaming Catalog & Provider Experience | [MSI](downloads/StreamRadar_0.4.0_x64_de-DE.msi) |
| **v0.3.0** | Update Center & Desktop Integration | [MSI](downloads/StreamRadar_0.3.0_x64_de-DE.msi) |
| **v0.2.2** | Film Radar | [MSI](downloads/StreamRadar_0.2.2_x64_de-DE.msi) |
| **v0.2.1** | Browser-QA & Runtime-Struktur | [MSI](downloads/StreamRadar_0.2.1_x64_de-DE.msi) |
| **v0.2.0** | Personalization Center | [MSI](downloads/StreamRadar_0.2.0_x64_de-DE.msi) |
| **v0.1.2** | Premium Details & Global Search | [MSI](downloads/StreamRadar_0.1.2_x64_de-DE.msi) |
| **v0.1.1** | Desktop Sidebar & Home Rows | [MSI](downloads/StreamRadar_0.1.1_x64_de-DE.msi) |
| **v0.1.0** | First Complete Radar / erste Tauri-MSI | [MSI](downloads/StreamRadar_0.1.0_x64_de-DE.msi) |
| **v0.0.10** | Stabilität, Filter, Cache-Härtung | – |
| **v0.0.9** | Offline-Cache, Meine Anbieter, Sortierung | – |
| **v0.0.8** | Kalender, Timeline und iCalendar-Export | – |
| **v0.0.7** | Origin Intelligence | – |
| **v0.0.6** | Staffel-/Episoden-Radar via TVmaze | – |
| **v0.0.5** | Release Intelligence | – |
| **v0.0.4** | Original-/Network-Logos | – |
| **v0.0.3** | Original-Erkennung, TVmaze und SemVer | – |
| **v0.0.2** | erste TMDB-/JustWatch-Live-Daten | – |
| **v0.0.1** | erstes statisches StreamRadar-MVP | – |

Ausführliche Änderungen pro Version stehen in [`CHANGELOG.md`](CHANGELOG.md).

Alle **22 Versionen von v0.0.1 bis v0.5.2** sind zusätzlich als native [GitHub Releases](../../releases) veröffentlicht. Die Windows-Versionen ab v0.1.0 enthalten jeweils die zugehörige historische MSI als Release-Asset; die frühen v0.0.x-Versionen waren Web-/Runtime-Releases ohne MSI. Die Installer bleiben parallel im Repository-Ordner `downloads/` erhalten.

## Funktionsumfang

StreamRadar kombiniert:

- vollständigen TMDB/JustWatch-Streaming-Katalog pro Watch-Provider
- getrennte Katalogregionen für Österreich, USA und Japan
- TMDB-Live-Daten für zeitbasierte Release Intelligence
- TVmaze Web Schedule für neue Episoden und Staffelstarts
- Release Intelligence für Film-Premieren, Serienstarts, Staffelstarts und Episoden
- Origin Intelligence für Original, Network, Studio und Herkunftsmarke
- Provider-/Network-/Studio-Logos
- Kalender mit Tag, Woche, Monat und 90 Tagen
- chronologische Release-Timeline
- `.ics`-/iCalendar-Export
- persönliche Anbieter über **Meine Anbieter**
- persistente Sortierung und Personalisierung
- lokale Merkliste mit JSON-Backup/-Import
- lokalen Radar-Cache mit Offline-Fallback
- sieben lokal gespeicherte UI-Themes
- Tauri-v2-Desktop-App für Windows
- integriertes Update-Center mit veröffentlichtem MSI-Versionscheck
- gespeicherten nativen Fensterzustand und externe Links über den Windows-Standardbrowser
- MSI-Installer für Windows x64

## Katalogregionen und Anbieter

### Österreich

Der österreichische Katalog ist die primäre Region und umfasst unter anderem Netflix, Prime Video, Disney+, Apple TV+, Paramount+, Crunchyroll, Sky / WOW und discovery+.

### USA

Der internationale US-Bereich umfasst unter anderem Hulu, Peacock, AMC+, Starz, Tubi und The Roku Channel. Peacock besitzt zusätzlich Network-Bereiche für NBC, Bravo, USA Network, Syfy, Telemundo und Universal Kids.

### Japan

Der Japan-Bereich umfasst unter anderem d Anime Store, ABEMA und U-NEXT.

Internationale Providerseiten verwenden ihre jeweilige echte Watch-Region. Das ist keine Aussage darüber, ob derselbe Titel in Österreich verfügbar ist. **Release-Radar und Kalender bleiben auf Österreich ausgerichtet.**

## Navigation

```text
KATALOG
  Entdecken
  Filme
  Serien
  Anime

ANBIETER
  Österreich
  Netflix / Prime Video / Disney+ / Apple TV+ / ...

INTERNATIONAL
  USA
  Japan

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

Unter ⚙ können persönliche Anbieter, Inhaltspräferenzen, Informationsdichte, Startansicht und Design gewählt werden. **Meine Anbieter** filtert Feed, Home-Rows, Kalender und Timeline auf die ausgewählten Dienste.

Der letzte vollständige Radar wird lokal gepuffert. Ein frischer Cache wird beim Start sofort angezeigt und danach mit TMDB/TVmaze aktualisiert. Bei Netzwerk- oder API-Problemen kann der letzte gespeicherte Datenstand weiterverwendet werden.

Einstellungen, Theme, Cache und Merkliste werden aktuell lokal über `localStorage` gespeichert.

## Datenquellen

- **TMDB** – Titel, Bilder, Release-Dates, Networks, Produktionsfirmen, Staffeln, Logos und Watch-Provider
- **JustWatch via TMDB** – Watch-Provider-Verfügbarkeit pro unterstützter Region
- **TVmaze** – Web-/Streaming-Schedule und Episodeninformationen

Der TMDB API Read Access Token wird ausschließlich lokal gespeichert und niemals in das Repository geschrieben oder in Backups exportiert.

## Windows Desktop / MSI

StreamRadar verwendet Tauri v2. Die HTML/CSS/JavaScript-Oberfläche wird als native Windows-Anwendung verpackt und über WebView2 dargestellt.

Der GitHub-Workflow **Build StreamRadar Windows MSI** läuft auf `windows-latest`, prüft die Desktop-Konfiguration, baut die Anwendung, verifiziert die MSI und veröffentlicht den finalen Main-Build anschließend im Ordner `downloads/`.

Beim Publish wird außerdem die SHA-256-Prüfsumme des aktuellen Installers in `downloads/README.md` eingetragen.

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

## Qualitätssicherung

Bei Änderungen auf `main` laufen unter anderem:

- JavaScript-Syntaxchecks
- NPM-Audit auf High-Severity-Probleme
- Versions- und Release-Konsistenzchecks
- Runtime-/Packaging-Prüfungen
- Katalog-/Provider-Baseline-Checks
- Playwright-Browser-Regressionstests
- Theme-Auswahl- und Persistenztests
- echter Windows-x64-MSI-Build

Playwright installiert Chromium auf GitHub Actions bei Bedarf automatisch, bevor die Browser-Tests gestartet werden.

## Projektstruktur

```text
StreamRadar/
├── .github/workflows/
│   ├── validate.yml
│   └── build-msi.yml
├── downloads/
│   ├── README.md
│   └── StreamRadar_<version>_x64_de-DE.msi
├── assets/
│   └── streamradar-icon.svg
├── OldCss/
│   ├── README.md
│   └── historische CSS-Snapshots
├── OldUi/
│   ├── README.md
│   └── historische UI-JavaScript-Snapshots
├── scripts/
│   ├── build-desktop.mjs
│   └── test-e2e.mjs
├── src-tauri/
│   ├── capabilities/default.json
│   ├── src/lib.rs
│   ├── src/main.rs
│   ├── build.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
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
│   ├── catalog.js
│   └── themes.js
├── tests/
│   ├── playwright.config.js
│   └── e2e/
│       ├── streamradar.spec.js
│       └── themes.spec.js
├── index.html
├── styles.css
├── package.json
├── package-lock.json
├── VERSION
├── CHANGELOG.md
└── README.md
```

## CSS-/Runtime-Regel

Seit v0.5.2 liegt die **gesamte aktive CSS-Oberfläche einschließlich aller sieben Themes in `styles.css`**. `js/themes.js` übernimmt ausschließlich Auswahl, Persistenz, Theme-Metadaten und den Palette-Umschalter. Dadurch gibt es im normalen v0.5.2-Build nur noch ein zentrales Stylesheet und keine separate aktive `themes.css` mehr.

`js/original-overrides.js` enthält lediglich einen kleinen Rückwärtskompatibilitäts-Fallback für ältere Checkouts, in denen die Theme-Regeln noch in `themes.css` lagen. Historische Styles unter `OldCss/` und historische UI-Dateien unter `OldUi/` werden nicht mitgeladen.

## Versionierung

StreamRadar verwendet Semantic Versioning (`MAJOR.MINOR.PATCH`).

- **PATCH**: kompatible Fixes, UI-Polish und kleinere Erweiterungen
- **MINOR**: größere neue Funktionsbereiche
- **MAJOR**: grundlegende inkompatible Architektur-/Produktänderungen

## Grenzen des aktuellen Builds

- Einstellungen, Theme, Cache und Merkliste bleiben lokal und werden nicht zwischen Geräten synchronisiert.
- Persistenz läuft weiterhin über `localStorage`; SQLite ist für eine spätere Desktop-Ausbaustufe vorgesehen.
- Episoden im 90-Tage-Fenster können wegen des kürzeren TVmaze-Schedule-Horizonts weniger vollständig sein.
- Der MSI-Installer ist nicht code-signiert.
- Automatische App-Updates sind noch nicht aktiviert; das Update-Center weist auf neuere MSI-Versionen hin.
