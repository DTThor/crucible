# Crucible

A mobile-first PWA to plan, prioritize, and track the habits that matter most. v0.1.0 ships the foundation — auth, app shell, four tabs, installable on your phone home screen. Fasting and training features land in Phases 1 and 2.

## Stack

Next.js 15 · TypeScript · Tailwind · Supabase (Postgres + auth) · Drizzle ORM · Vercel

## Quick start

```bash
pnpm install   # or npm install / yarn
cp .env.local.example .env.local
# fill in the Supabase values from your project settings
pnpm dev
```

Open http://localhost:3000 — sign in with a magic link, you'll land on Today.

## Full setup

See [SETUP.md](./SETUP.md) for a step-by-step from zero (no GitHub repo, no Supabase, no Vercel) to a live URL on your phone home screen.

## Architecture

See [../architecture.md](../architecture.md) for the design doc — fasting program, training program, data model, build roadmap.

## Project layout

```
crucible/
├── src/
│   ├── app/              # Next.js App Router routes
│   │   ├── page.tsx      # Today (home)
│   │   ├── fast/         # Fast tab
│   │   ├── train/        # Train tab
│   │   ├── me/           # Me tab
│   │   ├── login/        # Magic-link sign-in
│   │   └── auth/         # Callback + sign-out
│   ├── components/
│   │   ├── ui/           # Button, Card primitives
│   │   ├── bottom-nav.tsx
│   │   ├── page-header.tsx
│   │   └── theme-provider.tsx
│   ├── lib/
│   │   ├── supabase/     # Browser, server, middleware clients
│   │   ├── site.ts       # APP_NAME, getSiteUrl()
│   │   └── utils.ts      # cn(), unit conversions, formatDuration()
│   └── db/
│       ├── schema.ts     # Drizzle schema
│       └── index.ts      # Drizzle client
├── supabase/
│   └── migrations/
│       └── 0000_init.sql # Profiles, fasts, water/weight, RLS
├── public/
│   ├── manifest.json     # PWA manifest
│   ├── sw.js             # Service worker (offline-capable)
│   └── icons/            # App icons (regenerate from icon.svg)
├── middleware.ts         # Auth gate
├── next.config.ts
├── tailwind.config.ts
└── drizzle.config.ts
```

## Scripts

```bash
pnpm dev          # Dev server (Turbopack)
pnpm build        # Production build
pnpm typecheck    # TypeScript check
pnpm lint         # ESLint
pnpm db:generate  # Generate migration from Drizzle schema diff
pnpm db:migrate   # Apply migrations to DATABASE_URL
pnpm db:studio    # Open Drizzle Studio
```

For app schema, prefer the SQL migrations in `supabase/migrations/` — they're explicit, reviewable, and let you set up RLS policies and triggers that Drizzle's generator doesn't handle. Drizzle here is mostly for the ORM-style query layer.
