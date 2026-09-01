# StreamRadar

StreamRadar ist ein persönlicher Release-Radar für neue Filme, Serien, Anime, Originals, neue Staffeln und Episoden aus wichtigen Streaming-Marken – optimiert für Österreich.

## Aktuelle Version: v0.0.6

### Neu

- globaler Staffel- und Episoden-Radar über den **TVmaze Web Schedule**
- TVmaze wird jetzt nicht nur in der Detailansicht, sondern als aktive Feed-Datenquelle verwendet
- Streaming-Schedule von gestern bis 14 Tage in die Zukunft
- Matching gegen österreichisch relevante TMDB-Kandidaten über IMDb-ID, TVDB-ID und Titel-Fallback
- neue Staffelstarts und Episoden erscheinen direkt auf der Startseite
- eigene Hauptansichten **Staffeln** und **Episoden**
- Radar-Zusammenfassung für **Heute**, **Staffelstarts**, **Episoden** und **Premieren**
- `TVMAZE ✓` auf Schedule-bestätigten Karten
- Web-Channel, Laufzeit, Sendezeit und direkter Episodenlink aus TVmaze
- bestehende TMDB-Deduplizierung verschmilzt identische TMDB-/TVmaze-Events
- bis zu vier kommende Schedule-Ereignisse pro Serie, damit der Feed ausgewogen bleibt
- Retry-Behandlung für TVmaze-Rate-Limits
- neues Styling in `v006.css`

## Wie v0.0.6 Daten zusammenführt

StreamRadar verwendet jetzt zwei Ebenen:

```text
TMDB + JustWatch
        ↓
Welche Titel/Provider sind für Österreich relevant?
        ↓
TVmaze Web Schedule
        ↓
Wann erscheinen konkrete Streaming-Episoden?
        ↓
Deduplizierung / Release Intelligence
        ↓
StreamRadar Feed
```

Der TVmaze-Schedule wird **nicht ungefiltert** in StreamRadar übernommen. Ein TVmaze-Titel muss zu einer Serie passen, die bereits durch die TMDB-/Provider-Discovery als österreichisch relevant erkannt wurde.

Dadurch kann StreamRadar beispielsweise aus einer Serie, die bereits bei Disney+ Österreich erkannt wurde, mehrere konkrete kommende Episodenereignisse erzeugen, ohne gleichzeitig tausende internationale TVmaze-Titel in den Feed zu übernehmen.

## Release-Intelligence

StreamRadar behandelt Titel als **Release-Events**. Mögliche Ereignisse sind:

- **Film-Premiere** / Digital- oder TV-Premiere
- **Neue Serie**
- **Neue Staffel**
- **Neue Episode**

TVmaze-Schedule-Ereignisse enthalten zusätzlich – sofern vorhanden – Web-Channel, Episodenname, Laufzeit, Sendezeit und einen Link zur konkreten Episode.

## Staffel- und Episodenradar

Der globale Web-Schedule wird in v0.0.6 standardmäßig für dieses Fenster geladen:

```text
Gestern → Heute → nächste 14 Tage
```

Pro Serie werden maximal vier Schedule-Events in den Radar übernommen. Dies verhindert, dass Serien mit täglichen Episoden den kompletten Feed dominieren.

S1E1 wird als **Neue Serie** klassifiziert. Episode 1 einer Staffel größer 1 wird als **Neue Staffel** klassifiziert. Alle anderen Treffer werden als **Neue Episode** geführt.

## Datenquellen

- **TMDB** – Titel, Metadaten, Bilder, Networks, Produktionsfirmen, Release-Dates, Staffeln, Episodenmetadaten, Network-/Studio-Logos und Watch-Provider
- **JustWatch via TMDB** – Streaming-Verfügbarkeit in Österreich, inklusive staffelspezifischer Provider wenn verfügbar
- **TVmaze** – globaler Web-/Streaming-Schedule, Episoden, Staffeln, Web-Channels und kommende Episoden

TVmaze benötigt keinen API-Key. Der TMDB API Read Access Token wird nur lokal im Browser gespeichert.

## Original-Erkennung

Die Original-Zuordnung ist weiterhin bewusst heuristisch:

- Network-Treffer, z. B. `FX`, `HBO`, `Netflix` → hohe Sicherheit
- Produktionsfirmen, z. B. `FX Productions` oder `Amazon MGM Studios` → mittlere Sicherheit

Seit v0.0.4 übernimmt StreamRadar zusätzlich den von TMDB gelieferten `logo_path` des erkannten Networks bzw. der passenden Produktionsfirma.

## Deduplizierung

Release-Ereignisse werden zweistufig zusammengeführt:

- primär über TMDB-ID + Release-Typ + Datum + Staffel/Episode
- sekundär über einen exakten Fingerprint aus normalisiertem Titel, Datum, Release-Typ und Staffel/Episode

Wenn TMDB und TVmaze dasselbe Event melden, bleiben TMDB-Provider, Original-Marken und Bilder erhalten, während TVmaze Schedule-Bestätigung, Episodenname, Channel, Laufzeit und Link ergänzt.

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

Während `0.x` befindet sich StreamRadar noch in der frühen Entwicklungsphase. Die Release-Reihenfolge bleibt eindeutig (`0.0.1` → `0.0.2` → `0.0.3` → `0.0.4` → `0.0.5` → `0.0.6`).

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
├── v006.css
├── tmdb.js
├── tvmaze.js
├── app.js
├── VERSION
├── CHANGELOG.md
└── README.md
```

## Grenzen von v0.0.6

- Der globale Episodenradar deckt aktuell 14 Tage in die Zukunft ab; die spätere Kalender-/Timeline-Version wird einen längeren Planungshorizont bekommen.
- TVmaze kann nicht jede internationale Streamingserie perfekt abbilden oder mit TMDB verknüpfen.
- Ein exakter IMDb-/TVDB-ID-Treffer wird bevorzugt; Titelmatching ist nur der Fallback.
- TMDB kann je nach Titel/Region unvollständige Release-, Staffel- oder Providerdaten haben.
- Der TVmaze Web Schedule zeigt den Veröffentlichungs-/Ausstrahlungsplan des Web-Channels; die österreichische Verfügbarkeit wird weiterhin separat über TMDB/JustWatch bestimmt.
- Für eine öffentlich gehostete Multi-User-Version sollte TMDB über ein Backend/Proxy angebunden werden.

## Status

`v0.0.6` – Global season & episode radar
