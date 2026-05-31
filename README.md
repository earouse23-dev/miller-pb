# Miller Pickleball 🥒

A real-time tournament management web app for pickleball night. Dark athletic
aesthetic, electric-lime accents, live standings and brackets that update across
every connected device.

## Tech stack

- **React 18 + TypeScript + Vite**
- **Tailwind CSS** with custom design-system tokens
- **Supabase** — Postgres + Realtime (anonymous, invite-code access)
- **Framer Motion** for transitions, modals, page changes
- **Zustand** for global state · **Lucide** icons · **canvas-confetti**

## Setup

```bash
npm install
cp .env.example .env   # then fill in your Supabase URL + anon key
npm run dev
```

### 1. Environment

`.env` (gitignored) needs:

```
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
```

### 2. Database (one-time)

Open your Supabase dashboard → **SQL Editor** → **New query**, paste the entire
contents of [`supabase/migrations/0000_init_schema.sql`](supabase/migrations/0000_init_schema.sql),
and **Run**. It creates the tables, RLS policies (anonymous full access), and
enables Realtime on `matches` + `tournaments`. The script is idempotent.

## Scripts

| Command             | What it does                  |
| ------------------- | ----------------------------- |
| `npm run dev`       | Start the dev server          |
| `npm run build`     | Type-check + production build |
| `npm run preview`   | Preview the production build  |
| `npm run typecheck` | Type-check only               |

Schedule generators are verified with:

```bash
npx esbuild scripts/verify-schedule.ts --bundle --platform=node --format=esm --outfile=/tmp/v.mjs && node /tmp/v.mjs
```

## How it works

- **Formats:** Round Robin · Bracket (single elim) · Round Robin → Bracket.
  In the combined format the bracket is generated automatically (seeded by
  standings) once every round-robin match is scored.
- **Match types:** Singles · Doubles (fixed partners) · Doubles (random partners,
  drawn at creation).
- **Round robin** uses the circle method — every team plays once, courts
  alternate 1/2, byes rotate fairly on odd counts.
- **Identity** is a per-device id in `localStorage`; the tournament host is
  whoever created it. Anyone with the 6-char invite code can join and submit
  scores. Scores propagate to all devices via Supabase Realtime.

## Structure

```
src/
  components/  ui/ · layout/ · tournament/ · create/
  pages/       Home · Create · Tournament
  lib/         supabase · api · tournament-logic · types · utils · confetti
  store/       useTournamentStore · useToastStore
  hooks/       useTournament · useRealtime
```
