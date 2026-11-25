# Lone Star Frontier - Evaluation Blueprint (v1.1)

v1.0 can ship against the Lovable mock tests in `src/`. This file is the later Replit gate. It grades the real API, not the keyword mock.

## 1. Deterministic Component Evals
- **Contract shape:** API responses match `SCHEMA.md`, including the shared `{code, message}` errors.
- **Price formula:** `get_store_quote` returns the rapport formula in `SCHEMA.md` and never a price outside `[round(0.7 * base), round(1.3 * base)]`. The same Mining Level at two rapports differs only by rapport. Two Mining Levels at the same rapport get the same unit price.
- **Quote integrity:** A quote stores quantity, unit, and total. `execute_trade` applies that exact quantity once. Expired or consumed quotes fail. Gold and stacks stay consistent.
- **Floor access:** `move` and `mine_ore` reject a floor when Mining Level is below `required_mining_level`.
- **Ore filter:** A swing never returns an ore the player's Mining Level or pickaxe tier has not unlocked. On floors 5–10 the weight table still contains the lower ores, and those ores can drop.
- **Stamina:** A swing below the ore-and-pickaxe cost fails and changes nothing. Cost is `max(4, base_stamina − 2 × extra pickaxe tiers)` before clothing. `tick` restores 2 per second and keeps leftover milliseconds. There is no run mode. XP for a swing is `xp_per_mine × quantity`.
- **Swing time:** A second `mine_ore` before `swing_ends_at` returns `SWING_IN_PROGRESS` and does not grant another ore. The next rock is absent until the swing duration ends. Copper takes 2 seconds. Mithril takes 4.
- **Inventory:** Ores stack in one slot up to 9,999. A swing that cannot place its ore returns `INVENTORY_FULL` and changes nothing. Gear does not stack.
- **Badge:** `mastery_badge_earned` becomes true only when Mining Level becomes 10, and it does not flip back.
- **Rapport clamp:** Suggested deltas outside −5…+5 are clamped. The stored score stays inside 0…100. A message does not also receive a flat +1.

## 2. Semantic LLM-as-a-Judge Evals
- **Pricing direction:** Higher General Store Manager rapport produces a better price for the player (higher sell price, lower buy price) inside the band, matching the formula exactly.
- **Rapport semantics:** Hostile lines (yelling, insults, threats) get a negative delta. Polite or helpful lines get a positive delta. Neutral or repeated compliments can be 0. Magnitude stays inside −5…+5, as in `PRD.md` section 5.
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
