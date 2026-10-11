# media-tracker

1. Funktionsumfang festlegen (MVP)

Für den Anfang reicht ein schlanker Kern:

Drei Medientypen: Serien, Filme, Spiele
Status pro Eintrag: geplant, läuft gerade, abgeschlossen, abgebrochen
Bewertung und Notiz: z. B. 1–10 Punkte plus Freitext
Datum: wann gesehen oder gespielt
Serien: Fortschritt nach Staffel und Folge
Spiele: Plattform und optional Spielzeit
Suche und Filter in der eigenen Liste

Später lassen sich Statistiken, Import/Export, Listen und Social-Features ergänzen.

2. Datenquellen für Titel und Cover

Damit du Titel nicht von Hand eintippen musst, kannst du freie APIs anbinden:

Filme und Serien: TMDB (The Movie Database), kostenloser API-Key
Spiele: IGDB (gehört zu Twitch) oder RAWG

3. Tech-Stack (zwei sinnvolle Varianten)
Variante	Stack	Passt, wenn …
Fullstack in einem	Next.js (TypeScript) + Prisma + PostgreSQL oder SQLite	du ein Projekt mit einem Framework willst
Getrennt	React/Vue-Frontend + Node/Python-Backend (REST)	du Frontend und Backend bewusst trennen möchtest