# StreamRadar

StreamRadar ist ein persönlicher Release-Radar und Streaming-Kalender für Filme, Serien, Anime, Originals, neue Staffeln und Episoden – optimiert für Österreich.

## Aktuelle Version: v0.0.10

### Neu in v0.0.10

v0.0.10 ist bewusst ein **Bugfix-/Polish-Release** vor v0.1.0. Der Schwerpunkt liegt auf Konsistenz, Stabilität und UX statt auf neuen großen Datenquellen.

- Filter-Handler für Medientyp, Release-Typ, Zeitraum, Herkunft und Originals greifen wieder korrekt durch die v0.0.9-Personalisierung
- **Meine Anbieter** kann dadurch nicht mehr versehentlich umgangen werden
- Schutz gegen parallele/doppelte Live-Synchronisierungen
- Refresh-Button zeigt einen echten Busy-State und ist während laufender Synchronisierung gesperrt
- lokaler Radar-Cache wird beim Start strukturell validiert
- beschädigte, fremde oder unvollständige Cache-Einträge werden entfernt
- Cache wird dedupliziert und kompakter gespeichert
- bei knappem LocalStorage-Budget wird die Snapshot-Größe stufenweise reduziert statt den Cache komplett zu verlieren
- gespeicherte Provider-Auswahl wird gegen die aktuell unterstützten Provider bereinigt
- Merkliste wird robuster normalisiert und beim Import werden nur tatsächlich neue Einträge gemeldet
- kaputte Poster-/Logo-URLs bekommen einen visuellen Fallback statt Browser-Broken-Image-Symbolen
- Tag/Woche/90-Tage-Kalender werden als fokussierte Timeline dargestellt; das Monatsraster bleibt der Monatsansicht vorbehalten
- verbesserte Tastatur-Fokusmarkierungen
- `prefers-reduced-motion` wird berücksichtigt
- kleinere Mobile-Verbesserungen für Filter, Navigation und Kalendersteuerung
- neue Runtime-Schicht `polish.js` und Styling in `v0010.css`

## Lokaler Radar-Cache

Seit v0.0.9 speichert StreamRadar den letzten vollständigen Radar lokal im Browser. v0.0.10 härtet dieses Verhalten ab.

```text
StreamRadar öffnen
      ↓
Cache vorhanden?
      ↓
Struktur + Region prüfen
      ↓
Einträge bereinigen / deduplizieren
      ↓
lokale Daten sofort anzeigen
      ↓
TMDB + TVmaze live aktualisieren
      ↓
kompakten Snapshot speichern
```

Der normale Sofort-Cache besitzt weiterhin eine TTL von sechs Stunden. Bei Netzwerk- oder API-Problemen darf ein älterer Cache als Fallback verwendet werden.

Der TMDB API Read Access Token wird **nicht** im Radar-Cache gespeichert.

## Meine Anbieter

Unter ⚙ können die Streaming-Dienste ausgewählt werden, die für den persönlichen Feed relevant sind. Der Schalter **Meine Anbieter** aktiviert den Multi-Provider-Filter für Feed, Kalender und Timeline.

v0.0.10 korrigiert einen v0.0.9-Edge-Case: Änderungen an anderen Filtern laufen nun immer durch dieselbe Personalisierungsschicht. Dadurch bleibt die persönliche Provider-Auswahl konsistent aktiv.

## Sortierung

StreamRadar bietet folgende persistente Sortierungen:

- **Relevanz** – zeitliche Nähe, Release-Typ und Popularität
- **Datum** – bald erscheinende Events zuerst
- **Beliebtheit** – TMDB-Popularität zuerst
- **TMDB-Wertung** – Bewertung zuerst, Popularität als Tie-Breaker

## Merkliste

Die Merkliste bleibt in `localStorage` und kann als JSON-Datei exportiert bzw. wieder importiert werden. IDs werden normalisiert und dedupliziert. v0.0.10 zeigt beim Import nun die Zahl der tatsächlich neu hinzugefügten Einträge statt nur die Zahl der Datensätze in der Datei.

## Release-Kalender

Seit v0.0.8 besitzt StreamRadar eine Kalenderansicht mit:

```text
Tag
Woche
Monat
90 Tage
```

Die Monatsansicht zeigt ein klassisches Monatsraster plus Timeline. Tag, Woche und 90 Tage fokussieren ab v0.0.10 stärker auf die chronologische Timeline, damit kein irreführendes Monatsraster parallel angezeigt wird.

Dazu kommen Provider-/Herkunftsfilter, Nur-Merkliste-Modus und `.ics`-/iCalendar-Export.

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

Release-Reihenfolge: `0.0.1` → `0.0.2` → `0.0.3` → `0.0.4` → `0.0.5` → `0.0.6` → `0.0.7` → `0.0.8` → `0.0.9` → `0.0.10`.

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
├── v0010.css
├── original-overrides.js
├── tmdb.js
├── tvmaze.js
├── app.js
├── calendar.js
├── stability.js
├── polish.js
├── VERSION
├── CHANGELOG.md
└── README.md
```

## Grenzen von v0.0.10

- Cache, Einstellungen und Merkliste sind weiterhin browserlokal und nicht geräteübergreifend synchronisiert.
- `localStorage` bleibt eine Übergangslösung; für eine spätere Desktop-/Server-Version ist SQLite sinnvoller.
- Die 90-Tage-Kalenderansicht kann bei Episoden durch den kürzeren TVmaze-Schedule weniger vollständig sein.
- Der `.ics`-Export ist dateibasiert und keine Zwei-Wege-Synchronisierung.
- Für eine öffentlich gehostete Multi-User-Version sollte TMDB später über ein Backend/Proxy angebunden werden.

## Status

`v0.0.10` – Bugfix, polish & pre-v0.1.0 hardening
