# StreamRadar

StreamRadar ist ein persönlicher Release-Radar für neue Filme, Serien, Anime, Originals und neue Staffeln aus wichtigen Streaming-Marken – optimiert für Österreich.

## Aktuelle Version: v0.0.4

### Neu

- echte Original-Network-/Studio-Logos direkt aus TMDB
- Original-Logos auf Release-Karten und in der Detailansicht
- Markenleiste verwendet nach Möglichkeit das echte Logo für Streaming-Provider und Original-Marken
- vollständige Original-Markenliste in der Markenleiste, inklusive eigenständiger Herkunftsmarken wie HBO und Sky
- weiterhin klare Trennung zwischen **„Original von“** und **„läuft in Österreich bei“**
- vollständiger Changelog zurück bis v0.0.1

## Datenquellen

- **TMDB** – Titel, Metadaten, Bilder, Networks, Produktionsfirmen, Network-/Studio-Logos, externe IDs und Watch-Provider
- **JustWatch via TMDB** – Streaming-Verfügbarkeit in Österreich
- **TVmaze** – Episoden, Staffeln und kommende Episoden

TVmaze benötigt keinen API-Key. Der TMDB API Read Access Token wird nur lokal im Browser gespeichert.

## Original-Erkennung

Die Original-Zuordnung ist bewusst heuristisch:

- Network-Treffer, z. B. `FX`, `HBO`, `Netflix` → hohe Sicherheit
- Produktionsfirmen, z. B. `FX Productions` oder `Amazon MGM Studios` → mittlere Sicherheit

Ab v0.0.4 übernimmt StreamRadar zusätzlich den von TMDB gelieferten `logo_path` des erkannten Networks bzw. der passenden Produktionsfirma. Dadurch kann die UI neben dem Namen auch das echte Herkunftslogo anzeigen.

Beispiel:

```text
Original von: FX   [FX-Logo]
Läuft in Österreich bei: Disney+
```

Das ist für das Projekt wichtiger als Streaming-Anbieter und Ursprungsmarke gleichzusetzen.

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

Während `0.x` befindet sich StreamRadar noch in der frühen Entwicklungsphase. Die Release-Reihenfolge bleibt dennoch eindeutig (`0.0.1` → `0.0.2` → `0.0.3` → `0.0.4`).

Siehe auch [`CHANGELOG.md`](CHANGELOG.md) und [`VERSION`](VERSION).

## Projektstruktur

```text
StreamRadar/
├── .github/workflows/validate.yml
├── index.html
├── styles.css
├── v003.css
├── v004.css
├── tmdb.js
├── tvmaze.js
├── app.js
├── VERSION
├── CHANGELOG.md
└── README.md
```

## Grenzen von v0.0.4

- TMDB liefert nicht für jedes Network bzw. jede Produktionsfirma ein Logo; in diesem Fall fällt StreamRadar sauber auf die Textdarstellung zurück.
- Filme lassen sich nicht immer eindeutig als Streaming-Original klassifizieren; Produktionsfirmen sind nur ein Indiz.
- TVmaze kann nicht jede internationale Streamingserie perfekt abbilden.
- Neue Staffeln werden aktuell in der Detailansicht erkannt; ein globaler Staffel-Feed folgt später.
- Für eine öffentlich gehostete Multi-User-Version sollte TMDB über ein Backend/Proxy angebunden werden.

## Status

`v0.0.4` – Original brand logos & complete release history
