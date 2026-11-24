# Lone Star Frontier - Project Context

## Multi-Tool Workflow & Source of Truth
GitHub `main` is the single source of truth for specs, schema, evals, and code. Lovable and Replit pull `main` and build against it.

1. **GitHub (`main`):** Specs and versioning. Shared specs (`PRD.md`, `SCHEMA.md`, `EVALS.md`, `STYLE_GUIDE.md`, `CONTEXT.md`, `AGENTS.md`) change here.
2. **Lovable (frontend):** Reads those specs from `main`. Owns `src/` only. Presents the game and holds client state. It does not edit spec files.
3. **Replit (backend & evals):** Pulls `main`. Owns `evals/`, `server/`, and backend logic. Gemini API, Supabase PostgreSQL, deterministic game rules, and the Python eval harness.

## Who Edits Specs
Lovable and Replit should propose spec changes in plain language when they hit a blocker. They do not edit the spec files themselves.

In this repo, small clarifications can be applied locally and pushed in batches. Major changes to progression, economy, or the AI contract wait for the user's approval before they land on `main`. After a spec push, Lovable and Replit pull `main` before building further.

## Lovable Client (v1.0)
- TanStack Start. One route, `/`, holds the whole game screen. Locations are state.
- Player snapshot and UI state live in a React context/reducer under `src/game/`.
- `src/game/api.ts` defines a `GameService` interface that mirrors the `SCHEMA.md` contracts, including `tick`.
- `mockService.ts` seeds the catalog, 10 floors, ore weights, and three NPCs. It enforces the price band, floor locks, ore filter, stamina, inventory, and rapport clamp. Rapport and prices in the mock use the stand-ins in `SCHEMA.md`.
- A later `httpService.ts` calls the Replit API through a base URL setting. Components depend on `GameService` only. A setting chooses the implementation.
- The reducer stores the latest service snapshot. Timers call `tick`. Components do not add or subtract gold, XP, stamina, or rapport.
- The mock keeps the player in memory. `localStorage` is not the player record.
- No Lovable Cloud. No Supabase client in `src/`. The browser reaches the database only through Replit.
- Fonts and the page title are set from the root head inside `src/`.
- Mock tests live next to the mock under `src/`. They cover the price band, locked floors, the ore filter, stamina, trades, inventory-full, quote expiry, and the rapport clamp. They do not replace the v1.1 harness in `evals/`.

## File Ownership
- **Lovable:** `src/` only, including colocated mock tests and `src/styles.css`.
- **Replit:** `server/`, `evals/`, Supabase, and the Gemini API.
- **`main` specs:** `PRD.md`, `SCHEMA.md`, `EVALS.md`, `STYLE_GUIDE.md`, `CONTEXT.md`, `AGENTS.md`.

Game rules, on either side, go through the contracts in `SCHEMA.md`. TanStack server functions are not a second game backend.

## Living PRD & Version Promotion
There is one living `PRD.md`. Do not add `PRD_v1.md`, `PRD_v2.md`, and so on.

### Promotion Gate
1. Update `PRD.md`: bump Active Version, log the changelog, and move features up from the backlog table.
2. Update `SCHEMA.md` and `EVALS.md` in the same commit.
3. Pull `main` in Lovable and in Replit, then build.

### Roadmap
- **v1.0 (current):** Core mining loop and Boomtown hub.
- **v1.1:** Eval and guardrail hardening.
- **v2.0:** Ore bounties and quests.
- **v2.1:** Horseback riding.
- **v3.0:** Combat, monsters, and map expansion.
