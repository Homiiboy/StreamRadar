# StreamRadar UI JavaScript Archive

Dieser Ordner enthält historische UI-Schichten zur Nachvollziehbarkeit.
Sie werden **nicht** von StreamRadar zur Laufzeit geladen oder in den Desktop-Build gepackt.

Ab der Konsolidierung nach v0.1.2 gilt:

- aktive UI-Logik im Repository-Root: `ui.js`
- historische Snapshots: `OldUi/`
- neue Releases ändern `ui.js` direkt; vor größeren Änderungen kann ein Versions-Snapshot hier archiviert werden.

Vor größeren Releases kann ein konsolidierter Snapshot wie `ui-v0.1.2.js` archiviert werden. Die aktive Anwendung lädt ausschließlich `ui.js`.
