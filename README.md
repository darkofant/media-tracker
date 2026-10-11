# media-tracker

Eine Basis für eine Medien-Tracking-App mit Fokus auf MVP und einfacher Weiterentwicklung.

## MVP-Funktionen

- Drei Medientypen: Serien, Filme, Spiele
- Status pro Eintrag: geplant, gesehen/nicht abgeschlossen, abgeschlossen, abgebrochen
- Bewertung und Notiz: 1–10 Punkte plus Freitext
- Datum: wann gesehen oder gespielt
- Serien: Fortschritt nach Staffel und Folge
- Spiele: Plattform und optional Spielzeit
- Suche und Filter in der eigenen Liste

Später lassen sich Statistiken, Import/Export, Listen und Social-Features ergänzen.

## Datenquellen für Titel und Cover

- Filme und Serien: TMDB
- Spiele: IGDB oder RAWG

## Tech-Stack

Die Basis hier nutzt die Fullstack-Variante:

- Next.js + TypeScript
- Prisma ORM
- SQLite für die lokale Entwicklung

## Projektbasis

Dieses Projekt ist als Startpunkt für die App angelegt. Es enthält bereits:

- Next.js-App-Struktur mit App Router
- Prisma-Modelle für Filme, Serien und Spiele
- SQLite-Konfiguration
- Beispielseite mit Übersichten und Listen
- API-Route für Einträge

## Schnellstart

1. Abhängigkeiten installieren:
   npm install
2. Prisma-Schema anwenden:
   npx prisma db push
3. Beispieldaten laden:
   npx prisma db seed
4. Entwicklungsserver starten:
   npm run dev

Danach ist die App unter http://localhost:3000 erreichbar.

## Aktueller Stand

- Formular für neue Einträge
- Filter- und Suchmaske
- Detailseiten pro Titel
- Bearbeiten und Löschen
- Statistiken
- Import-Suche für TMDB/RAWG (mit API-Keys in .env)

## Umgebungsvariablen

Kopiere .env.example nach .env und ergänze bei Bedarf API-Keys:

- TMDB_API_KEY
- RAWG_API_KEY

## Nächste Schritte

- Listen und Sammlungen ergänzen
- Export/Import als JSON/CSV
- Erweiterte Sortierung und Tags