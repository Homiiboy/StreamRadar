# StreamRadar

StreamRadar ist ein persönlicher Release-Radar für neue Filme, Serien, Anime, Originals und neue Staffeln aus wichtigen Streaming-Marken – optimiert für Österreich.

## Aktuelle Version: v0.0.3

### Neu

- Original-Brand-Erkennung auf Basis von TMDB Networks und Produktionsfirmen
- klare Trennung zwischen **„Original von“** und **„läuft in Österreich bei“**
- Original-Filter und eigener Filter nach Original-Marke
- unterstützte Original-Marken u. a. Netflix, HBO, HBO Max, Disney+, Hulu, FX, Prime Video, Apple TV+, Paramount+, Peacock, AMC+, Crunchyroll, BBC, Sky, Joyn, RTL+ und ORF
- Erkennungssicherheit (`high` / `medium`) statt einer vorgetäuschten 100-%-Zuordnung
- TVmaze-Anbindung für Serien
- Anzeige der nächsten Episode
- Erkennung eines neuen Staffelstarts, wenn die nächste Episode Episode 1 einer höheren Staffel ist
- bis zu 8 kommende Episoden werden intern ausgewertet
- TVmaze-Network/Web-Channel in der Detailansicht
- Version zentral als `0.0.3` geführt und Changelog eingeführt

## Datenquellen

- **TMDB** – Titel, Metadaten, Bilder, Networks, Produktionsfirmen, externe IDs und Watch-Provider
- **JustWatch via TMDB** – Streaming-Verfügbarkeit in Österreich
- **TVmaze** – Episoden, Staffeln und kommende Episoden

TVmaze benötigt keinen API-Key. Der TMDB API Read Access Token wird nur lokal im Browser gespeichert.

## Original-Erkennung

Die Original-Zuordnung ist bewusst heuristisch:

- Network-Treffer, z. B. `FX`, `HBO`, `Netflix` → hohe Sicherheit
- Produktionsfirmen, z. B. `FX Productions` oder `Amazon MGM Studios` → mittlere Sicherheit

Damit kann StreamRadar beispielsweise unterscheiden:

```text
Original von: FX
Läuft in Österreich bei: Disney+
```

Das ist für das Projekt wichtiger als Streaming-Anbieter und Ursprungsmarke gleichzusetzen.

## Starten

```bash
python -m http.server 8080
```

Dann `http://localhost:8080` öffnen und unter ⚙ den TMDB **API Read Access Token** hinterlegen.

## Versionierung

StreamRadar verwendet ab jetzt konsequent **Semantic Versioning (SemVer)** im Schema:

```text
MAJOR.MINOR.PATCH
```

- `PATCH`: Fehlerbehebungen ohne neue öffentliche Funktion
- `MINOR`: rückwärtskompatible Features
- `MAJOR`: Breaking Changes / grundlegende Neustrukturierung

Während `0.x` befindet sich StreamRadar noch in der frühen Entwicklungsphase. Die vom Projekt gewünschte Release-Reihenfolge bleibt dennoch eindeutig (`0.0.1` → `0.0.2` → `0.0.3`).

Siehe auch [`CHANGELOG.md`](CHANGELOG.md) und [`VERSION`](VERSION).

## Projektstruktur

```text
StreamRadar/
├── .github/workflows/validate.yml
├── index.html
├── styles.css
├── v003.css
├── tmdb.js
├── tvmaze.js
├── app.js
├── VERSION
├── CHANGELOG.md
└── README.md
```

## Grenzen von v0.0.3

- Filme lassen sich nicht immer eindeutig als Streaming-Original klassifizieren; Produktionsfirmen sind nur ein Indiz.
- TVmaze kann nicht jede internationale Streamingserie perfekt abbilden.
- Neue Staffeln werden aktuell in der Detailansicht erkannt; ein globaler Staffel-Feed folgt später.
- Für eine öffentlich gehostete Multi-User-Version sollte TMDB über ein Backend/Proxy angebunden werden.

## Status

`v0.0.3` – Originals & TV episode intelligence
