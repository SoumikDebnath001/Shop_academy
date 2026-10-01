# Project Memory — turborepoturorials (Shop Academy)

> Running log of decisions and progress so any session can pick up where the last one left off.
> Keep it short: what the repo is, how it is laid out, what was decided, what is left.

## What this repo is

A Turborepo monorepo (pnpm workspaces) for an e-commerce project ("MAMISTORE"/Smart Market):
an Express + MongoDB API and a Next.js storefront, with shared code in `packages/*`.

## Layout

```
apps/
  backend/              Express + TypeScript API (port 2556)          -> backend
  userfrontend/         Next.js 16 storefront (port 3000)             -> userfrontend
  adminvendorfrontend/  Next.js 16 admin + vendor panel (port 3001)   -> adminvendorfrontend
packages/
  database/       Mongoose connection + all models         -> @repo/database
  ui/             Shared React components                  -> @repo/ui
  eslint-config/  Shared ESLint configs                    -> @repo/eslint-config
  typescript-config/ Shared tsconfig bases                 -> @repo/typescript-config
```

## Rules we follow (from sd-journal.txt + Turborepo docs)

- pnpm is the package manager. Install from the repo root only (`pnpm install`), never inside an app.
- Apps run independently; packages never run on their own (no `dev` script in a package).
- Anything reusable by more than one app goes into `packages/*` (UI, db models, configs, types).
- Shared packages are consumed as `workspace:*` deps and imported as `@repo/<name>`.
- Every task is run through Turborepo: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm check-types`.
- `packages/database` is internal/"just-in-time": it ships TypeScript source, the consumer compiles it.

## Progress log

### 2026-09-21 — Baseline cleanup and shared database package
- Removed the `create-turbo` starter apps `apps/web` and `apps/docs` (not needed).
- Renamed `apps/frontend` -> `apps/userfrontend` (package `userfrontend`).
- Renamed backend package `smart-market` -> `backend`; added `dev` / `build` / `check-types` scripts
  so Turborepo can drive it.
- Moved every Mongoose model out of `apps/Backend/Models` into `packages/database/src/models`,
  added `connectDB()` there, and exported everything from `@repo/database`.
  Backend now imports models from `@repo/database` instead of relative `../../Models/...`.
- Deleted the per-app `package-lock.json` files (they conflict with the pnpm workspace lockfile).
- Removed a nested `.git` repo inside `apps/frontend` (it had only the Create-Next-App scaffold
  commit and was making Turbopack treat the app as its own workspace root). Backup kept in the
  session scratchpad; the monorepo `.git` at the root is the only repo now.
- Cleaned dead code out of `apps/backend/app.ts`: the `buildd` static mounts and the
  `app.get('*')` catch-all that served a Next.js build no longer exist (the UI is its own app),
  and the error handler returns JSON instead of rendering a Jade view that had no engine
  configured. Deleted the unused `views/` folder. Added `GET /health`.
- `turbo.json`: `dev`/`check-types` now `dependsOn: ["^build"]` so `@repo/database` is compiled
  first; `dist/**` added to build outputs; every runtime env var declared under `build.env`.
- Frontend backend URL is now `NEXT_PUBLIC_BACKEND_URL` (falls back to `http://localhost:2556`).

Verified: `pnpm build`, `pnpm check-types` pass; `pnpm dev` brings both apps up, MongoDB
connects, and `GET /api/v1/user/product` + `/category` return data through `@repo/database`.

### 2026-09-21 — renamed adminfrontend -> adminvendorfrontend
- The app was first scaffolded as `adminfrontend`; renamed to `adminvendorfrontend` because
  admins AND vendors both live in this one frontend. Still ONE app, roles split by route/auth.
- Renaming a workspace needs `pnpm install --force`: a plain `pnpm install` after the directory
  move left `apps/adminvendorfrontend/node_modules` missing, so `next` was not on PATH and the
  build died with `sh: 1: next: not found`.
- Fixed a latent bug the rename exposed: `check-types` was plain `tsc --noEmit`, which fails on
  a clean tree with `Cannot find name 'LayoutProps'` because Next generates `.next/types`
  during the build. `check-types` now declares `dependsOn: ["^build", "build"]` in turbo.json.
  (Do NOT "fix" this by putting `next typegen` in the script - it then races with a concurrent
  `next build` over `.next` when turbo runs both tasks in one invocation.)
- turbo.json is JSONC: `//` comments are fine, but unknown keys like `"comment"` are rejected.

### 2026-09-21 — adminvendorfrontend scaffolded
- New `apps/adminvendorfrontend` (Next.js 16, App Router, Tailwind v4, TypeScript, port 3001),
  created with `create-next-app`. Decision: ONE app for both admin and vendor users, roles
  separated by route/auth inside it — not two apps. Named to match `userfrontend`.
- Scaffold cleanup: `create-next-app` writes its own `pnpm-workspace.yaml` and a
  `packageManager` field — both deleted, they fight the root workspace. (It did NOT create a
  nested `.git` this time, because it ran inside an existing repo.)
- Connected to the backend, no UI built:
  - `services/api.ts` covers the whole `/api/v1/admin` surface (auth incl. the OTP + TOTP
    steps, dashboard, category, product, order), cookie-based via `credentials: 'include'`,
    mirroring `userfrontend/services/api.ts`.
  - Backend CORS was single-origin; it now allows an `allowedOrigins` array driven by
    `FRONTEND_URL` + the new `ADMIN_FRONTEND_URL`. Add new frontends there.
  - `next.config.ts` sets noindex/DENY-frame/nosniff/no-referrer on every route.
  - `app/page.tsx` is a throwaway connectivity probe (shows backend origin + reachability) —
    delete it when the real dashboard lands.
- The old admin UI still lives at `apps/userfrontend/app/grassroots-admin/*`. It was left
  alone deliberately; migrating it into `adminvendorfrontend` is a separate job.
- Verified: build, check-types and lint all pass for `adminvendorfrontend`; all three apps run
  together; CORS preflight from `:3001` returns `Access-Control-Allow-Origin: http://localhost:3001`
  with credentials, `:3000` still works, and an unknown origin gets no allow-origin header.

## Still open / next up

- `apps/backend/.env` holds real secrets and is git-ignored; a `.env.example` is checked in instead.
- `pnpm lint` FAILS on `userfrontend` with 42 pre-existing errors in the app's own code
  (33x `@typescript-eslint/no-explicit-any`, 4x `react-hooks/set-state-in-effect`,
  3x `react-hooks/immutability`, 2x `react-hooks/purity` — `Math.random()` during render in
  `components/ProductCard.tsx`) plus 19 warnings (mostly `next/no-img-element`).
  These are code-quality issues, not setup issues; nothing was suppressed. Clean them up next.
- `apps/backend` has no ESLint config yet, so `pnpm lint` skips it.
- `adminvendorfrontend` has no real UI — one placeholder page. Next: port the `grassroots-admin`
  screens over from `userfrontend` and then delete them there.
- Killing dev servers needs `pkill -f next-server` too; killing only `next dev` leaves the
  `next-server` child holding the port and the next run dies with EADDRINUSE.
- `apps/backend` pins `@types/express@^5` while running `express@~4.16` — works today only
  because the backend tsconfig has `strict: false`. Worth aligning.
- Shared request/response types between backend and frontend are still duplicated; a
  `packages/types` would be the next thing to factor out.
