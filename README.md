# StreamRadar

StreamRadar ist ein persönlicher Release-Radar und Streaming-Kalender für Filme, Serien, Anime, Originals, neue Staffeln und Episoden – optimiert für Österreich.

## Aktuelle Version: v0.0.8

### Neu in v0.0.8

- eigene Hauptansicht **Kalender**
- Tages-, Wochen-, Monats- und **90-Tage-Ansicht**
- Monatsraster mit Release-Anzahl und kompakten Provider-/Titelhinweisen pro Tag
- chronologische **Release-Timeline** unter dem Kalender
- Gruppierung aller Events nach konkretem Veröffentlichungsdatum
- Kennzeichnung besonders voller Release-Tage
- Zusammenfassung für Releases, Staffelstarts, Episoden und Premieren im gewählten Zeitraum
- Navigation mit **Zurück / Weiter / Heute**
- bestehende Filter für Provider, Medientyp, Release-Typ, Herkunft und Originals wirken auch im Kalender
- **Nur Merkliste** als separater Kalenderfilter
- Klick auf einen Kalendereintrag öffnet weiterhin die normale StreamRadar-Detailansicht
- responsive Timeline für Desktop, Tablet und Smartphone
- echter **iCalendar-/`.ics`-Export** für den aktuell gewählten Zeitraum
- neues Modul `calendar.js` und Styling in `v008.css`
- Origin Intelligence aus v0.0.7 bleibt vollständig erhalten

## Release-Kalender

Die Kalenderansicht nutzt dieselben Release-Events wie der normale Radar. Sie erzeugt keine zweite Datenbasis, sondern visualisiert die bereits klassifizierten TMDB-/TVmaze-Ereignisse nach Datum.

Mögliche Ansichten:

```text
Tag
Woche
Monat
90 Tage
```

Ein Klick auf einen Tag im Monatsraster wechselt direkt in die Tagesansicht dieses Datums.

### Timeline

Unter dem Monatsraster werden Releases chronologisch gruppiert, zum Beispiel:

```text
12. September 2026 · 4 Releases

FX / Disney+     Neue Episode     Signal Fire · S02E05
HBO Max          Neue Staffel     Example Show · Staffel 3
Prime Video      Digital-Premiere Example Movie
Netflix          Neue Serie       Example Series
```

Provider- und Herkunftsinformationen bleiben dabei sichtbar. Ein Timeline-Eintrag öffnet die vorhandene Detailansicht.

### Kalenderexport

Der Button **Kalender exportieren (.ics)** erstellt eine iCalendar-Datei für alle aktuell sichtbaren Events des gewählten Kalenderzeitraums. Dadurch kann der Release-Plan später in kompatible Kalenderprogramme importiert werden.

Der Export berücksichtigt auch aktive Provider-/Medien-/Herkunftsfilter sowie den Schalter **Nur Merkliste**.

## Origin Intelligence

Seit v0.0.7 trennt StreamRadar **Streaming-Original**, **Network/Broadcaster**, **Studio** und **Herkunftsmarke**.

Beispiele:

```text
Network: FX
→ Original von FX
```

```text
Production Company: Marvel Studios
→ Studio / Brand: Marvel Studios
→ nicht automatisch Disney+ Original
```

Direkte Network-/Plattformtreffer sind stärker gewichtet als Produktionsfirmen. Bekannte Sonderfälle können über `original-overrides.js` manuell korrigiert werden.

## Release- und Episodenradar

StreamRadar behandelt Titel als Release-Events:

- **Film-Premiere** / Digital- oder TV-Premiere
- **Neue Serie**
- **Neue Staffel**
- **Neue Episode**

TMDB/JustWatch bestimmen die österreichische Provider-Relevanz. TVmaze ergänzt den globalen Web-/Streaming-Schedule und konkrete Episodeninformationen.

## Datenquellen

- **TMDB** – Titel, Metadaten, Bilder, Networks, Produktionsfirmen, Release-Dates, Staffeln, Episodenmetadaten, Logos und Watch-Provider
- **JustWatch via TMDB** – Streaming-Verfügbarkeit in Österreich
- **TVmaze** – Web-/Streaming-Schedule, Episoden, Staffeln, Web-Channels und kommende Episoden

Der TMDB API Read Access Token wird nur lokal im Browser gespeichert. TVmaze benötigt keinen API-Key.

## Deduplizierung

Release-Ereignisse werden zweistufig zusammengeführt:

- primär über TMDB-ID + Release-Typ + Datum + Staffel/Episode
- sekundär über einen Fingerprint aus normalisiertem Titel, Datum, Release-Typ und Staffel/Episode

TMDB- und TVmaze-Treffer desselben Events werden verschmolzen; Provider, Herkunftsmetadaten, Logos und Schedule-Daten bleiben erhalten.

## Starten

```bash
python -m http.server 8080
```

Dann `http://localhost:8080` öffnen und unter ⚙ den TMDB **API Read Access Token** hinterlegen.

## Versionierung

StreamRadar verwendet konsequent **Semantic Versioning (SemVer)**:

```text
MAJOR.MINOR.PATCH
```

- `PATCH`: Fehlerbehebungen und kleine kompatible Verbesserungen
- `MINOR`: größere rückwärtskompatible Feature-Pakete
- `MAJOR`: Breaking Changes / grundlegende Neustrukturierung

Während `0.x` befindet sich StreamRadar in der frühen Entwicklungsphase. Release-Reihenfolge: `0.0.1` → `0.0.2` → `0.0.3` → `0.0.4` → `0.0.5` → `0.0.6` → `0.0.7` → `0.0.8`.

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
├── original-overrides.js
├── tmdb.js
├── tvmaze.js
├── app.js
├── calendar.js
├── VERSION
├── CHANGELOG.md
└── README.md
```

## Grenzen von v0.0.8

- Der Kalender zeigt nur Events, die über die vorhandene TMDB-/TVmaze-Discovery bereits im StreamRadar-Datensatz vorhanden sind.
- Die 90-Tage-Ansicht kann bei Serienepisoden durch den kürzeren TVmaze-Schedule weniger dicht sein als bei Film-/Staffel-Premieren.
- Der `.ics`-Export ist dateibasiert; eine direkte Zwei-Wege-Synchronisierung mit Google Calendar, Apple Calendar oder Outlook ist noch nicht integriert.
- TMDB Networks und Produktionsfirmen bleiben Metadaten und kein universeller offizieller Original-Schalter.
- Für eine öffentlich gehostete Multi-User-Version sollte TMDB später über ein Backend/Proxy angebunden werden.

## Status

`v0.0.8` – Release calendar, timeline & iCalendar export
