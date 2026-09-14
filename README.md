# ModGuard Dashboard

Web dashboard for a Discord moderation bot — cases, audit log, member
analytics, TempVoice, AutoMod, and the rest.

**Preview:** [dashboard.quitscope.eu](https://dashboard.quitscope.eu/)

This is just the frontend, running on mock data. The real bot and its
backend (NestJS + Postgres) are in a private repo — this here is a
stripped-down version for showing off the UI. Login is a one-click demo
session, no real Discord OAuth, and nothing here ever talks to Discord's
API or a real server.

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

- **Moderation** — cases (warnings, points, bans, timeouts, rejoin bans, role
  bans, mass-message deletes, ...), violations, watchlist, audit log, AutoMod
- **Analytics** — case volume over time, action-type breakdown, leaderboard,
  moderator stats
- **Server management** — channels, roles, members, threads
- **Community** — TempVoice, Wortkette, confessions, reaction roles, embed
  builder, webhooks, welcome cards, birthdays, ban tags

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- next-auth 5 (Auth.js) — demo Credentials login, JWT sessions
- Tailwind CSS 4
- Mock store (`src/lib/mock-store.ts` and friends) instead of the real
  NestJS API / Postgres backend and Discord bot connection

## Running locally

```bash
pnpm install
cp .env.example .env.local   # fill in NEXTAUTH_SECRET
pnpm dev
```

Open http://localhost:3000, click "Demo-Login starten".

## Notes

- Mock data resets on every server restart.
- No connection to any real Discord server, database, or the Discord API.
