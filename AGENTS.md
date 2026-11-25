# Lone Star Frontier - Agent Boundaries

`main` holds the specs. Build from `PRD.md`, `SCHEMA.md`, `STYLE_GUIDE.md`, and `CONTEXT.md`. If a spec change is needed, describe it and wait. Do not edit spec files from Lovable or Replit.

## Lovable (frontend)
- Edit `src/` only. That includes the TanStack root head, `src/styles.css`, `src/game/`, mock tests, and `src/PROTOTYPE_DRIFT.md`.
- Lovable syncs its own private GitHub repo. It does not push this repo. After a prototype change that the specs do not already state, update `src/PROTOTYPE_DRIFT.md` in that repo. It is a proposal list. It is not a spec. Do not edit `PRD.md`, `SCHEMA.md`, `STYLE_GUIDE.md`, `EVALS.md`, `CONTEXT.md`, or `AGENTS.md`.
- The game screen is the `/` route. Do not add a route per mine floor.
- The v2.0 view is 2D and top-down. Do not build the 3D view. That is v2.1 and uses the same `GameService`.
- All rules go through `GameService` in `src/game/api.ts`. The method list and the error codes match `SCHEMA.md`.
- Components import `GameService`. They do not import `mockService` or `httpService`, and they do not compute prices, drops, XP, stamina, hit points, knockout, locks, or rapport.
- `tick` restores stamina, credits the next walk step, and applies Rattler hits. There is no run mode. A second mine click before `swing_ends_at` is refused. Walking to a new tile cancels the swing and grants nothing. A component timer calls `tick` and stores the snapshot. The client calls `set_position` once per tile.
- Seed data matches the catalog, XP table, floor table, and ore weights in `SCHEMA.md`.
- No Lovable Cloud. No Supabase client. No game rules in TanStack server functions.

## Replit (backend)
- Edit `server/` and `evals/`. Implement the same contracts. Supabase is the store.
- Clamp prices to the band and rapport deltas to −5…+5 even when the model suggests otherwise.
- Townspeople may mention the Rattler. They stay out of the backlog: no fighting back, bounties, horses, or other towns.

## Spec edits in this repo
Small clarifications can be made locally and pushed to `main` in batches. Progression, economy, and the AI contract wait for the user's approval first.
