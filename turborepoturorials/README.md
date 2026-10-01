# turborepoturorials — Shop Academy monorepo

A [Turborepo](https://turborepo.dev) monorepo managed with **pnpm workspaces**.

## What's inside

### Apps (run independently)

| Path                       | Package               | What it is                               | Port |
| -------------------------- | --------------------- | ---------------------------------------- | ---- |
| `apps/backend`             | `backend`             | Express + TypeScript REST API on MongoDB | 2556 |
| `apps/userfrontend`        | `userfrontend`        | Next.js 16 storefront (Tailwind)         | 3000 |
| `apps/adminvendorfrontend` | `adminvendorfrontend` | Next.js 16 admin + vendor panel          | 3001 |

### Packages (shared, never run on their own)

| Path                        | Package                   | What it is                                        |
| --------------------------- | ------------------------- | ------------------------------------------------- |
| `packages/database`         | `@repo/database`          | Mongoose connection (`connectDB`) + all models     |
| `packages/ui`               | `@repo/ui`                | Shared React components                            |
| `packages/eslint-config`    | `@repo/eslint-config`     | Shared ESLint configs                              |
| `packages/typescript-config`| `@repo/typescript-config` | Shared `tsconfig` bases                            |

Everything is TypeScript.

## Getting started

```bash
pnpm install                     # always from the repo root
cp apps/backend/.env.example apps/backend/.env            # fill in MONGO_URI etc.
cp apps/userfrontend/.env.example apps/userfrontend/.env   # optional, defaults to localhost:2556
cp apps/adminvendorfrontend/.env.example apps/adminvendorfrontend/.env # optional, defaults to localhost:2556
pnpm dev
```

`pnpm dev` starts all three apps: the API on <http://localhost:2556>, the storefront on
<http://localhost:3000> and the admin panel on <http://localhost:3001>. Turborepo builds
`@repo/database` first, because the apps depend on it.

The backend allows both frontend origins for cookie-based auth, via `FRONTEND_URL`
(default `http://localhost:3000`) and `ADMIN_FRONTEND_URL` (default `http://localhost:3001`).
Adding another frontend means adding its origin to `allowedOrigins` in `apps/backend/app.ts`.

## Scripts (all run through Turborepo from the root)

| Command            | What it does                                        |
| ------------------ | --------------------------------------------------- |
| `pnpm dev`         | Runs every app in watch mode                         |
| `pnpm build`       | Builds packages, then apps                           |
| `pnpm start`       | Builds, then runs the apps in production mode        |
| `pnpm check-types` | Type-checks every workspace                          |
| `pnpm lint`        | Lints every workspace                                |
| `pnpm clean`       | Removes build output and `node_modules`              |

Target a single workspace with `--filter`:

```bash
pnpm dev --filter=backend
pnpm dev --filter=adminvendorfrontend
pnpm build --filter=userfrontend
```

## Conventions

- pnpm only, and only install from the root — never run `npm install` inside an app.
- Code used by more than one app belongs in `packages/*`, imported as `@repo/<name>`,
  declared as `"@repo/<name>": "workspace:*"`.
- Packages have no `dev` script; they are built by Turborepo as a dependency of the app that uses them.
- Database access goes through `@repo/database`; apps do not import `mongoose` directly.
