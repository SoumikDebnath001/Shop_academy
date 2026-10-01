# `@repo/database`

The shared MongoDB layer: one Mongoose connection plus every model used across the monorepo.
It is a helper package — it never runs on its own, apps import it.

## Usage

```ts
import { connectDB, User, Order } from "@repo/database";

await connectDB(); // reads process.env.MONGO_URI unless a uri is passed
const user = await User.findOne({ email });
```

## Adding a model

1. Create `src/models/<Name>.ts` and export the model.
2. Re-export it from `src/index.ts`.
3. `pnpm build` at the repo root (Turborepo rebuilds this package before the apps that use it).
