# StreamRadar

StreamRadar ist ein persönlicher Release-Radar für neue Filme, Serien, Anime und neue Staffeln aus wichtigen Streaming-Marken.

## Version 0.0.1

Die erste Version ist ein statisches Frontend-MVP ohne externe API-Abhängigkeiten.

Enthalten:

- responsive Dark-Mode-Oberfläche
- Anbieterfilter für Netflix, Disney+, Prime Video, HBO Max, Apple TV+, Paramount+, Crunchyroll, FX, Hulu, Peacock, AMC+, BBC, Sky/WOW, Joyn, RTL+ und ORF
- Suche
- Filter nach Medientyp, Zeitraum und Originals
- Ansichten für Entdecken, Demnächst und Merkliste
- lokale Merkliste via `localStorage`
- Detaildialog für Releases
- Demo-Datensatz als Platzhalter für die kommende API-Anbindung

## Starten

Es ist kein Build-Schritt notwendig. Einfach `index.html` im Browser öffnen oder das Repository über einen beliebigen statischen Webserver bereitstellen.

Beispiel mit Python:

```bash
python -m http.server 8080
```

Danach `http://localhost:8080` öffnen.

## Geplanter nächster Schritt

Für v0.0.2 / v0.1.0 soll das Frontend an echte Datenquellen angebunden werden. Vorgesehene Basis:

- TMDB für Titel, Metadaten, Bilder, Trends und Watch-Provider
- TVmaze für Serien-/Episoden-Kalender
- optional Watchmode für detailliertere Provider-Änderungen
- eigene Datenhaltung für Original-Zuordnung, Overrides und Nutzerstatus

## Projektstruktur

```text
StreamRadar/
├── index.html
├── styles.css
├── app.js
└── README.md
```

## Status

`v0.0.1` – Frontend foundation / prototype
