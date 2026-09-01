# StreamRadar

StreamRadar ist ein persönlicher Release-Radar für neue Filme, Serien und Anime aus wichtigen Streaming-Marken – optimiert für Österreich.

## Version 0.0.2

v0.0.2 verbindet das Frontend erstmals mit **The Movie Database (TMDB)** und nutzt die dort verfügbaren Watch-Provider-Daten für Österreich.

### Neu in v0.0.2

- echte Filme und Serien über TMDB Discover
- echte Poster und Backdrops
- deutsche Titel und Beschreibungen (`de-DE`)
- österreichische Watch-Provider (`watch_region=AT`)
- Provider-Erkennung für u. a. Netflix, Disney+, Prime Video, HBO Max, Apple TV+, Paramount+, Crunchyroll, Sky/WOW, Joyn, RTL+ und ORF
- automatische Zusammenführung von Titeln, die bei mehreren Providern verfügbar sind
- Detailansicht mit Genres, Laufzeit/Staffeln, TMDB-Wertung und aktuellen Streaming-Providern
- Provider-Logos aus TMDB
- 35 Tage Rückblick + 90 Tage Vorschau für den Radar
- Ansicht „Demnächst“ für die nächsten 30 Tage
- lokaler TMDB-Token-Speicher im Browser
- Refresh-/Sync-Schaltfläche
- Fallback auf Demo-Daten, wenn kein Token gesetzt ist oder TMDB nicht erreichbar ist
- JustWatch-Attribution für Streaming-Verfügbarkeitsdaten

## TMDB einrichten

StreamRadar schreibt **keinen API-Token in das Repository**.

1. Ein kostenloses TMDB-Konto erstellen bzw. anmelden.
2. In TMDB unter **Einstellungen → API** einen API-Zugang anlegen.
3. Den dort angezeigten **API Read Access Token** kopieren.
4. StreamRadar öffnen und oben auf das Zahnrad klicken.
5. Token einfügen und **„Verbinden & laden“** wählen.

Der Token wird ausschließlich im `localStorage` des verwendeten Browsers unter `streamradar-tmdb-token` gespeichert.

> Hinweis: Bei einer rein statischen Browser-App wird der Token für Requests aus dem Browser verwendet. Für eine spätere öffentlich gehostete Version sollte die TMDB-Kommunikation über ein eigenes Backend/Proxy laufen.

## Starten

Es ist weiterhin kein Build-Schritt notwendig. Am besten über einen kleinen lokalen Webserver starten:

```bash
python -m http.server 8080
```

Danach `http://localhost:8080` öffnen.

Das direkte Öffnen von `index.html` kann je nach Browser durch Sicherheitsregeln für Netzwerk-Requests eingeschränkt sein.

## Datenlogik

StreamRadar lädt für die in Österreich erkannten Provider jeweils Filme und Serien über TMDB Discover und führt identische TMDB-Titel anschließend zusammen. Dadurch kann ein Titel mehrere Provider gleichzeitig anzeigen.

Aktuell wird nach Titeln gesucht, deren Film- bzw. Serienstart in einem Fenster von ungefähr 35 Tagen in der Vergangenheit bis 90 Tagen in der Zukunft liegt. Das ist ein Release-Radar und noch kein vollständiger Katalog-Änderungstracker.

### Noch nicht in v0.0.2

- zuverlässige Original-Zuordnung zu Netflix/HBO/FX/Hulu/Peacock usw.
- Erkennung neuer Staffeln bereits laufender Serien
- Episoden-Kalender
- Watchmode-Katalogänderungen
- persistente serverseitige Datenbank
- Benutzerkonten / Sync zwischen Geräten

Die Originals-Schaltfläche ist deshalb in v0.0.2 bewusst deaktiviert, statt unzuverlässige Ergebnisse anzuzeigen.

## Geplante v0.0.3

Für die nächste Version ist vorgesehen:

- Network-/Studio-Erkennung für Originals
- Trennung zwischen `Streaming Provider` und `Original Brand`
- bessere Erkennung von Hulu-, FX-, Peacock-, HBO- und anderen Produktionen, auch wenn sie in Österreich bei einem anderen Anbieter laufen
- TVmaze-Anbindung für Episoden und neue Staffeln

## Projektstruktur

```text
StreamRadar/
├── index.html
├── styles.css
├── tmdb.js
├── app.js
└── README.md
```

## Datenquellen

- **TMDB**: Metadaten, Bilder, Bewertungen und Watch-Provider
- **JustWatch via TMDB**: Streaming-Verfügbarkeit

Die Watch-Provider-Daten von TMDB basieren auf der JustWatch-Partnerschaft und erfordern eine entsprechende Attribution.

## Status

`v0.0.2` – TMDB live data integration
