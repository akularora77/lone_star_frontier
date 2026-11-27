# Lone Star Frontier - Project Context

## Multi-Tool Workflow & Source of Truth
GitHub `main` is the single source of truth for specs, schema, evals, and code. Lovable and Replit pull `main` and build against it.

1. **GitHub (`main`):** Specs and versioning. Shared specs (`PRD.md`, `SCHEMA.md`, `EVALS.md`, `STYLE_GUIDE.md`, `CONTEXT.md`, `AGENTS.md`) change here.
2. **Lovable (frontend):** Connects GitHub from its project settings. That creates a private repo and two-way syncs the app with that repo only. Lovable does not push to `akularora77/lone_star_frontier`. It reads **Recent changes** in `PRD.md` when that file is shown to it. It does not edit spec files.
3. **Replit (backend & evals):** Pulls `main`. Owns `evals/`, `server/`, and backend logic. Gemini API, Supabase PostgreSQL, deterministic game rules, and the Python eval harness.

## Who Edits Specs
Lovable and Replit should propose spec changes in plain language when they hit a blocker. They do not edit the spec files themselves.

When the prototype gains a rule the specs do not already state, Lovable records it in `src/PROTOTYPE_DRIFT.md` in its own repo, `akularora77/lone-star-frontier`. Each entry names the prototype behavior, the spec behavior, the `SCHEMA.md` constant if a number is involved, and whether `src/` still contains that number as a literal.

A "pull Lovable" reads that drift file from `akularora77/lone-star-frontier` and compares it with the specs in this repo. It does not review the copy already on this `main`. Proposals that match the game are written into the specs. When a proposal fights a rule already set, ask before changing it. After that confirmation, push the spec updates and the copied app to this `main`. The pull copies `src/`, `public/`, and the app config files (`package.json`, lockfile, and the TypeScript and Vite config). It does not copy a Lovable `README.md` or `AGENTS.md` over this repo's. Each pull also says one way the Lovable handoff could work better. Replit builds from this repo, not from the Lovable repo and not from the drift file.

In this repo, small clarifications can be applied locally and pushed in batches. Major changes to progression, economy, or the AI contract wait for the user's approval before they land on `main`. After a spec push, Lovable and Replit pull `main` before building further.

## Lovable Client (v2.0)
- The v2.0 prototype is 2D and top-down. Replit integrates against it. The 3D follow view is v2.1 and is not part of this build. It will call the same `GameService`.
- TanStack Start. One route, `/`, holds the whole game screen. Locations are state.
- Player snapshot and UI state live in a React context/reducer under `src/game/`.
- `src/game/api.ts` defines a `GameService` interface that mirrors the `SCHEMA.md` contracts, including `tick`.
- `mockService.ts` seeds the catalog, 10 floors, ore weights, and three NPCs. It enforces the price formula, floor locks, ore filter, ore-and-pickaxe stamina, inventory, and rapport clamp from `SCHEMA.md`. Its only stand-in is the keyword list for rapport.
- A later `httpService.ts` calls the Replit API through a base URL setting. Components depend on `GameService` only. A setting chooses the implementation.
- The reducer stores the latest service snapshot. Timers call `tick`. Components do not add or subtract gold, XP, stamina, or rapport.
- The mock keeps the player in memory. `localStorage` is not the player record.
- No Lovable Cloud. No Supabase client in `src/`. The browser reaches the database only through Replit.
- Fonts and the page title are set from the root head inside `src/`.
- Mock tests live next to the mock under `src/`. They cover the price band, locked floors, the ore filter, stamina, trades, inventory-full, quote expiry, the rapport clamp, unstacked ore, cancelling a swing by walking, Rattlers that roam, Rattler hits, and knockout. They do not replace the later harness in `evals/`.

## File Ownership
- **Lovable:** `src/` only, including colocated mock tests, `src/styles.css`, and `src/PROTOTYPE_DRIFT.md`.
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
- **v1.0:** Core mining loop and Boomtown hub.
- **v2.0 (current):** 2D dangerous mine. Position, denser floors, Rattlers on every floor, knockout, and unstacked ore.
- **v2.1:** 3D follow view, same rules.
- **v2.2:** Eval and guardrail hardening, against the v2.0 rules.
- **v3.0:** Ore bounties and quests.
- **v3.1:** Horseback riding.
- **v4.0:** Fighting back, a combat skill, and map expansion.
