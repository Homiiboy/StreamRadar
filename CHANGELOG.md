# Changelog

Alle relevanten Änderungen an StreamRadar werden hier ab der ersten Version nach Semantic Versioning dokumentiert.

## [0.0.4] - 2026-09-01

### Added
- Echte Original-Network-/Studio-Logos aus den TMDB-Metadaten (`logo_path`).
- Logos für erkannte Original-Marken direkt auf Release-Karten.
- Original-Logo in der Detailansicht neben „Original von …“.
- Network-/Brand-Logos in der gemeinsamen Markenleiste, sobald für die Marke ein TMDB-Logo erkannt wurde.
- Vollständige Original-Marken in der Markenleiste, darunter nun auch eigenständige Einträge wie HBO und Sky.
- Neues Styling in `v004.css` für Network-Logos, Logo-Badges und Detailansicht.

### Changed
- Original-Erkennung speichert neben Marke, Sicherheit und Evidenz nun auch Logo-Pfad und Logo-Quelle (`network` oder `production_company`).
- Markenleiste unterscheidet weiterhin logisch zwischen Streaming-Provider und Original-Marke, verwendet aber nach Möglichkeit jeweils das echte Logo.
- Original-Synchronisierung aktualisiert Logos während der laufenden TMDB-Anreicherung dynamisch.
- Detail-Attribution nennt nun ausdrücklich TMDB als Quelle für Network-/Studio-Logos.
- Versionsanzeige auf v0.0.4 aktualisiert.

### Documentation
- Changelog rückwirkend für v0.0.1 und v0.0.2 vervollständigt, damit die gesamte Entwicklungshistorie ab der ersten Version dokumentiert ist.

## [0.0.3] - 2026-09-01

### Added
- Original-Brand-Erkennung über TMDB Networks und Produktionsfirmen.
- Unterstützte Original-Marken: Netflix, HBO, HBO Max, Disney+, Hulu, FX, Prime Video, Apple TV+, Paramount+, Peacock, AMC+, Crunchyroll, BBC, Sky, Joyn, RTL+ und ORF.
- Original-Filter und separater Filter nach Original-Marke.
- Erkennungssicherheit (`high` / `medium`) für Original-Zuordnungen.
- TVmaze-Client ohne zusätzlichen API-Key.
- Serien-Lookup über IMDb-/TVDB-IDs mit Titel-Fallback.
- Anzeige der nächsten Episode in der Detailansicht.
- Erkennung eines neuen Staffelstarts, wenn die nächste Episode Episode 1 einer höheren Staffel ist.
- Auswertung kommender Episoden für den Serien-Radar.
- TVmaze-Network/Web-Channel in der Detailansicht.
- `VERSION`-Datei als zentrale Versionsreferenz.
- SemVer-Regeln in README und Changelog.
- CI-Prüfung für JavaScript-Syntax und Versionskonsistenz.

### Changed
- Streaming-Provider und Original-Ursprung werden getrennt dargestellt.
- Ein Titel kann beispielsweise als „Original von FX“ markiert sein und gleichzeitig „läuft in Österreich bei Disney+“ anzeigen.
- Detailansicht zeigt Original-Marke, Erkennungssicherheit und TVmaze-Daten.
- Originals-Schalter wurde aktiviert, nachdem eine nachvollziehbare Herkunftserkennung vorhanden war.
- Versionsanzeige auf v0.0.3 aktualisiert.

## [0.0.2] - 2026-09-01

### Added
- Erste echte Live-Datenanbindung über The Movie Database (TMDB).
- TMDB Discover für Filme und Serien.
- Deutsche Titel, Beschreibungen und Metadaten über `de-DE`.
- Österreichische Watch-Provider über `watch_region=AT`.
- Reale Poster und Backdrops von TMDB.
- Provider-Erkennung für Netflix, Disney+, Prime Video, HBO Max, Apple TV+, Paramount+, Crunchyroll, Sky/WOW, Joyn, RTL+ und ORF.
- Echte Provider-Logos aus TMDB.
- Automatische Zusammenführung identischer TMDB-Titel, wenn sie bei mehreren Diensten verfügbar sind.
- Detailansicht mit Genres, Laufzeit bzw. Staffelanzahl, TMDB-Wertung und österreichischen Streaming-Providern.
- Radar-Zeitraum mit ungefähr 35 Tagen Rückblick und 90 Tagen Vorschau.
- „Demnächst“-Ansicht für die nächsten 30 Tage.
- Lokale Konfiguration des TMDB API Read Access Tokens im Browser.
- Refresh-/Synchronisieren-Schaltfläche.
- Demo-Fallback bei fehlendem Token, ungültiger Authentifizierung oder nicht erreichbarem TMDB-Dienst.
- JustWatch-Attribution für Streaming-Verfügbarkeitsdaten über TMDB.
- Erste GitHub-Actions-Prüfung für JavaScript-Syntax.

### Changed
- Demo-Karten wurden durch echte TMDB-Daten ersetzt, sobald ein gültiger Token vorhanden ist.
- Provider-Mapping wurde gegen ungenaue Namensübereinstimmungen gehärtet.
- Discover-Sortierung und Fortschrittsanzeige für die Daten-Synchronisierung wurden verbessert.
- Merkliste und bestehende Filter blieben mit den Live-Daten kompatibel.
- Versionsanzeige auf v0.0.2 aktualisiert.

### Notes
- Die Original-Erkennung war in dieser Version bewusst noch deaktiviert, da TMDB keinen universellen „Original“-Schalter liefert und eine unzuverlässige Zuordnung vermieden werden sollte.

## [0.0.1] - 2026-09-01

### Added
- Erstes statisches Frontend-MVP von StreamRadar.
- Responsive Dark-Mode-Oberfläche mit eigenem Radar-Design.
- Hero-Bereich mit animierter Radar-Darstellung.
- Marken-/Providerleiste als Filterbasis.
- Ausgangsliste mit Netflix, Disney+, Prime Video, HBO Max, Apple TV+, Paramount+, Crunchyroll, FX, Hulu, Peacock, AMC+, BBC, Sky/WOW, Joyn, RTL+ und ORF.
- Freitextsuche nach Titeln und Marken.
- Filter nach Medientyp: Serie, Film und Anime.
- Filter nach Zeitraum: Heute, diese Woche, dieser Monat und demnächst.
- Vorbereitung eines Originals-Filters.
- Ansichten „Entdecken“, „Demnächst“ und „Merkliste“.
- Lokale Merkliste auf Basis von `localStorage`.
- Detaildialog für einzelne Releases.
- Responsive Darstellung für Desktop, Tablet und Smartphone.
- Demo-Datensatz als Platzhalter vor der ersten API-Anbindung.
- Statischer Betrieb ohne Build-Schritt; Start über einen einfachen HTTP-Server möglich.
- README mit erster Projektstruktur und geplantem Datenquellen-Konzept.

### Notes
- v0.0.1 war bewusst eine reine Frontend-/UX-Grundlage ohne externe API-Abhängigkeiten.
