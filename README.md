# StreamRadar

StreamRadar ist ein persönlicher Release-Radar für neue Filme, Serien, Anime, Originals, neue Staffeln und Episoden aus wichtigen Streaming-Marken – optimiert für Österreich.

## Aktuelle Version: v0.0.5

### Neu

- echte Release-Klassifizierung statt einer reinen Film-/Serien-Liste
- getrennte Ereignistypen **Film-Premiere**, **Neue Serie**, **Neue Staffel** und **Neue Episode**
- eigener Filter nach Release-Typ
- TV-Discovery über Ausstrahlungen im Radar-Zeitraum statt ausschließlich über das ursprüngliche `first_air_date`
- laufende ältere Serien können dadurch als aktuelle Staffel-/Episodenereignisse auftauchen
- Film-Releases werden mit den österreichischen TMDB-`release_dates` abgeglichen und bevorzugen Digital-/TV-Releases
- Staffelstarts werden über TMDB-Staffeldaten und Episodenmetadaten erkannt
- staffelspezifische Watch-Provider für Österreich in der Detailansicht
- zweistufige Deduplizierung über TMDB-IDs und einen Release-Fingerprint
- bestehende Merkliste bleibt über stabile Serien-/Film-IDs kompatibel
- neue Event-Badges und Release-Detailbox in `v005.css`

## Release-Intelligence

StreamRadar behandelt einen Titel ab v0.0.5 als **Release-Event**. Das bedeutet beispielsweise:

```text
The Example Show
Neue Staffel 3
12. Sep.
Original von: FX
Läuft in Österreich bei: Disney+
```

oder:

```text
Example Movie
Digital-Premiere
18. Sep.
Läuft in Österreich bei: Prime Video
```

Für Serien priorisiert die Klassifizierung:

1. einen neuen Serienstart,
2. einen neuen Staffelstart,
3. eine aktuelle bzw. kommende Episode.

Dadurch soll eine laufende Serie nicht mehr mit ihrem Jahre alten Serienstart als aktuelles Release angezeigt werden.

## Datenquellen

- **TMDB** – Titel, Metadaten, Bilder, Networks, Produktionsfirmen, Release-Dates, Staffeln, Episodenmetadaten, Network-/Studio-Logos und Watch-Provider
- **JustWatch via TMDB** – Streaming-Verfügbarkeit in Österreich, inklusive staffelspezifischer Provider wenn verfügbar
- **TVmaze** – zusätzliche Episoden-, Staffel- und kommende Episodendaten in der Detailansicht

TVmaze benötigt keinen API-Key. Der TMDB API Read Access Token wird nur lokal im Browser gespeichert.

## Original-Erkennung

Die Original-Zuordnung ist weiterhin bewusst heuristisch:

- Network-Treffer, z. B. `FX`, `HBO`, `Netflix` → hohe Sicherheit
- Produktionsfirmen, z. B. `FX Productions` oder `Amazon MGM Studios` → mittlere Sicherheit

Seit v0.0.4 übernimmt StreamRadar zusätzlich den von TMDB gelieferten `logo_path` des erkannten Networks bzw. der passenden Produktionsfirma.

## Deduplizierung

v0.0.5 führt Release-Ereignisse zweistufig zusammen:

- primär über TMDB-ID + Release-Typ + Datum + Staffel/Episode
- sekundär über einen exakten Fingerprint aus normalisiertem Titel, Datum, Release-Typ und Staffel/Episode

Bei Duplikaten werden Streaming-Provider und Logos zusammengeführt. Unterschiedliche Episoden oder unterschiedliche Staffelstarts bleiben getrennte Ereignisse.

## Starten

```bash
python -m http.server 8080
```

Dann `http://localhost:8080` öffnen und unter ⚙ den TMDB **API Read Access Token** hinterlegen.

## Versionierung

StreamRadar verwendet konsequent **Semantic Versioning (SemVer)** im Schema:

```text
MAJOR.MINOR.PATCH
```

- `PATCH`: Fehlerbehebungen und kleine kompatible Verbesserungen
- `MINOR`: größere rückwärtskompatible Feature-Pakete
- `MAJOR`: Breaking Changes / grundlegende Neustrukturierung

Während `0.x` befindet sich StreamRadar noch in der frühen Entwicklungsphase. Die Release-Reihenfolge bleibt eindeutig (`0.0.1` → `0.0.2` → `0.0.3` → `0.0.4` → `0.0.5`).

Siehe auch [`CHANGELOG.md`](CHANGELOG.md) und [`VERSION`](VERSION).

## Projektstruktur

```text
StreamRadar/
├── .github/workflows/validate.yml
├── index.html
├── styles.css
├── v003.css
├── v004.css
├── v005.css
├── tmdb.js
├── tvmaze.js
├── app.js
├── VERSION
├── CHANGELOG.md
└── README.md
```

## Grenzen von v0.0.5

- Der globale Episoden-/Staffel-Feed wird noch nicht direkt aus einem vollständigen TV-Kalender erzeugt; das ist für v0.0.6 vorgesehen.
- TMDB kann je nach Titel/Region unvollständige Release-, Staffel- oder Providerdaten haben.
- Film-Release-Typen sind nicht immer identisch mit einer exklusiven Streaming-Premiere; StreamRadar bevorzugt für den Streaming-Radar Digital- und TV-Releases, wenn TMDB diese für Österreich liefert.
- TVmaze kann nicht jede internationale Streamingserie perfekt abbilden.
- Für eine öffentlich gehostete Multi-User-Version sollte TMDB über ein Backend/Proxy angebunden werden.

## Status

`v0.0.5` – Release classification & stronger deduplication
