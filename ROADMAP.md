# StreamRadar Roadmap bis 1.0.0

Diese Roadmap beschreibt die geplante Entwicklungsreihenfolge bis zum ersten Stable-Release. Bereits veröffentlichte Versionen bleiben unverändert; die zukünftigen Meilensteine wurden an den tatsächlichen Projektverlauf angepasst.

## Release-Reihenfolge

| Version | Schwerpunkt | Status |
| --- | --- | --- |
| **0.1.x** | UI/UX und Grundstruktur | abgeschlossen |
| **0.2.x** | Personalisierung, Einstellungen und Ausbau der Kernfunktionen | abgeschlossen |
| **0.3.x** | Desktop-Integration und Update-Erlebnis | abgeschlossen |
| **0.4.x** | Streaming-Katalog, Provider, Datenqualität und Release Intelligence | abgeschlossen |
| **0.5.x** | Themes und visuelle Personalisierung | aktuell / abgeschlossen |
| **0.6.x** | Performance und persistenter lokaler Datenspeicher | geplant |
| **0.7.x** | Suche, Watchlist und Benachrichtigungen | geplant |
| **0.8.x** | Feinschliff und Accessibility | geplant |
| **0.9.x** | Feature Freeze, Release Candidate und ausschließlich Stabilitäts-/Bugfix-Arbeit | geplant |
| **1.0.0** | Stable | geplant |

## 0.6.x – Performance und lokaler Datenspeicher

Ziel ist eine robustere und schnellere Datenbasis für die Desktop-App.

Geplant sind unter anderem:

- messbare Performance-Optimierungen für Start, Katalog, Radar und Provider-Ansichten
- Reduzierung unnötiger API-Aufrufe und Render-Zyklen
- robusteres Caching und besseres Offline-Verhalten
- klarere Trennung zwischen temporärem Cache und dauerhaft gespeicherten Nutzerdaten
- Vorbereitung bzw. Migration wichtiger Persistenzdaten von reinem `localStorage` auf eine native lokale Datenbank, vorzugsweise SQLite
- Datenmigration ohne Verlust bestehender Einstellungen, Themes und Merkliste
- bessere Fehlerbehandlung bei beschädigten oder veralteten lokalen Daten

## 0.7.x – Suche, Watchlist und Benachrichtigungen

Der Fokus liegt auf persönlicher Nutzung und schnellerem Wiederfinden von Inhalten.

Geplant sind unter anderem:

- Ausbau der globalen Suche
- bessere Filterung und Sortierung von Suchergebnissen
- erweiterte Watchlist-/Merkliste-Funktionen
- Status und persönliche Metadaten für gespeicherte Titel
- Benachrichtigungen für relevante neue Releases, Staffeln oder Episoden
- konfigurierbare Benachrichtigungsregeln

## 0.8.x – Feinschliff und Accessibility

Diese Versionsreihe soll die Oberfläche vor dem Feature Freeze vereinheitlichen und zugänglicher machen.

Geplant sind unter anderem:

- Tastatur-Navigation und Fokusführung
- bessere Screenreader-/ARIA-Unterstützung
- Kontrast- und Lesbarkeitsprüfungen für alle Themes
- konsistente States für Hover, Fokus, Loading, Empty und Error
- responsive Detailarbeit und visuelles Polish
- finale UX-Konsistenz über alle Hauptbereiche

## 0.9.x – Feature Freeze und Release Candidate

Mit **v0.9.0** beginnt der Feature Freeze. Ab diesem Punkt werden grundsätzlich keine größeren neuen Funktionen mehr aufgenommen.

Die 0.9.x-Reihe dient ausschließlich der Vorbereitung auf 1.0.0:

- Bugfixes
- Stabilitätsverbesserungen
- Security-Fixes
- Performance-Korrekturen
- Accessibility-Fixes
- Installer-/Update-Tests
- Migrations- und Upgrade-Tests
- Regressionstests auf Windows
- finale Dokumentation

Falls mehrere Release Candidates nötig sind, laufen sie innerhalb der 0.9.x-Reihe, beispielsweise `0.9.0`, `0.9.1`, `0.9.2` usw.

## 1.0.0 – Stable

`1.0.0` wird veröffentlicht, sobald die 0.9.x-Reihe keine bekannten release-blockierenden Fehler mehr enthält und Installation, Updates, lokale Datenmigration sowie Kernfunktionen stabil getestet wurden.

Ab 1.0.0 gelten Änderungen an Persistenzformaten, Konfiguration und öffentlichem Verhalten als stabiler Vertrag und sollen entsprechend vorsichtiger versioniert werden.
