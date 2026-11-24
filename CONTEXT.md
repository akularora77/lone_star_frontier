# Lone Star Frontier - Project Context

## Multi-Tool Workflow & Source of Truth
This repository on GitHub (`main` branch) serves as the **Single Source of Truth** for all markdown specs, schemas, evals, and code. Two primary tools consume this repository to build and iterate:

1.  **GitHub (`main` branch):** Orchestrates all specs and versioning.
2.  **Lovable (Frontend UI):**
    *   **Reads:** `CONTEXT.md`, `PRD.md`, and `SCHEMA.md` from `main`.
    *   **Owns:** `src/` (React UI components).
    *   **Scope:** UI presentation, frontend logic, and component-level state.
3.  **Replit (Backend & Evals):**
    *   **Pulls:** `main` branch.
    *   **Owns:** `evals/`, `server/`, and backend logic.
    *   **Scope:** Gemini API backend, Supabase PostgreSQL integration, deterministic game rules, and Python eval harnesses.

## Strict File Ownership & Boundaries
To prevent collisions between Lovable and Replit:
- **Lovable** must only modify files related to the frontend UI (`src/`).
- **Replit** must only modify files related to the backend, API, and evals.
- **GitHub `main`** is the only place where shared specs (`PRD.md`, `SCHEMA.md`, `EVALS.md`) are modified.

## Living PRD & Version Promotion Protocol
We maintain a single living `PRD.md` at the root. We do not create separate `PRD_v1.md`, `PRD_v2.md`, etc.

### Promotion Gate Workflow:
1.  **Update `PRD.md`:** Bump `Active Version`, log changes in the `Changelog`, and move features from the **Version-Gated Backlog Table** into the active sections.
2.  **Sync Specs:** Update `SCHEMA.md` and `EVALS.md` in the same commit to reflect the new active features.
3.  **Pull Updates:**
    *   Pull `main` in **Lovable** to iterate on the UI.
    *   Pull `main` in **Replit** to implement backend logic and evals.

### Roadmap Overview:
- **v1.0 (Current):** Core Mining Loop & Boomtown Hub.
- **v1.1:** Eval & Guardrail Hardening.
- **v2.0:** Ore Bounties & Quests.
- **v2.1:** Horseback Riding.
- **v3.0:** Combat, Monsters, and Map Expansion.
