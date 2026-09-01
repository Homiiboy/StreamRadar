# StreamRadar

StreamRadar ist ein persönlicher Release-Radar und Streaming-Kalender für Filme, Serien, Anime, Originals, neue Staffeln und Episoden – optimiert für Österreich.

## Aktuelle Version: v0.0.9

### Neu in v0.0.9

- **Sofort-Cache** für den zuletzt vollständig synchronisierten Radar
- Cache-TTL von 6 Stunden mit **stale-while-revalidate**: gespeicherte Daten erscheinen sofort, während TMDB/TVmaze im Hintergrund aktualisiert werden
- Offline-/Fehler-Fallback auf den letzten lokalen Datenstand statt Rückfall auf Demo-Inhalte
- sichtbarer Online-/Offline- und Cache-Status
- neuer Filter **Meine Anbieter**
- persönliche Provider-Auswahl in den Einstellungen, lokal und dauerhaft gespeichert
- persönliche Provider-Auswahl wirkt auch auf Kalender und Timeline
- persistente Sortierung nach **Relevanz**, **Datum**, **Beliebtheit** oder **TMDB-Wertung**
- Merkliste kann als JSON gesichert und später wieder importiert werden
- bestehende Merkliste wird normalisiert und dedupliziert
- Suchfeld wird leicht verzögert aktualisiert, um unnötige Feed-Neuberechnungen beim Tippen zu reduzieren
- Toast-Hinweise für Offline-Modus, Wiederverbindung, Cache-Aktionen und Merkliste-Import
- zusätzliche mobile Optimierungen für Einstellungen, Provider-Auswahl und Statusanzeige
- neue Runtime-Schicht `stability.js` und Styling in `v009.css`

## Lokaler Radar-Cache

Nach einer erfolgreichen Live-Synchronisierung speichert StreamRadar bis zu 350 Release-Events sowie Provider- und Schedule-Metadaten lokal im Browser.

```text
StreamRadar öffnen
      ↓
Lokaler Cache vorhanden?
      ↓ ja
Events sofort anzeigen
      ↓
TMDB + TVmaze im Hintergrund aktualisieren
      ↓
Cache nach erfolgreichem Sync erneuern
```

Der Cache verfällt für den normalen Sofortstart nach sechs Stunden. Falls TMDB/TVmaze oder die Internetverbindung nicht verfügbar sind, kann StreamRadar auch einen älteren Cache als Fallback verwenden.

Der TMDB API Read Access Token bleibt weiterhin ausschließlich im Browser und wird nicht in den Radar-Cache geschrieben.

## Meine Anbieter

Unter ⚙ können die Streaming-Dienste ausgewählt werden, die für den persönlichen Feed relevant sind. Der Schalter **Meine Anbieter** aktiviert anschließend einen Multi-Provider-Filter.

Die Auswahl ist unabhängig von der vorhandenen einzelnen Provider-/Herkunftsmarken-Auswahl. Dadurch kann zum Beispiel dauerhaft nur Netflix, Disney+, HBO Max und Crunchyroll angezeigt und danach zusätzlich temporär nach einer einzelnen Herkunftsmarke gefiltert werden.

## Sortierung

v0.0.9 ergänzt vier persistente Sortierungen:

- **Relevanz** – bisherige StreamRadar-Priorisierung aus zeitlicher Nähe, Release-Typ und Popularität
- **Datum** – bald erscheinende Events zuerst
- **Beliebtheit** – TMDB-Popularität zuerst
- **TMDB-Wertung** – Bewertung zuerst, Popularität als Tie-Breaker

## Merkliste sichern

Die Merkliste bleibt in `localStorage`, kann jetzt aber zusätzlich als JSON-Datei exportiert werden. Beim Import werden IDs normalisiert, dedupliziert und mit der vorhandenen Merkliste zusammengeführt.

## Release-Kalender

Seit v0.0.8 besitzt StreamRadar eine eigene Kalenderansicht mit:

```text
Tag
Woche
Monat
90 Tage
```

Dazu kommen Monatsraster, chronologische Timeline, volle-Tage-Erkennung, Provider-/Herkunftsfilter, Nur-Merkliste-Modus und `.ics`-/iCalendar-Export.

v0.0.9 übernimmt **Meine Anbieter** auch in Kalender und Timeline.

## Origin Intelligence

Seit v0.0.7 trennt StreamRadar **Streaming-Original**, **Network/Broadcaster**, **Studio** und **Herkunftsmarke**.

Direkte Network-/Plattformtreffer sind stärker gewichtet als Produktionsfirmen. Studios wie Marvel Studios, Lucasfilm oder Pixar können als Herkunft erscheinen, werden aber nicht automatisch zu einem Disney+-Original. Bekannte Sonderfälle können über `original-overrides.js` korrigiert werden.

## Release- und Episodenradar

StreamRadar behandelt Titel als Release-Events:

- **Film-Premiere** / Digital- oder TV-Premiere
- **Neue Serie**
- **Neue Staffel**
- **Neue Episode**

TMDB/JustWatch bestimmen die österreichische Provider-Relevanz. TVmaze ergänzt den Web-/Streaming-Schedule und konkrete Episodeninformationen.

## Datenquellen

- **TMDB** – Titel, Metadaten, Bilder, Networks, Produktionsfirmen, Release-Dates, Staffeln, Episodenmetadaten, Logos und Watch-Provider
- **JustWatch via TMDB** – Streaming-Verfügbarkeit in Österreich
- **TVmaze** – Web-/Streaming-Schedule, Episoden, Staffeln, Web-Channels und kommende Episoden

TVmaze benötigt keinen API-Key. Der TMDB API Read Access Token wird nur lokal im Browser gespeichert.

## Starten

```bash
python -m http.server 8080
```

Danach `http://localhost:8080` öffnen und unter ⚙ den TMDB **API Read Access Token** hinterlegen.

## Versionierung

StreamRadar verwendet konsequent **Semantic Versioning (SemVer)**:

```text
MAJOR.MINOR.PATCH
```

- `PATCH`: Fehlerbehebungen und kleine kompatible Verbesserungen
- `MINOR`: größere rückwärtskompatible Feature-Pakete
- `MAJOR`: Breaking Changes / grundlegende Neustrukturierung

Während `0.x` befindet sich StreamRadar in der frühen Entwicklungsphase. Release-Reihenfolge: `0.0.1` → `0.0.2` → `0.0.3` → `0.0.4` → `0.0.5` → `0.0.6` → `0.0.7` → `0.0.8` → `0.0.9`.

Siehe [`CHANGELOG.md`](CHANGELOG.md) und [`VERSION`](VERSION).

## Projektstruktur

```text
StreamRadar/
├── .github/workflows/validate.yml
├── index.html
├── styles.css
├── v003.css
├── v004.css
├── v005.css
├── v006.css
├── v007.css
├── v008.css
├── v009.css
├── original-overrides.js
├── tmdb.js
├── tvmaze.js
├── app.js
├── calendar.js
├── stability.js
├── VERSION
├── CHANGELOG.md
└── README.md
```

## Grenzen von v0.0.9

- Der Cache ist browserlokal und wird nicht zwischen Geräten synchronisiert.
- `localStorage` ist kein Ersatz für die für spätere Desktop-/Server-Versionen geplante SQLite-Datenbank.
- Die 90-Tage-Kalenderansicht kann bei Episoden wegen des kürzeren TVmaze-Schedule-Horizonts weniger vollständig sein.
- Der `.ics`-Export ist dateibasiert; eine direkte Zwei-Wege-Synchronisierung mit externen Kalenderdiensten ist noch nicht integriert.
- Für eine öffentlich gehostete Multi-User-Version sollte TMDB später über ein Backend/Proxy angebunden werden.

## Status

`v0.0.9` – Stability, cache, personalization & watchlist portability
