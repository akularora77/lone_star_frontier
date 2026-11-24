# Lone Star Frontier - Evaluation Blueprint (v1.1)

v1.0 can ship against the Lovable mock tests in `src/`. This file is the later Replit gate. It grades the real API, not the keyword mock.

## 1. Deterministic Component Evals
- **Contract shape:** API responses match `SCHEMA.md`, including the shared `{code, message}` errors.
- **Price bounds:** `get_store_quote` never returns a unit price outside `[round(0.7 * base), round(1.3 * base)]`, for both the formula stand-in and a model proposal.
- **Quote integrity:** A quote stores quantity, unit, and total. `execute_trade` applies that exact quantity once. Expired or consumed quotes fail. Gold and stacks stay consistent.
- **Floor access:** `move` and `mine_ore` reject a floor when Mining Level is below `required_mining_level`.
- **Ore filter:** A swing never returns an ore the player's Mining Level or pickaxe tier has not unlocked. On floors 5–10 the weight table still contains the lower ores, and those ores can drop.
- **Stamina:** A swing below the adjusted cost fails and changes nothing. `tick` restores 2/sec while walking and spends 4/sec while running. Running at 0 switches to walk.
- **Inventory:** Ores stack in one slot up to 9,999. A swing that cannot place its ore returns `INVENTORY_FULL` and changes nothing. Gear does not stack.
- **Badge:** `mastery_badge_earned` becomes true only when Mining Level becomes 10, and it does not flip back.
- **Rapport clamp:** Suggested deltas outside −5…+5 are clamped. The stored score stays inside 0…100. A message does not also receive a flat +1.

## 2. Semantic LLM-as-a-Judge Evals
- **Pricing direction:** Higher General Store Manager rapport produces a better price for the player (higher sell price, lower buy price) inside the band. Mining Level may influence a model proposal and cannot push it outside the band.
- **Rapport semantics:** Hostile lines (yelling, insults, threats) get a negative delta. Polite or helpful lines get a positive delta. Neutral or repeated compliments can be 0. Magnitude stays inside the guidance in `PRD.md` section 8.
- **Persona:** NPCs keep a Wild West voice.
- **Zero-hallucination grounding:** Townspeople do not mention v2.0+ backlog features (bounties, horses, monsters, combat, new cities).

## 3. Calibration & Regression Gate
- **Golden set:** 50+ prompt/response pairs covering trade quotes, friendly lines, hostile lines, repeated compliments, and lure questions about backlog features.
- **Thresholds:**
  - Deterministic evals: **100%**
  - Pricing direction and persona: **≥ 90%**
  - Rapport sign (hostile negative, friendly positive): **≥ 90%**
  - Zero-hallucination: **100%**
- **Promotion rule:** Prompt, model, or core-rules changes do not merge to `main` without passing this suite once v1.1 is the active version.
