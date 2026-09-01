# StreamRadar

StreamRadar ist ein persönlicher Release-Radar für Filme, Serien, Anime, Originals, neue Staffeln und Episoden – optimiert für Österreich.

## Aktuelle Version: v0.0.7

### Neu in v0.0.7

- gewichtete **Origin Intelligence** statt „erster Treffer gewinnt“
- klare Trennung zwischen **Streaming-Original**, **Network/Broadcaster**, **Studio** und **Herkunftsmarke**
- Studios wie **Marvel Studios, Lucasfilm, Pixar, Warner Bros., Sony Pictures und A24** werden nicht automatisch als Streaming-Original klassifiziert
- deutlich erweiterte Network-/Brand-Abdeckung, u. a. **Showtime, CBS, NBC, ABC, FOX, Starz und CANAL+**
- Bewertung über Network- und Produktionsfirmen-Evidenz mit nachvollziehbarem Score
- Detailansicht zeigt Herkunftstyp, Evidenz, Score und Erkennungssicherheit
- separate manuelle Korrekturschicht in `original-overrides.js`
- Overrides können einzelne TMDB-IDs erzwingen oder eine automatische Zuordnung ausdrücklich ablehnen
- Herkunftsbadges unterscheiden `ORIGINAL`, `STUDIO`, `BRAND` und `MANUELL`
- der Filter **Nur Originals** berücksichtigt nur Zuordnungen, die tatsächlich als Original-Signal qualifizieren
- globaler TVmaze Staffel-/Episodenradar aus v0.0.6 bleibt vollständig erhalten

## Origin Intelligence

TMDB liefert bei Serien Networks und bei Filmen/Serien Produktionsfirmen. StreamRadar bewertet diese Signale ab v0.0.7 getrennt.

Beispiele:

```text
Network: FX
→ Original von FX
→ hohe Sicherheit
```

```text
Production Company: Marvel Studios
→ Studio / Brand: Marvel Studios
→ kein automatisches Streaming-Original
```

```text
Network: HBO
Provider Österreich: HBO Max
→ Original von HBO
→ läuft in Österreich bei HBO Max
```

Network-Treffer sind stärker gewichtet als Produktionsfirmen. Produktionsfirmen können weiterhin ein Original-Signal liefern, wenn sie eng an eine Streaming-Plattform gebunden sind, z. B. Apple Studios oder Amazon MGM Studios. Klassische Studios und Franchisemarken bleiben dagegen Herkunftsinformation.

## Manuelle Overrides

`original-overrides.js` ist die Korrekturschicht für Sonderfälle. Regeln sind absichtlich von der allgemeinen Heuristik getrennt.

```js
EXACT['tv:12345'] = {
  action: 'force',
  brand: 'FX',
  originType: 'network',
  qualifiesAsOriginal: true,
  note: 'Manuell bestätigt.'
};
```

Oder eine falsche automatische Zuordnung ausschließen:

```js
EXACT['movie:67890'] = {
  action: 'deny',
  note: 'Produktionsfirma ist hier kein belastbares Original-Signal.'
};
```

Standardmäßig enthält die Datei keine erfundenen Titelkorrekturen. Overrides werden erst ergänzt, wenn ein konkreter Fehlfall bekannt ist.

## Release- und Episodenradar

StreamRadar behandelt Titel als Release-Events:

- **Film-Premiere** / Digital- oder TV-Premiere
- **Neue Serie**
- **Neue Staffel**
- **Neue Episode**

TMDB/JustWatch bestimmen die österreichische Provider-Relevanz. TVmaze ergänzt einen globalen Web-/Streaming-Schedule von gestern bis 14 Tage in die Zukunft. TVmaze-Ereignisse werden nur übernommen, wenn sie zu einem bereits österreichisch relevanten TMDB-Titel passen.

## Datenquellen

- **TMDB** – Titel, Metadaten, Bilder, Networks, Produktionsfirmen, Release-Dates, Staffeln, Episodenmetadaten, Logos und Watch-Provider
- **JustWatch via TMDB** – Streaming-Verfügbarkeit in Österreich
- **TVmaze** – globaler Web-/Streaming-Schedule, Episoden, Staffeln, Web-Channels und kommende Episoden

Der TMDB API Read Access Token wird nur lokal im Browser gespeichert. TVmaze benötigt keinen API-Key.

## Deduplizierung

Release-Ereignisse werden zweistufig zusammengeführt:

- primär über TMDB-ID + Release-Typ + Datum + Staffel/Episode
- sekundär über einen Fingerprint aus normalisiertem Titel, Datum, Release-Typ und Staffel/Episode

TMDB- und TVmaze-Treffer desselben Events werden verschmolzen; Provider, Herkunftsmetadaten, Logos und Schedule-Daten bleiben dabei erhalten.

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

Während `0.x` befindet sich StreamRadar in der frühen Entwicklungsphase. Release-Reihenfolge: `0.0.1` → `0.0.2` → `0.0.3` → `0.0.4` → `0.0.5` → `0.0.6` → `0.0.7`.

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
├── original-overrides.js
├── tmdb.js
├── tvmaze.js
├── app.js
├── VERSION
├── CHANGELOG.md
└── README.md
```

## Grenzen von v0.0.7

- TMDB Networks und Produktionsfirmen sind Metadaten, kein universeller offizieller „Original“-Schalter.
- Produktionsfirmen können an einzelnen Titeln beteiligt sein, ohne Exklusivität zu bedeuten; deshalb ist deren Gewicht geringer.
- Manuelle Overrides müssen anhand konkreter Fehlklassifizierungen gepflegt werden.
- TVmaze kann nicht jede internationale Streamingserie perfekt mit TMDB verknüpfen.
- Für eine öffentlich gehostete Multi-User-Version sollte TMDB später über ein Backend/Proxy angebunden werden.

## Status

`v0.0.7` – Origin intelligence, scoring & overrides
