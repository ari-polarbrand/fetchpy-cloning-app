# PolarTechWorks

Monorepo for PolarTechWorks — Next.js marketing site + NestJS auth API.

## Apps

- `apps/web` — Next.js 16 (App Router), React 19, Tailwind CSS v4 → http://localhost:3000
- `apps/api` — NestJS 12, Prisma 7, MySQL, JWT cookie auth → http://localhost:3001/api

## Setup

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
# set DATABASE_URL, then:
pnpm --filter api prisma:generate
pnpm --filter api prisma:migrate
```

## Scripts

```bash
pnpm dev    # turbo dev (web + api)
pnpm build  # turbo build
pnpm lint   # turbo lint
```
