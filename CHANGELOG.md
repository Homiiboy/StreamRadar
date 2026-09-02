# Changelog

Alle relevanten Änderungen an StreamRadar werden hier ab der ersten Version nach Semantic Versioning dokumentiert.

## [0.4.1] - 2026-09-01

### Added
- **Crunchyroll** wird im Anbieterblock des Streaming-Katalogs zuverlässig ergänzt, wenn der Dienst in Österreich verfügbar ist.
- Browser-Regressionstest für Crunchyroll in der Provider-Navigation und echtes vertikales Sidebar-Scrolling.

### Changed
- Anbieter-Navigation ist nicht mehr auf sechs Sidebar-Einträge begrenzt.
- Linke Desktop-/Off-Canvas-Sidebar scrollt vertikal und nutzt eine dezente, zum Theme passende Scrollbar.
- App-, Tauri-, Desktop- und MSI-Version auf `0.4.1` angehoben.

## [0.4.0] - 2026-09-01

### Added
- Vollständiger **Streaming-Katalog** zusätzlich zum bestehenden Release-Radar.
- Eigene Katalogansichten für **Entdecken, Filme, Serien und Anime**.
- Anbieter-spezifische Katalogseiten mit großem Provider-Branding und klarer „Jetzt auf …“-Kennzeichnung.
- Lazy Pagination über TMDB Discover: weitere Katalogseiten werden erst auf Benutzeraktion nachgeladen.
- Kombinierte Katalog-Merkliste mit lokal gespeicherten Metadaten für Titel außerhalb des Release-Fensters.
- Eigene `js/catalog.js`-Runtime, getrennt von Release-, Kalender- und Episodenlogik.

### Changed
- StreamRadar ist ab v0.4.0 **Catalog First**: das verfügbare Angebot steht im Vordergrund; Release Intelligence bleibt als zusätzliche Radar-Ebene bestehen.
- TMDB-Katalogabfragen haben kein 35-/90-Tage-Releasefenster mehr. Das Zeitfenster gilt nur noch für Release-Radar und Kalender.
- Sidebar neu strukturiert in Katalog, Anbieter, Radar und persönliche Inhalte.
- Provider-Darstellung auf Karten deutlich größer und anbieter-spezifisch gestaltet.
- sichtbare Runtime-Version aus `polish.js` auf den echten Release-Stand korrigiert.
- App-, Tauri-, Desktop- und MSI-Version auf `0.4.0` angehoben.

### Quality
- Browser-Test für Katalog, Filmansicht und Netflix-Provider-Experience.
- Bestehende Release-Film- und Kalender-Abdeckung bleibt als separater Regressionstest erhalten.
- v0.3.0 UI-/CSS-Stände vor dem Redesign archiviert.

## [0.3.0] - 2026-09-01

### Added
- Neues **Update-Center** im Einstellungs-Center mit installierter und veröffentlichter Version.
- Manueller Update-Check sowie optionaler automatischer Check höchstens einmal pro 24 Stunden.
- Sidebar-Hinweis und direkter MSI-Download, sobald eine neuere veröffentlichte Version verfügbar ist.
- Native Tauri-Opener-Integration für externe Links im Windows-Standardbrowser.
- Tauri Window State zum Wiederherstellen von Fenstergröße, Position und Zustand.
- Runtime-Anzeige für echte App- und Tauri-Version.
- Playwright-Regressionstest für die Erkennung einer neueren veröffentlichten MSI-Version.
- Archiv-Snapshot `OldCss/styles-v0.2.2.css` vor den v0.3.0-Styleänderungen.

### Changed
- App-, Desktop-, Tauri- und MSI-Version auf `0.3.0` angehoben.
- Tauri Vanilla-JavaScript-Bridge über `withGlobalTauri` aktiviert und über Capabilities auf Core, Opener und Window State begrenzt.
- Update-Erkennung orientiert sich am tatsächlich veröffentlichten `downloads/README.md` statt an einem noch nicht gebauten Release-Commit.

### Security
- v0.3.0 installiert Updates nicht automatisch und führt keine heruntergeladenen Dateien aus.
- Ein MSI wird ausschließlich nach einem Benutzerklick im Standardbrowser geöffnet; der bestehende unsignierte Installer-Status bleibt unverändert.

## [0.2.2] - 2026-09-01

### Added
- Eigener **Filme**-Eintrag in der Hauptnavigation mit dediziertem Film-Radar.
- Film-Zähler in der Kalender-Zusammenfassung.
- Playwright-Regressionstest für Film-View und Film-Event in der 90-Tage-Kalender-Timeline.

### Changed
- App-, Tauri-, MSI- und Runtime-Version auf `0.2.2` angehoben.
- Playwright auf `1.62.1` aktualisiert und reproduzierbare Node-Abhängigkeiten eingeführt.

### Quality
- Film-Releases werden explizit als Teil der Kalender-Abdeckung getestet.
- High-Severity-NPM-Audit wird Bestandteil der Release-Validierung.

## [0.2.1] - 2026-09-01

### Added
- Playwright-/Chromium-Smoke-Tests für First-Run-Onboarding, globale Suche, Premium-Details, Settings-Persistenz und Backup/Restore.
- Regressionstest für beschädigte lokale Personalisierungsdaten.
- `tests/`-Struktur mit eigener Playwright-Konfiguration.
- `js/README.md` als Dokumentation der Runtime-Ladereihenfolge.

### Changed
- Alle aktiven Runtime-JavaScript-Dateien wurden aus dem Repository-Root nach `js/` verschoben.
- `index.html` und Desktop-Packaging laden Runtime-JavaScript ausschließlich aus `js/`.
- Repository-Hygiene-Checks verhindern künftig aktive `.js`-Dateien im Root.
- App-, Tauri- und MSI-Version wurden auf `0.2.1` angehoben.

### Quality
- Browser-Smoke-Tests werden im PR zusätzlich zu Syntax-/Strukturprüfung und echtem Windows-MSI-Build ausgeführt.
- Desktop-Preflight prüft die `dist/js/`-Struktur und stellt sicher, dass `OldCss/` und `OldUi/` nicht ausgeliefert werden.

## [0.2.0] - 2026-09-01

### Added
- Vollständiges **Personalization Center** mit Bereichen Allgemein, Anbieter, Inhalte, Daten & Backup und Über StreamRadar.
- First-Run-Onboarding für TMDB-Verbindung, Streaming-Anbieter und persönliche Inhaltspräferenzen.
- Persönlicher Home-Feed **Dein Radar-Mix** mit Relevanz-Scoring aus Anbieterwahl, Medienpräferenzen, Originals, Merkliste und Release-Nähe.
- Zusätzliche Reihe **Bei deinen Diensten** für ausgewählte Streaming-Anbieter.
- Präferenzen für Filme, Serien, Anime, Originals-Gewichtung, Episoden auf Home und persönlichen Zukunftshorizont.
- Wahl zwischen komfortabler und kompakter Informationsdichte.
- Letzte Ansicht bzw. Standardansicht kann für den App-Start gespeichert werden.
- Vollständiges StreamRadar-Backup/Restore für Personalisierung, Anbieter und Merkliste; der TMDB-Token wird bewusst nicht exportiert.
- Stabile Provider-Setter im `StreamRadarStability`-API, damit alte und neue Personalisierungsoberflächen dieselbe Datenquelle verwenden.

### Changed
- Aktive UI bleibt ausschließlich in `styles.css` und `ui.js`; vor v0.2.0 wurden konsolidierte v0.1.2-Snapshots nach `OldCss/` und `OldUi/` archiviert.
- Der bisherige technische TMDB-Einstellungsdialog wurde zu einem vollständigen Einstellungs-Center ausgebaut.
- Home-Personalisierung arbeitet ergänzend zur bestehenden Release Intelligence und verändert keine Rohdaten.
- App-, Desktop-, Tauri- und MSI-Version wurden auf `0.2.0` angehoben.

### Desktop
- Tauri-MSI und EXE werden als v0.2.0 gebaut.
- Der finale Main-Build veröffentlicht `downloads/StreamRadar_0.2.0_x64_de-DE.msi` automatisch im Repository.
- Der Installer bleibt für die persönliche Nutzung unsigniert.

## [0.1.2] - 2026-09-01

### Added
- Premium-Detailansicht mit großem Backdrop, Poster, Release Intelligence, Herkunft, Provider-Kacheln und nächster Episode.
- Globale Suche mit eigenem Ergebnis-Overlay und `Ctrl+K`-Shortcut.
- Einheitliches Inline-SVG-Iconset für Navigation und zentrale Desktop-Aktionen.
- Rail-Navigation mit Vor-/Zurück-Pfeilen und Scroll-Zuständen.
- Lokaler Bereich **Neu seit deinem letzten Besuch** über persistierte Event-Fingerprints.
- Neue UI-Schicht `ui012.js` und Styling `v012.css`.

### Changed
- Historische CSS-Patches bis einschließlich v0.1.1 wurden in `styles.css` konsolidiert.
- `OldCss/` dient nur noch als Archiv; historische Styles werden nicht mehr einzeln im Browser oder MSI geladen.
- Desktop-Packaging liefert nur noch `styles.css` plus die aktuelle `v012.css` aus.
- Der bisher veraltete interne `APP_VERSION`-Wert wurde auf den aktuellen Stand gebracht.
- Desktop-, Tauri- und MSI-Version wurden auf `0.1.2` angehoben.

### Desktop
- Tauri-MSI und EXE werden als v0.1.2 gebaut.
- Der finale Main-Build veröffentlicht `downloads/StreamRadar_0.1.2_x64_de-DE.msi` automatisch im Repository.
- Der Installer bleibt für die persönliche Nutzung unsigniert.

## [0.1.1] - 2026-09-01

### Added
- Neue permanente Desktop-Sidebar für Entdecken, Kalender, Staffeln, Episoden, Demnächst und Merkliste.
- Neue kompakte Topbar mit Seitentitel, Suche, Refresh und Einstellungen.
- Neuer Home-/Discover-Bereich mit Tagesbegrüßung, Datum und Schnellstatistiken.
- Streamingartige horizontale Content-Rows für Heute, neue Staffeln, Demnächst, Originals und neue Episoden.
- Home-Rows berücksichtigen den persönlichen **Meine Anbieter**-Filter sowie den aktiven Provider-/Herkunftsfilter.
- Neuer kompakter Filter-Drawer mit Anzeige der Anzahl aktiver Filter.
- Responsive Off-Canvas-Sidebar für kleinere Fenster und mobile Nutzung.
- Neue UI-Schicht `ui011.js`.
- Neues Styling `v011.css`.
- CI-Prüfungen für Sidebar, Home-Rows, Filter-Drawer und Desktop-Packaging der neuen UI-Dateien.

### Changed
- Die bisherige horizontale Hauptnavigation wurde für Desktop durch eine linke App-Sidebar ersetzt.
- Der große Marketing-Hero wurde zu einem deutlich kompakteren persönlichen Dashboard-Header reduziert.
- Die Startansicht ist stärker nach konkreten Release-Situationen statt nach einer einzigen Posterwand strukturiert.
- Postergrid, Abstände und Flächennutzung wurden für Desktop-Fenster verdichtet.
- Provider-/Network-/Studio-Leiste wurde kompakter gestaltet.
- Erweiterte Filter sind nicht mehr permanent sichtbar und überladen die Oberfläche dadurch weniger.
- Statusinformationen werden zusätzlich direkt in der Sidebar dargestellt.
- Detailansicht, Kalender, Timeline, Origin Intelligence, Cache, Merkliste und Providerlogik bleiben funktional kompatibel zu v0.1.0.
- Desktop-, Tauri- und MSI-Version wurden auf `0.1.1` angehoben.

### Desktop
- Tauri-MSI und EXE werden als v0.1.1 gebaut.
- Der finale Main-Build veröffentlicht `downloads/StreamRadar_0.1.1_x64_de-DE.msi` automatisch im Repository.
- Beim MSI-Publish wird die SHA-256-Prüfsumme automatisch in `downloads/README.md` eingetragen.
- Der Installer bleibt für die persönliche Nutzung unsigniert.

## [0.1.0] - 2026-09-01

### Added
- Erster größerer **First Complete Radar**-Meilenstein.
- Erste installierbare Windows-Desktop-Version auf Basis von **Tauri v2**.
- Windows-x64-MSI-Build und Windows-EXE-Artefakt über GitHub Actions.
- Desktop-Buildsystem mit `package.json`, `scripts/build-desktop.mjs` und Tauri-Rust-Projekt unter `src-tauri/`.
- Feste Windows-App-ID `at.streamradar.desktop`.
- Deutscher WiX-MSI-Build (`de-DE`) mit stabilem Upgrade-Code.
- StreamRadar-Icon-Quelle unter `assets/streamradar-icon.svg` und automatische Tauri-Icon-Generierung.
- Desktop-Runtime-Erkennung über `desktop.js` und sichtbares `WINDOWS APP`-Badge.
- Desktop-/Meilenstein-Styling in `v0100.css`.
- Dauerhafte Veröffentlichung der MSI im Repository-Ordner `downloads/`.

### Changed
- Sichtbare Produktversion auf `v0.1.0` angehoben.
- Bestehende Web-Oberfläche wird reproduzierbar nach `dist/` gepackt und von Tauri eingebettet.
- Web- und Desktop-Version verwenden dieselbe Release-, Origin-, Kalender-, Cache- und Personalisierungslogik.

### Notes
- v0.1.0 integriert die vollständige Funktionskette aus v0.0.1 bis v0.0.10.
- Der MSI-Installer ist nicht code-signiert; automatische Desktop-Updates und SQLite-Persistenz sind noch nicht enthalten.

## [0.0.10] - 2026-09-01

### Fixed
- Filter für Medientyp, Release-Typ, Zeitraum, Herkunft und Originals wieder an die aktuelle Personalisierungsschicht gebunden.
- **Meine Anbieter** kann beim Ändern anderer Filter nicht mehr umgangen werden.
- Kalender-Einstieg respektiert die persönliche Provider-Auswahl.
- Schutz gegen parallele bzw. doppelte TMDB-/TVmaze-Synchronisierungen.
- Beschädigte oder strukturell ungültige Radar-Caches werden erkannt und bereinigt.
- Cache-Duplikate werden vor dem Speichern zusammengeführt.
- Provider-Präferenzen und Merkliste werden gehärtet und normalisiert.
- Defekte Poster-/Logo-Bilder erhalten einen sauberen Fallback.
- Kalender zeigt in Tag-, Wochen- und 90-Tage-Modus kein irreführendes Monatsraster mehr.

### Changed
- Radar-Cache wird kompakter serialisiert und bei knappem `localStorage` stufenweise verkleinert.
- Tastatur-Fokus, Mobile-Darstellung und `prefers-reduced-motion` wurden verbessert.
- CI erhielt zusätzliche Repository-Hygiene-Checks.

### Added
- Runtime-Modul `polish.js` und Styling `v0010.css`.

## [0.0.9] - 2026-09-01

### Added
- Lokaler Radar-Snapshot-Cache mit sechs Stunden TTL.
- **Stale-while-revalidate**: Cache sofort anzeigen, Live-Daten anschließend aktualisieren.
- Offline-/Netzwerkfehler-Fallback auf den letzten gespeicherten Radar.
- Online-/Offline- und Cache-Altersanzeige.
- Persistenter Multi-Provider-Filter **Meine Anbieter**.
- Provider-Auswahl in den Einstellungen.
- Persönliche Provider-Auswahl für Feed, Kalender und Timeline.
- Persistente Sortierung nach Relevanz, Datum, Popularität und TMDB-Wertung.
- Merkliste-Export und -Import als JSON.
- Toast-Hinweise für Offline-Modus, Wiederverbindung, Cache und Import.
- Runtime-Modul `stability.js` und Styling `v009.css`.

### Changed
- Suche wird leicht verzögert neu gerendert.
- Merkliste wird beim Start normalisiert und dedupliziert.
- Einstellungen zeigen lokale Cache-/Merkliste-/Provider-Statistiken.

## [0.0.8] - 2026-09-01

### Added
- Hauptansicht **Kalender** mit Tag-, Woche-, Monat- und 90-Tage-Zeiträumen.
- Monatsraster mit Release-Anzahl und kompakten Vorschauen.
- Chronologische Release-Timeline und Tagesgruppierung.
- Kalender-Zusammenfassung für Releases, Staffelstarts, Episoden und Premieren.
- Navigation für vorherigen/nächsten Zeitraum und **Heute**.
- Kalenderfilter **Nur Merkliste**.
- Provider-, Medien-, Event-, Herkunfts- und Originals-Filter im Kalender.
- `.ics`-/iCalendar-Export.
- Modul `calendar.js` und Styling `v008.css`.

## [0.0.7] - 2026-09-01

### Added
- Gewichtete **Origin Intelligence**.
- Trennung in Streaming-Plattform, Network/Broadcaster, Studio und Herkunftsmarke.
- Herkunfts-Score und nachvollziehbare Evidenz.
- Erweiterte Networks/Brands und Studios wie Marvel Studios, Lucasfilm, Pixar, Warner Bros., Sony Pictures und A24.
- Manuelle Override-Schicht in `original-overrides.js`.
- Herkunftsbadges `ORIGINAL`, `NETWORK`, `STUDIO`, `BRAND`, `MANUELL`.
- Styling `v007.css`.

### Changed
- Produktionsfirmen gelten nicht mehr automatisch als Streaming-Original.
- Direkte Network-/Plattformtreffer haben Vorrang vor reinen Studio-Signalen.

## [0.0.6] - 2026-09-01

### Added
- Globaler Staffel-/Episoden-Radar über TVmaze Web Schedule.
- Schedule von gestern bis 14 Tage in die Zukunft.
- Matching über IMDb-ID, TVDB-ID und Titel-Fallback.
- Eigenständige Episoden-/Staffel-Events im Hauptfeed.
- S1E1-Erkennung als Serienpremiere und Episode 1 höherer Staffeln als Staffelstart.
- Hauptnavigation für **Staffeln** und **Episoden**.
- Radar-Zähler für Heute, Staffelstarts, Episoden und Premieren.
- `TVMAZE ✓`-Kennzeichnung und Retry-Behandlung für HTTP 429.
- Styling `v006.css`.

## [0.0.5] - 2026-09-01

### Added
- Release Intelligence mit Film-Premiere, neuer Serie, neuer Staffel und neuer Episode.
- Filter nach Release-Typ, Event-Badges und konkrete Release-Detailbox.
- Österreichische Film-Release-Klassifizierung über TMDB `release_dates`.
- Staffelstart-/Episodenerkennung und staffelspezifische Watch-Provider.
- Zweistufige Deduplizierung.
- Styling `v005.css`.

## [0.0.4] - 2026-09-01

### Added
- Echte TMDB-Logos für erkannte Original-Networks/Studios.
- Original-Logos auf Karten, in Details und Markenleiste.
- Zusätzliche Herkunftsmarken wie HBO und Sky.
- Styling `v004.css`.

## [0.0.3] - 2026-09-01

### Added
- Erste Original-Brand-Erkennung über TMDB Networks/Produktionsfirmen.
- Original- und Brand-Filter sowie Erkennungssicherheit.
- TVmaze-Client ohne zusätzlichen API-Key.
- Serien-Lookup über IMDb-/TVDB-ID und Titel-Fallback.
- Nächste Episode und Staffelstart-Erkennung.
- `VERSION`-Datei, SemVer-Regeln und erste Versionskonsistenz-CI.
- Styling `v003.css`.

### Changed
- Streaming-Verfügbarkeit und Original-Ursprung werden getrennt dargestellt.

## [0.0.2] - 2026-09-01

### Added
- Erste Live-Datenanbindung an TMDB.
- TMDB Discover für Filme und Serien mit deutschen Metadaten (`de-DE`).
- Österreichische Watch-Provider (`watch_region=AT`).
- Reale Poster, Backdrops und Provider-Logos.
- Zusammenführung identischer Titel über mehrere Provider.
- Detailansicht mit Genres, Laufzeit/Staffeln, Rating und Watch-Providern.
- Radar-Zeitraum mit Rückblick und Zukunftsfenster.
- Demnächst-Ansicht, lokaler TMDB API Read Access Token, Refresh und Demo-Fallback.
- JustWatch-Attribution und erste GitHub-Actions-Syntaxprüfung.

## [0.0.1] - 2026-09-01

### Added
- Erstes statisches StreamRadar-MVP.
- Responsive Dark-Mode-Oberfläche mit Radar-Design.
- Hero/Radar-Visualisierung.
- Provider-/Markenleiste als Filterbasis.
- Freitextsuche, Film-/Serien-/Anime-Filter und Zeitraumfilter.
- Ansichten Entdecken, Demnächst und Merkliste.
- Lokale Merkliste über `localStorage`.
- Detaildialog und Responsive Desktop-/Tablet-/Mobile-Darstellung.
- Demo-Datensatz vor der API-Anbindung.
- Betrieb ohne Build-Schritt über einen einfachen HTTP-Server.

### Notes
- v0.0.1 war bewusst eine reine Frontend-/UX-Grundlage ohne externe API-Abhängigkeiten.
