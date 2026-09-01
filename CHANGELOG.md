# Changelog

Alle relevanten Änderungen an StreamRadar werden hier ab der ersten Version nach Semantic Versioning dokumentiert.

## [0.0.6] - 2026-09-01

### Added
- Globaler Staffel- und Episoden-Radar über den TVmaze Web-/Streaming-Schedule.
- Abfrage des Streaming-Schedules von gestern bis 14 Tage in die Zukunft.
- Matching von TVmaze-Serien gegen bereits für Österreich relevante TMDB-Kandidaten über IMDb-ID, TVDB-ID und exakten Titel-Fallback.
- Eigenständige Release-Events für kommende Streaming-Episoden direkt im Hauptfeed.
- Automatische Erkennung von Staffelstarts aus TVmaze, wenn Episode 1 einer Staffel > 1 im Schedule erscheint.
- Automatische Erkennung von Serienpremieren bei S1E1.
- Bis zu vier kommende TVmaze-Schedule-Events pro Serie, damit einzelne tägliche Serien den Feed nicht dominieren.
- Eigene Hauptnavigation für **Staffeln** und **Episoden**.
- Radar-Zusammenfassung mit klickbaren Kennzahlen für **Heute**, **Staffelstarts**, **Episoden der nächsten 14 Tage** und **Premieren der nächsten 30 Tage**.
- Sichtbares `TVMAZE ✓`-Kennzeichen bei durch den globalen Schedule bestätigten Ereignissen.
- TVmaze-Web-Channel, Laufzeit und Sendezeit werden bei Schedule-Events übernommen.
- Direkter Link zur konkreten TVmaze-Episode in der Detailansicht, sofern vorhanden.
- Retry-Behandlung für TVmaze-HTTP-429-Antworten.
- Neues Styling in `v006.css` für Radar-Zusammenfassung, Schedule-Badges und die erweiterte Navigation.

### Changed
- TVmaze wird nicht mehr nur in der Detailansicht verwendet, sondern ist jetzt eine aktive Datenquelle des Hauptfeeds.
- Der globale TVmaze-Schedule wird bewusst nur mit Serien zusammengeführt, die durch die TMDB-/Provider-Discovery bereits als für Österreich relevant erkannt wurden.
- TMDB bleibt die Quelle für österreichische Provider-Relevanz; TVmaze ergänzt konkrete Web-/Streaming-Ausstrahlungen.
- Wenn TMDB und TVmaze dasselbe Staffel-/Episodenereignis liefern, werden beide Informationen durch die bestehende Deduplizierung zusammengeführt statt doppelt angezeigt.
- Bei zusammengeführten Events bleiben TMDB-Provider, Original-Marke und Logos erhalten; TVmaze ergänzt Schedule-Bestätigung, Episodenname, Channel, Laufzeit und Link.
- Die Detailansicht überschreibt ein konkretes TVmaze-Schedule-Event nicht mehr mit der allgemeineren TMDB-Klassifizierung.
- Statusleiste zeigt nach der Synchronisierung Anzahl der Staffel-, Episoden- und TVmaze-Schedule-Events.
- Versionsanzeige auf v0.0.6 aktualisiert.

### Notes
- Der TVmaze Web Schedule bildet globale und lokale Web-Channels ab. StreamRadar übernimmt daraus nur Treffer, die zu österreichisch relevanten TMDB-Kandidaten passen.
- Der globale Episoden-Radar verwendet in v0.0.6 bewusst einen 14-Tage-Horizont. Eine umfangreichere Kalender-/Timeline-Ansicht ist für einen späteren Release vorgesehen.

## [0.0.5] - 2026-09-01

### Added
- Neue Release-Intelligence-Schicht mit getrennten Ereignistypen für **Film-Premiere**, **Neue Serie**, **Neue Staffel** und **Neue Episode**.
- Neuer Filter nach Release-Typ in der Hauptansicht.
- Eigene Event-Badges auf Release-Karten mit visueller Unterscheidung der Release-Arten.
- Release-Detailbox in der Detailansicht mit konkretem Ereignis, Staffel/Episode und Datum.
- Österreichische Film-Release-Klassifizierung über TMDB `release_dates`.
- Bevorzugung von Digital- und TV-Releases für den Streaming-Radar, sofern TMDB entsprechende österreichische Daten liefert.
- Staffelstart-Erkennung über TMDB-Staffeldaten.
- Episodenklassifizierung über `next_episode_to_air` und `last_episode_to_air`.
- Staffelspezifische Watch-Provider-Abfrage über den TMDB-Season-Watch-Provider-Endpunkt.
- Zweistufige Deduplizierung über stabile TMDB-Event-Keys und einen sekundären Titel-/Datum-/Staffel-/Episoden-Fingerprint.
- Neues Styling in `v005.css`.

### Changed
- TV-Discovery verwendet für den Radar nun Ausstrahlungsdaten im aktuellen Zeitfenster (`air_date`) statt nur das ursprüngliche `first_air_date` einer Serie.
- Laufende ältere Serien können dadurch als aktuelle Staffel- oder Episodenereignisse erkannt werden.
- Neue Serien werden weiterhin bevorzugt als **Neue Serie** dargestellt; Staffelstarts haben gegenüber normalen Episoden Priorität.
- Der Radar zählt und zeigt nun Release-Events statt lediglich Medientitel.
- Die Merkliste bleibt auf der stabilen Film-/Serien-ID verankert, damit Staffel-/Episodenklassifizierung bestehende gespeicherte Titel nicht ungültig macht.
- Doppelte Provider-Treffer werden zusammengeführt, ohne unterschiedliche echte Release-Ereignisse fälschlich zu verschmelzen.
- Versionsanzeige auf v0.0.5 aktualisiert.

### Notes
- Der vollständig globale Staffel-/Episoden-Kalender über alle relevanten Serien ist weiterhin für v0.0.6 vorgesehen. v0.0.5 verbessert zunächst die Klassifizierung der durch Provider-/TMDB-Discovery gefundenen Titel.

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
