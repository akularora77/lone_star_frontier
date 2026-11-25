# Lone Star Frontier - Agent Boundaries

`main` holds the specs. Build from `PRD.md`, `SCHEMA.md`, `STYLE_GUIDE.md`, and `CONTEXT.md`. If a spec change is needed, describe it and wait. Do not edit spec files from Lovable or Replit.

## Lovable (frontend)
- Edit `src/` only. That includes the TanStack root head, `src/styles.css`, `src/game/`, and mock tests.
- The game screen is the `/` route. Do not add a route per mine floor.
- The v1 view is 2D and top-down. A parallel 3D view uses the same `GameService`.
- All rules go through `GameService` in `src/game/api.ts`. The method list and the error codes match `SCHEMA.md`.
- Components import `GameService`. They do not import `mockService` or `httpService`, and they do not compute prices, drops, XP, stamina, locks, or rapport.
- `tick` only restores stamina. There is no run mode. A second mine click before `swing_ends_at` is refused. A component timer calls `tick` and stores the snapshot.
- Seed data matches the catalog, XP table, floor table, and ore weights in `SCHEMA.md`.
- No Lovable Cloud. No Supabase client. No game rules in TanStack server functions.

## Replit (backend)
- Edit `server/` and `evals/`. Implement the same contracts. Supabase is the store.
- Clamp prices to the band and rapport deltas to −5…+5 even when the model suggests otherwise.
- Townspeople stay inside the v1.0 world.

## Spec edits in this repo
Small clarifications can be made locally and pushed to `main` in batches. Progression, economy, and the AI contract wait for the user's approval first.
