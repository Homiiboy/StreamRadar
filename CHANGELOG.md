# Changelog

Alle relevanten Änderungen an StreamRadar werden hier ab der ersten Version nach Semantic Versioning dokumentiert.

## [0.0.9] - 2026-09-01

### Added
- Lokaler Radar-Snapshot-Cache mit einer normalen TTL von sechs Stunden.
- **Stale-while-revalidate**: ein frischer Cache wird beim Start sofort dargestellt, während TMDB und TVmaze im Hintergrund aktualisiert werden.
- Offline-/Netzwerkfehler-Fallback auf den letzten gespeicherten Radar statt Rückfall auf Demo-Inhalte.
- Sichtbare Online-/Offline- und Cache-Altersanzeige in der Statusleiste.
- Persistenter Multi-Provider-Filter **Meine Anbieter**.
- Provider-Auswahl in den Einstellungen mit „Alle wählen“ und „Keine wählen“.
- Persönliche Provider-Auswahl wirkt auch in Kalender und Timeline.
- Persistente Sortierung nach Relevanz, Datum, TMDB-Popularität oder TMDB-Wertung.
- Merkliste-Export als JSON-Datei.
- Merkliste-Import mit Normalisierung, Deduplizierung und Merge mit bestehenden Einträgen.
- Toast-Hinweise für Offline-Modus, Wiederverbindung, Cache-Aktionen und Merkliste-Import.
- Cache-Status und lokale Datenstatistiken in den Einstellungen.
- Neues Runtime-Modul `stability.js`.
- Neues Styling in `v009.css` für Provider-Präferenzen, Statusanzeige, Toasts und mobile Einstellungen.

### Changed
- Der Such-Handler wird leicht verzögert ausgeführt, um unnötige Feed-Neuberechnungen während des Tippens zu reduzieren.
- Die gespeicherte Merkliste wird beim Start auf String-IDs normalisiert und dedupliziert.
- Bis zu 350 Release-Events sowie Provider- und Schedule-Metadaten können lokal als letzter vollständiger Radar-Stand gespeichert werden.
- Der Cache enthält ausdrücklich keinen TMDB API Read Access Token.
- Die sichtbare Oberfläche und zentrale `VERSION`-Datei wurden auf v0.0.9 aktualisiert.
- Die CI prüft ab dieser Version zusätzlich die Runtime-Version von `stability.js` und die zentralen v0.0.9-Stabilitätsfunktionen.

### Fixed
- Versionsstrategie gehärtet: v0.0.8 hatte in `app.js` noch eine ältere interne `APP_VERSION`-Konstante, obwohl die zentrale und sichtbare Version bereits 0.0.8 war. Ab v0.0.9 ist `VERSION` die maßgebliche Release-Referenz; die CI prüft die jeweils release-spezifische Runtime-Datei zusätzlich.
- Bei einem temporären Live-Sync-Ausfall bleiben vorhandene lokale Radar-Daten sichtbar.

### Notes
- `localStorage` ist in v0.0.9 bewusst nur eine Zwischenstufe. Für spätere Desktop-/Server-Releases ist eine lokale Datenbank vorgesehen.
- Ein älterer Cache kann im Fehlerfall auch nach Ablauf der normalen sechs Stunden als Offline-Fallback benutzt werden.

## [0.0.8] - 2026-09-01

### Added
- Neue Hauptansicht **Kalender**.
- Tages-, Wochen-, Monats- und 90-Tage-Ansicht für Release-Events.
- Monatsraster mit Release-Anzahl und kompakten Provider-/Titelhinweisen pro Tag.
- Chronologische Release-Timeline unterhalb des Kalenders.
- Tagesgruppierung für Film-Premieren, Serienstarts, Staffelstarts und Episoden.
- Markierung besonders voller Release-Tage.
- Kalender-Zusammenfassung für Gesamt-Releases, Staffelstarts, Episoden und Premieren im aktiven Zeitraum.
- Navigation mit vorherigem Zeitraum, nächstem Zeitraum und direktem Sprung zu **Heute**.
- Kalenderfilter **Nur Merkliste**.
- Bestehende Provider-, Medien-, Event-, Herkunfts- und Originals-Filter wirken auch auf die Kalenderansicht.
- Provider- und Herkunftslogos in Monatsraster und Timeline, sofern Metadaten vorhanden sind.
- Klickbare Timeline-Einträge, die die bestehende StreamRadar-Detailansicht öffnen.
- Echter `.ics`-/iCalendar-Export für alle aktuell sichtbaren Events im gewählten Zeitraum.
- Neues Modul `calendar.js`.
- Neues Styling in `v008.css` für Kalender, Timeline und responsive Darstellung.

### Changed
- StreamRadar ist zusätzlich zum Discovery-Feed ein persönlicher Streaming-Release-Kalender.
- Release-Events aus TMDB und TVmaze werden direkt in Kalender und Timeline wiederverwendet.
- Die 90-Tage-Ansicht verwendet dieselben Release-Klassifizierungen und Deduplizierungsregeln wie der Feed.
- Die Kalenderansicht respektiert Merkliste und Origin Intelligence.
- Versionsanzeige auf v0.0.8 aktualisiert.

### Notes
- Episoden im 90-Tage-Fenster können wegen des kürzeren TVmaze-Schedule-Horizonts weniger vollständig sein.
- Der iCalendar-Export ist dateibasiert und keine Zwei-Wege-Synchronisierung.

## [0.0.7] - 2026-09-01

### Added
- Gewichtete **Origin Intelligence** für Herkunfts- und Original-Zuordnungen.
- Herkunfts-Score und nachvollziehbare Evidenz statt ausschließlich `high`/`medium`.
- Trennung von Streaming-Plattform, Network/Broadcaster, Studio und Herkunfts-/Franchisemarke.
- Erweiterte Network-/Markenabdeckung, darunter Showtime, CBS, NBC, ABC, FOX, Starz, CANAL+, ZDF und ARD.
- Zusätzliche Studios/Herkunftsmarken wie Marvel Studios, Lucasfilm, Pixar, Warner Bros., Sony Pictures und A24.
- Override-Schicht `original-overrides.js` für bekannte Sonderfälle.
- Overrides können eine Herkunft erzwingen oder eine falsche Original-Zuordnung ausschließen.
- Herkunftsbadges `ORIGINAL`, `NETWORK`, `STUDIO`, `BRAND` und `MANUELL`.
- Detailansicht mit Herkunftstyp, Score, Evidenz und Override-Grund.
- Neues Styling in `v007.css`.

### Changed
- Produktionsfirmen werden nicht mehr pauschal wie Streaming-Plattformen behandelt.
- Marvel Studios, Lucasfilm oder Pixar gelten nicht automatisch als Disney+-Original.
- Direkte Network-/Plattformtreffer haben Vorrang vor reinen Produktionsfirmen.
- Der Original-Filter berücksichtigt nur tatsächlich als Original qualifizierte Titel.
- Herkunftsmarken bleiben unabhängig vom österreichischen Streaming-Provider sichtbar.
- Versionsanzeige auf v0.0.7 aktualisiert.

### Notes
- Die Override-Datei enthält standardmäßig keine erfundenen Titelkorrekturen; Regeln werden für konkrete Fehlfälle ergänzt.

## [0.0.6] - 2026-09-01

### Added
- Globaler Staffel- und Episoden-Radar über den TVmaze Web-/Streaming-Schedule.
- Schedule-Abfrage von gestern bis 14 Tage in die Zukunft.
- Matching von TVmaze gegen österreichisch relevante TMDB-Kandidaten via IMDb-ID, TVDB-ID und Titel-Fallback.
- Eigenständige Release-Events für kommende Episoden im Hauptfeed.
- Serienpremieren-Erkennung bei S1E1 und Staffelstart-Erkennung bei Episode 1 einer Staffel > 1.
- Maximal vier kommende TVmaze-Schedule-Events pro Serie.
- Eigene Hauptnavigation für **Staffeln** und **Episoden**.
- Radar-Zusammenfassung für Heute, Staffelstarts, Episoden und Premieren.
- `TVMAZE ✓` auf Schedule-bestätigten Karten.
- Web-Channel, Laufzeit, Sendezeit und direkter Episodenlink aus TVmaze.
- Retry-Behandlung für HTTP 429.
- Neues Styling in `v006.css`.

### Changed
- TVmaze ist seit dieser Version aktive Feed-Datenquelle und nicht nur Detailanreicherung.
- TVmaze-Schedule-Ereignisse werden nur mit bereits österreichisch relevanten TMDB-Serien zusammengeführt.
- Identische TMDB-/TVmaze-Events werden dedupliziert und deren Metadaten kombiniert.
- Statusleiste zeigt Staffel-, Episoden- und TVmaze-Eventzahlen.
- Versionsanzeige auf v0.0.6 aktualisiert.

## [0.0.5] - 2026-09-01

### Added
- Release-Intelligence-Schicht für **Film-Premiere**, **Neue Serie**, **Neue Staffel** und **Neue Episode**.
- Neuer Release-Typ-Filter.
- Event-Badges und Release-Detailbox.
- Österreichische Film-Release-Klassifizierung über TMDB `release_dates`.
- Bevorzugung von Digital-/TV-Releases für den Streaming-Radar, sofern regional vorhanden.
- Staffelstart-Erkennung über TMDB-Staffeldaten.
- Episodenklassifizierung über `next_episode_to_air` und `last_episode_to_air`.
- Staffelspezifische Watch-Provider-Abfrage.
- Zweistufige Event-Deduplizierung über TMDB-Event-Key und Titel-/Datum-/Staffel-/Episoden-Fingerprint.
- Neues Styling in `v005.css`.

### Changed
- TV-Discovery nutzt Ausstrahlungsdaten im Radar-Zeitraum statt nur den historischen Serienstart.
- Laufende ältere Serien können als aktuelle Staffel-/Episodenereignisse auftauchen.
- Die Merkliste bleibt auf stabilen Film-/Serien-IDs verankert.
- Provider-Treffer werden zusammengeführt, ohne unterschiedliche echte Release-Events zu verlieren.
- Versionsanzeige auf v0.0.5 aktualisiert.

## [0.0.4] - 2026-09-01

### Added
- Echte Original-Network-/Studio-Logos aus TMDB `logo_path`.
- Logos auf Release-Karten, in der Detailansicht und in der Markenleiste.
- Vollständige Original-Marken in der Markenleiste, inklusive eigenständiger HBO-/Sky-Einträge.
- Neues Styling in `v004.css`.

### Changed
- Original-Erkennung speichert Logo-Pfad und Logo-Quelle (`network` oder `production_company`).
- Markenleiste verwendet nach Möglichkeit echte TMDB-Logos.
- Logos werden während der Metadatenanreicherung dynamisch aktualisiert.
- Versionsanzeige auf v0.0.4 aktualisiert.

### Documentation
- Changelog rückwirkend um v0.0.1 und v0.0.2 ergänzt, damit die Historie ab der ersten Version vollständig dokumentiert ist.

## [0.0.3] - 2026-09-01

### Added
- Original-Brand-Erkennung über TMDB Networks und Produktionsfirmen.
- Erste unterstützte Marken: Netflix, HBO, HBO Max, Disney+, Hulu, FX, Prime Video, Apple TV+, Paramount+, Peacock, AMC+, Crunchyroll, BBC, Sky, Joyn, RTL+ und ORF.
- Original-Filter und Original-Marken-Filter.
- Erkennungssicherheit für Original-Zuordnungen.
- TVmaze-Client ohne zusätzlichen API-Key.
- Serien-Lookup via IMDb-/TVDB-ID mit Titel-Fallback.
- Nächste Episode und Staffelstart-Hinweis in der Detailansicht.
- `VERSION`-Datei als zentrale Versionsreferenz.
- SemVer-Regeln in README und Changelog.
- CI-Prüfung für JavaScript-Syntax und Versionskonsistenz.

### Changed
- Streaming-Provider und Original-Ursprung werden getrennt dargestellt.
- Ein Titel kann z. B. „Original von FX“ sein und gleichzeitig „läuft bei Disney+ AT“ anzeigen.
- Originals-Schalter wurde nach Einführung der Herkunftserkennung aktiviert.
- Versionsanzeige auf v0.0.3 aktualisiert.

## [0.0.2] - 2026-09-01

### Added
- Erste Live-Datenanbindung über TMDB.
- TMDB Discover für Filme und Serien.
- Deutsche Metadaten über `de-DE` und österreichische Watch-Provider über `watch_region=AT`.
- Reale TMDB-Poster und Backdrops.
- Provider-Mapping für Netflix, Disney+, Prime Video, HBO Max, Apple TV+, Paramount+, Crunchyroll, Sky/WOW, Joyn, RTL+ und ORF.
- Echte Provider-Logos.
- Zusammenführung identischer TMDB-Titel über mehrere Dienste.
- Detailansicht mit Genres, Laufzeit/Staffelanzahl, TMDB-Wertung und österreichischen Streaming-Providern.
- Radar-Fenster mit ca. 35 Tagen Rückblick und 90 Tagen Vorschau.
- Demnächst-Ansicht für 30 Tage.
- Lokale TMDB-Token-Konfiguration.
- Refresh-/Synchronisieren-Schaltfläche.
- Demo-Fallback bei fehlendem/ungültigem Token oder nicht erreichbarem TMDB.
- JustWatch-Attribution für Providerdaten.
- Erste GitHub-Actions-Syntaxprüfung.

### Changed
- Demo-Karten werden bei gültigem Token durch echte TMDB-Daten ersetzt.
- Provider-Matching gegen falsche Namensübereinstimmungen gehärtet.
- Fortschrittsanzeige und Discovery-Sortierung verbessert.
- Merkliste und Filter für Live-Daten beibehalten.
- Versionsanzeige auf v0.0.2 aktualisiert.

### Notes
- Original-Erkennung war absichtlich noch deaktiviert, weil TMDB keinen universellen Original-Schalter besitzt.

## [0.0.1] - 2026-09-01

### Added
- Erstes statisches Frontend-MVP von StreamRadar.
- Responsive Dark-Mode-Oberfläche mit Radar-Design.
- Hero-Bereich mit animierter Radar-Darstellung.
- Marken-/Providerleiste als Filterbasis.
- Ausgangsmarken: Netflix, Disney+, Prime Video, HBO Max, Apple TV+, Paramount+, Crunchyroll, FX, Hulu, Peacock, AMC+, BBC, Sky/WOW, Joyn, RTL+ und ORF.
- Freitextsuche.
- Medientypfilter für Serie, Film und Anime.
- Zeitraumfilter für Heute, Woche, Monat und Demnächst.
- Vorbereitung des Originals-Filters.
- Ansichten Entdecken, Demnächst und Merkliste.
- Lokale Merkliste über `localStorage`.
- Detaildialog.
- Responsive Desktop-/Tablet-/Smartphone-Darstellung.
- Demo-Datensatz vor der ersten API-Anbindung.
- Statischer Betrieb ohne Build-Schritt.
- README mit erster Projektstruktur und Datenquellen-Konzept.

### Notes
- v0.0.1 war bewusst eine reine Frontend-/UX-Grundlage ohne externe API-Abhängigkeiten.
