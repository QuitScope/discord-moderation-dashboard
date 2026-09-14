# ModGuard Dashboard (Demo)

A Discord server-moderation dashboard — cases, violations, audit log, member
analytics, TempVoice, AutoMod, and more — built with Next.js 16 and React 19.

This is a standalone **portfolio demo**: it runs against an in-process mock
data store instead of a real database or Discord server, and login is a
one-click demo session instead of real Discord OAuth. No moderation actions
here have any real effect anywhere, and no requests ever leave the process
to Discord's API or any real backend.

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
- An in-process mock store (`src/lib/mock-store.ts` and friends) standing in
  for the real product's NestJS API + PostgreSQL/Prisma backend and Discord
  bot connection

## Running locally

```bash
pnpm install
cp .env.example .env.local   # fill in NEXTAUTH_SECRET
pnpm dev
```

Open http://localhost:3000 and click "Demo-Login starten".

## Notes

- Mock data resets whenever the server process restarts.
- This repo is a UI/architecture showcase extracted from a larger private
  project; it is not connected to any real Discord server, database, or the
  Discord API.
