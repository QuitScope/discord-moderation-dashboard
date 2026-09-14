# ModGuard Dashboard

Web-Dashboard für einen Discord-Moderations-Bot — Cases, Audit-Log,
Mitglieder-Analytics, TempVoice, AutoMod und der Rest.

**Preview:** [dashboard.quitscope.eu](https://dashboard.quitscope.eu/)

Das hier ist nur das Frontend, läuft mit Mock-Daten. Der eigentliche Bot
und sein Backend (NestJS + Postgres) liegen in einem privaten Repo — das
hier ist eine abgespeckte Version nur zum Zeigen des UIs. Login ist eine
One-Click-Demo-Session, kein echtes Discord-OAuth, und nichts hier
spricht jemals mit der Discord-API oder einem echten Server.

## Screenshots

**Overview**

![Dashboard overview](docs/screenshots/dashboard.jpg)

**Cases**

![Cases list](docs/screenshots/cases.jpg)

**Analytics**

![Analytics](docs/screenshots/analytics.jpg)

**TempVoice**

![TempVoice configuration](docs/screenshots/tempvoice.jpg)

## Features

- **Moderation** — Cases (Warnungen, Punkte, Bans, Timeouts, Rejoin-Bans,
  Role-Bans, Massenlöschung von Nachrichten, ...), Violations, Watchlist,
  Audit-Log, AutoMod
- **Analytics** — Case-Volumen über Zeit, Aufschlüsselung nach Aktionstyp,
  Leaderboard, Moderator-Statistiken
- **Server-Verwaltung** — Channels, Rollen, Mitglieder, Threads
- **Community** — TempVoice, Wortkette, Confessions, Reaction Roles,
  Embed-Builder, Webhooks, Welcome Cards, Geburtstage, Ban-Tags

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- next-auth 5 (Auth.js) — Demo-Credentials-Login, JWT-Sessions
- Tailwind CSS 4
- Mock-Store (`src/lib/mock-store.ts` und Verwandte) statt dem echten
  NestJS-API / Postgres-Backend und der Discord-Bot-Anbindung

## Lokal starten

```bash
pnpm install
cp .env.example .env.local   # NEXTAUTH_SECRET eintragen
pnpm dev
```

http://localhost:3000 öffnen, "Demo-Login starten" klicken.

## Hinweise

- Mock-Daten werden bei jedem Server-Neustart zurückgesetzt.
- Keine Verbindung zu einem echten Discord-Server, einer Datenbank oder
  der Discord-API.
