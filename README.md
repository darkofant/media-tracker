# media-tracker

Eine Basis für eine Medien-Tracking-App mit Fokus auf MVP und einfacher Weiterentwicklung.

## MVP-Funktionen

- Drei Medientypen: Serien, Filme, Spiele
- Status pro Eintrag: geplant, gesehen/nicht abgeschlossen, abgeschlossen, abgebrochen
- Filme gelten nach dem Markieren als gesehen als abgeschlossen
- Serienfortschritt wird über einzelne TMDB-Folgen erfasst und bei vollständigem Fortschritt automatisch abgeschlossen
- Bewertung und Notiz: 1–5 Sterne plus Freitext
- Datum: wann gesehen oder gespielt
- Serien: Staffeln und Folgen aus TMDB mit einzelnem Fortschritt
- Filme und Serien: Streaminganbieter oder Kino; Spiele: Steam, PlayStation, Xbox oder Nintendo Switch
- Spiele: Plattform und optionale Spielzeit in Stunden (Dezimalkomma)
- IMDb-Bewertungen für Filme und Serienfolgen (OMDb API)
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
- Import-Suche für TMDB/RAWG (mit API-Keys in .env); bei Serien und Spielen wird eine eindeutig verfügbare Plattform vorausgewählt (TMDB: Deutschland, RAWG-PC: Steam)

## Umgebungsvariablen

Kopiere `.env.example` nach `.env`. API-Schlüssel können dort gesetzt oder über die Einstellungsseite in der App verwaltet werden. In der Datenbank gespeicherte Schlüssel werden mit AES-256-GCM verschlüsselt. Erzeuge dafür einmal einen Verschlüsselungsschlüssel:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Trage den ausgegebenen Wert in `.env` als `SETTINGS_ENCRYPTION_KEY="..."` ein und starte die App neu. Bewahre diesen Schlüssel sicher auf: Ohne ihn können Datenbank-Schlüssel nicht entschlüsselt werden.

- TMDB_API_KEY
- RAWG_API_KEY
- OMDB_API_KEY (für IMDb-Bewertungen)
- SETTINGS_ENCRYPTION_KEY (für verschlüsselte API-Schlüssel in den Einstellungen)

## Nächste Schritte

- Listen und Sammlungen ergänzen
- Export/Import als JSON/CSV
- Erweiterte Sortierung und Tags