# Changelog

Alle relevanten Änderungen an StreamRadar werden hier ab der ersten Version nach Semantic Versioning dokumentiert.

## [0.1.0] - 2026-09-01

### Added
- Erster größerer **First Complete Radar**-Meilenstein.
- Erste installierbare Windows-Desktop-Version auf Basis von **Tauri v2**.
- Windows-x64-MSI-Build über GitHub Actions auf `windows-latest`.
- Zusätzliches Windows-EXE-Build-Artefakt.
- Neues Desktop-Buildsystem mit `package.json` und `scripts/build-desktop.mjs`.
- Tauri-Rust-Projekt unter `src-tauri/` mit minimaler Capability-Konfiguration.
- Feste Windows-App-ID `at.streamradar.desktop`.
- Deutscher WiX-MSI-Build (`de-DE`) mit stabilem Upgrade-Code für spätere Updates.
- Eigene StreamRadar-Icon-Quelle unter `assets/streamradar-icon.svg`.
- Automatische Generierung der Tauri-/Windows-Icon-Sets während des Desktop-Builds.
- Desktop-Runtime-Erkennung über `desktop.js` und sichtbares `WINDOWS APP`-Badge innerhalb der installierten Anwendung.
- Neues Desktop-/Meilenstein-Styling in `v0100.css`.
- Separate GitHub-Actions-Pipeline `Build StreamRadar Windows MSI` mit MSI- und EXE-Artefakten.

### Changed
- Sichtbare Produktversion auf `v0.1.0` angehoben.
- Hero und Produkttexte beschreiben StreamRadar jetzt als vollständigen Release-Radar statt als Pre-Milestone-Build.
- Bestehende Web-Oberfläche wird für Desktop reproduzierbar in ein separates `dist/` gepackt und anschließend von Tauri eingebettet.
- Web- und Desktop-Version verwenden weiterhin dieselbe Release-, Origin-, Kalender-, Cache- und Personalisierungslogik.
- README um Windows-Installation, Desktop-Build und Installer-Hinweise erweitert.
- `VERSION` auf `0.1.0` gesetzt.

### Desktop
- MSI ist für Windows x64 vorgesehen.
- Tauri verwendet auf Windows WebView2 für die Darstellung.
- Der Installer verwendet den Tauri/WiX-MSI-Bundler.
- v0.1.0 ist noch nicht mit einem Windows-Code-Signing-Zertifikat signiert; Windows SmartScreen kann daher bei Downloads warnen.
- Automatische Desktop-Updates und SQLite-Persistenz sind noch nicht Bestandteil dieses Releases.

### Notes
- v0.1.0 integriert die vollständige bisherige Funktionskette aus v0.0.1 bis v0.0.10: TMDB-Live-Daten, TVmaze-Episodenradar, Release Intelligence, Origin Intelligence, Logos, Kalender/Timeline, persönliche Anbieter, Merkliste, Cache/Offline-Fallback und v0.0.10-Hardening.

## [0.0.10] - 2026-09-01

### Fixed
- Filter für Medientyp, Release-Typ, Zeitraum, Herkunft und Originals wieder an die aktuelle Render-/Personalisierungsschicht gebunden.
- Dadurch kann der v0.0.9-Filter **Meine Anbieter** beim Ändern anderer Filter nicht mehr umgangen werden.
- Schutz gegen parallele bzw. doppelte TMDB-/TVmaze-Synchronisierungen ergänzt.
- Refresh-Button wird während einer laufenden Synchronisierung gesperrt und zeigt einen Busy-State.
- Beschädigte oder strukturell ungültige Radar-Caches werden erkannt und verworfen.
- Cache-Einträge ohne stabile Identität, Titel oder Releasedatum werden beim Bereinigen entfernt.
- Cache-Duplikate werden vor dem Speichern zusammengeführt.
- Fremde/inkompatible Regions-Caches werden nicht weiterverwendet.
- Gespeicherte Provider-Präferenzen werden gegen die aktuell unterstützte Providerliste bereinigt.
- Merkliste-Import zählt nun nur tatsächlich neu hinzugefügte Einträge.
- Ungültige Merkliste-Dateien liefern einen klareren Fehlerzustand.
- Defekte Poster-/Logo-Bilder werden sauber ausgeblendet und durch einen visuellen Fallback ersetzt.
- Kalender zeigt in Tag-, Wochen- und 90-Tage-Modus nicht mehr parallel ein irreführendes Monatsraster.

### Changed
- Radar-Cache wird kompakter serialisiert und Beschreibungen werden für den Snapshot begrenzt.
- Bei knappem `localStorage`-Budget reduziert StreamRadar die Cache-Größe stufenweise, statt den gesamten neuen Snapshot zu verlieren.
- Tag/Woche/90 Tage verwenden eine stärker fokussierte Timeline-Darstellung; der Monatsmodus behält Monatsraster + Timeline.
- Sichtbare Versionsoberflächen werden auf v0.0.10 synchronisiert.
- Filter-, Kalender- und Statusinteraktionen wurden für Mobile nachpoliert.
- Tastatur-Fokuszustände wurden verbessert.
- `prefers-reduced-motion` wird berücksichtigt.
- Große Karten-/Timeline-Bereiche verwenden Browser-Rendering-Optimierungen (`content-visibility`).

### Added
- Neues Runtime-Modul `polish.js` für Cache-Härtung, Sync-Lock, Filter-Rebinding, Bild-Fallbacks und Kalender-Polish.
- Neues Styling `v0010.css`.
- Zusätzliche Accessibility-Hinweise über `aria-busy`, `aria-live` und deutlichere `focus-visible`-Zustände.
- CI-Prüfungen für v0.0.10 sowie zusätzliche Repository-Hygiene-Checks.

### Notes
- v0.0.10 ist bewusst ein Bugfix-/Polish-Release vor dem ersten größeren Meilenstein v0.1.0.
- Keine neue externe Datenquelle wurde eingeführt; TMDB, JustWatch via TMDB und TVmaze bleiben unverändert die Datenbasis.

## [0.0.9] - 2026-09-01

### Added
- Lokaler Radar-Snapshot-Cache mit sechs Stunden TTL.
- **Stale-while-revalidate**: Cache sofort anzeigen, Live-Daten anschließend aktualisieren.
- Offline-/Netzwerkfehler-Fallback auf den letzten gespeicherten Radar.
- Online-/Offline- und Cache-Altersanzeige.
- Persistenter Multi-Provider-Filter **Meine Anbieter**.
- Provider-Auswahl in den Einstellungen mit „Alle wählen“ und „Keine wählen“.
- Persönliche Provider-Auswahl für Feed, Kalender und Timeline.
- Persistente Sortierung nach Relevanz, Datum, Popularität und TMDB-Wertung.
- Merkliste-Export und -Import als JSON.
- Toast-Hinweise für Offline-Modus, Wiederverbindung, Cache und Import.
- Neues Runtime-Modul `stability.js` und Styling `v009.css`.

### Changed
- Suche wird leicht verzögert neu gerendert.
- Merkliste wird beim Start normalisiert und dedupliziert.
- Einstellungen zeigen lokale Cache-/Merkliste-/Provider-Statistiken.

## [0.0.8] - 2026-09-01

### Added
- Hauptansicht **Kalender**.
- Tag-, Woche-, Monat- und 90-Tage-Zeiträume.
- Monatsraster mit Release-Anzahl und kompakten Vorschauen.
- Chronologische Release-Timeline.
- Tagesgruppierung für Film-Premieren, Serienstarts, Staffelstarts und Episoden.
- Markierung besonders voller Release-Tage.
- Kalender-Zusammenfassung für Releases, Staffelstarts, Episoden und Premieren.
- Navigation für vorherigen/nächsten Zeitraum und **Heute**.
- Kalenderfilter **Nur Merkliste**.
- Provider-, Medien-, Event-, Herkunfts- und Originals-Filter im Kalender.
- Provider-/Herkunftslogos in Kalender und Timeline.
- Klickbare Timeline-Einträge mit bestehender Detailansicht.
- `.ics`-/iCalendar-Export für sichtbare Events.
- Neues Modul `calendar.js` und Styling `v008.css`.

### Changed
- StreamRadar wurde vom reinen Discovery-Feed zum persönlichen Release-Kalender erweitert.
- Kalender verwendet dieselben deduplizierten TMDB-/TVmaze-Events wie der Feed.

## [0.0.7] - 2026-09-01

### Added
- Gewichtete **Origin Intelligence**.
- Trennung in Streaming-Plattform, Network/Broadcaster, Studio und Herkunftsmarke.
- Herkunfts-Score und nachvollziehbare Evidenz.
- Erweiterte Networks/Brands wie Showtime, CBS, NBC, ABC, FOX, Starz und CANAL+.
- Studios/Brands wie Marvel Studios, Lucasfilm, Pixar, Warner Bros., Sony Pictures und A24.
- Manuelle Override-Schicht in `original-overrides.js`.
- Detailanzeige für Herkunftstyp, Score, Evidenz und Override-Grund.
- Herkunftsbadges `ORIGINAL`, `NETWORK`, `STUDIO`, `BRAND`, `MANUELL`.
- Styling `v007.css`.

### Changed
- Produktionsfirmen gelten nicht mehr automatisch als Streaming-Original.
- Direkte Network-/Plattformtreffer haben Vorrang vor reinen Studio-Signalen.
- Studios wie Marvel Studios, Lucasfilm oder Pixar werden nicht automatisch als Disney+-Original eingestuft.

## [0.0.6] - 2026-09-01

### Added
- Globaler Staffel-/Episoden-Radar über TVmaze Web Schedule.
- Schedule von gestern bis 14 Tage in die Zukunft.
- Matching über IMDb-ID, TVDB-ID und Titel-Fallback.
- Eigenständige Episoden-/Staffel-Events im Hauptfeed.
- S1E1-Erkennung als Serienpremiere.
- Episode 1 höherer Staffeln als Staffelstart.
- Hauptnavigation für **Staffeln** und **Episoden**.
- Radar-Zähler für Heute, Staffelstarts, Episoden und Premieren.
- `TVMAZE ✓`-Kennzeichnung.
- Web-Channel, Laufzeit, Sendezeit und Episodenlink.
- Retry-Behandlung für HTTP 429.
- Styling `v006.css`.

### Changed
- TVmaze wurde von einer Detaildatenquelle zu einer aktiven Feed-Datenquelle.
- TMDB bleibt für österreichische Provider-Relevanz zuständig; TVmaze ergänzt konkrete Episodenereignisse.

## [0.0.5] - 2026-09-01

### Added
- Release Intelligence mit getrennten Eventtypen:
  - Film-Premiere
  - Neue Serie
  - Neue Staffel
  - Neue Episode
- Filter nach Release-Typ.
- Event-Badges und konkrete Release-Detailbox.
- Österreichische Film-Release-Klassifizierung über TMDB `release_dates`.
- Staffelstart-Erkennung über TMDB-Staffeldaten.
- Episodenerkennung über `next_episode_to_air` / `last_episode_to_air`.
- Staffelspezifische Watch-Provider.
- Zweistufige Deduplizierung.
- Styling `v005.css`.

### Changed
- Laufende Serien werden anhand aktueller Ausstrahlungen statt nur ihres ursprünglichen Serienstarts bewertet.
- Mehrere Provider eines Events werden zusammengeführt.
- Merkliste bleibt an stabilen Film-/Serien-IDs verankert.

## [0.0.4] - 2026-09-01

### Added
- Echte TMDB-Logos für erkannte Original-Networks/Studios.
- Original-Logos auf Karten, in Details und Markenleiste.
- Zusätzliche Herkunftsmarken wie HBO und Sky.
- Styling `v004.css`.

### Changed
- Origin-Metadaten speichern Logo-Pfad und Logo-Quelle.
- Text-Fallback bleibt aktiv, wenn TMDB kein Logo liefert.

### Documentation
- Changelog rückwirkend für v0.0.1 und v0.0.2 vervollständigt.

## [0.0.3] - 2026-09-01

### Added
- Erste Original-Brand-Erkennung über TMDB Networks/Produktionsfirmen.
- Marken u. a. Netflix, HBO, HBO Max, Disney+, Hulu, FX, Prime Video, Apple TV+, Paramount+, Peacock, AMC+, Crunchyroll, BBC, Sky, Joyn, RTL+ und ORF.
- Original- und Brand-Filter.
- Erkennungssicherheit.
- TVmaze-Client ohne zusätzlichen API-Key.
- Serien-Lookup über IMDb-/TVDB-ID und Titel-Fallback.
- Nächste Episode und Staffelstart-Erkennung.
- `VERSION`-Datei.
- SemVer-Regeln und erste Versionskonsistenz-CI.
- Styling `v003.css`.

### Changed
- Streaming-Verfügbarkeit und Original-Ursprung werden getrennt dargestellt.

## [0.0.2] - 2026-09-01

### Added
- Erste Live-Datenanbindung an TMDB.
- TMDB Discover für Filme und Serien.
- Deutsche Metadaten (`de-DE`).
- Österreichische Watch-Provider (`watch_region=AT`).
- Reale Poster und Backdrops.
- Provider-Mapping für wichtige Streaming-Dienste.
- Echte Provider-Logos.
- Zusammenführung identischer Titel über mehrere Provider.
- Detailansicht mit Genres, Laufzeit/Staffeln, Rating und Watch-Providern.
- Radar-Zeitraum mit Rückblick und Zukunftsfenster.
- Demnächst-Ansicht.
- Lokaler TMDB API Read Access Token.
- Refresh/Synchronisierung.
- Demo-Fallback.
- JustWatch-Attribution.
- Erste GitHub-Actions-Syntaxprüfung.

### Changed
- Demo-Daten werden bei gültigem Token durch echte TMDB-Daten ersetzt.
- Provider-Matching wurde gegen ungenaue Namensmatches gehärtet.

## [0.0.1] - 2026-09-01

### Added
- Erstes statisches StreamRadar-MVP.
- Responsive Dark-Mode-Oberfläche mit Radar-Design.
- Hero/Radar-Visualisierung.
- Provider-/Markenleiste als Filterbasis.
- Freitextsuche.
- Film-/Serien-/Anime-Filter.
- Zeitraumfilter.
- Ansichten Entdecken, Demnächst und Merkliste.
- Lokale Merkliste über `localStorage`.
- Detaildialog.
- Responsive Desktop-/Tablet-/Mobile-Darstellung.
- Demo-Datensatz vor der API-Anbindung.
- Betrieb ohne Build-Schritt über einen einfachen HTTP-Server.

### Notes
- v0.0.1 war bewusst eine reine Frontend-/UX-Grundlage ohne externe API-Abhängigkeiten.
