# Lone Star Frontier - Evaluation Blueprint (v2.2)

v2.0 can ship before this suite exists. This file is the eval gate after that version. It grades the real API, not the keyword mock. Do not build the harness during v2.0.

## 1. Deterministic Component Evals
- **Contract shape:** API responses match `SCHEMA.md`, including the shared `{code, message}` errors.
- **Price formula:** `get_store_quote` returns the rapport formula in `SCHEMA.md` and never a price outside `[round(0.7 * base), round(1.3 * base)]`. The same Mining Level at two rapports differs only by rapport. Two Mining Levels at the same rapport get the same unit price.
- **Quote integrity:** A quote stores quantity, unit, and total. `execute_trade` applies that exact quantity once. Expired or consumed quotes fail. Gold stays consistent. A sell of quantity N deletes N ore rows.
- **Floor access:** `move` and `mine_ore` reject a floor when Mining Level is below `required_mining_level`.
- **Ore filter:** A swing never returns an ore the player's Mining Level or pickaxe tier has not unlocked. On floors 5–10 the weight table still contains the lower ores, and those ores can drop.
- **Stamina:** A swing below the ore-and-pickaxe cost fails and changes nothing. Cost is `max(4, base_stamina − 2 × extra pickaxe tiers)` before clothing. `tick` restores 2 per second and keeps leftover milliseconds. There is no run mode. XP for a swing is `xp_per_mine × quantity`.
- **Swing time:** A second `mine_ore` before `swing_ends_at` returns `SWING_IN_PROGRESS` and does not grant ore. `set_position` to a new tile discards an unapplied swing and grants nothing. Stamina already spent is not returned. A hit does not discard the swing. `mine_ore` spends stamina and returns a preview. Ore and XP land on the next `get_player_state` or `tick` after `swing_ends_at`, and only for the breaking swing. Swings needed fall by 1 per Mining Level above the ore's requirement and per extra pickaxe tier, and never below 1. A broken spot rejects clicks with `ROCK_DEPLETED` until `respawn_seconds` have passed. Copper takes 3 swings and 10 seconds to return at Mining Level 1 with a Rusty Pickaxe. Iron takes 2 swings at Mining Level 5 with an Iron Pickaxe.
- **Inventory:** `inventory_capacity` is 14. Each ore is its own row at quantity 1. A breaking swing that needs a slot and has none returns `INVENTORY_FULL` and changes nothing. A yield bonus grants a second row only when a second slot is free. Gear does not stack. A new player owns the Rusty Pickaxe and the three starter clothes. `unequip_item` clears a worn clothing slot. A pickaxe returns `INVALID_ACTION`.
- **Position and the Rattler:** `set_position` refuses a tile more than one step away and a step before 400ms has been credited. Every floor stores its Rattler tiles, rolled once. Floors 1–4 have 1, floors 5–8 have 2, floors 9–10 have 3. A tile is not on a rock and is farther than reach 3 from the way up. Inside any reach, `tick` deals `5 + floor` HP every 2000ms, once even if two reaches overlap. The player cannot attack them.
- **Knockout:** At 0 HP the pending swing grants nothing, HP returns to 100, location becomes `mining_quarter`, and gold and XP are unchanged. Starter clothes remain. The 3 other rows with the highest catalog `base_value` remain. The check reads those values from the catalog. It does not special-case a pickaxe or an ore.
- **Ore roll:** Every living spot uses that floor's weights. No spot is reserved for the best ore.
- **Badge:** `mastery_badge_earned` becomes true only when Mining Level becomes 10, and it does not flip back.
- **Rapport clamp:** Suggested deltas outside −5…+5 are clamped. The stored score stays inside 0…100. A message does not also receive a flat +1.

## 2. Semantic LLM-as-a-Judge Evals
- **Pricing direction:** Higher General Store Manager rapport produces a better price for the player (higher sell price, lower buy price) inside the band, matching the formula exactly.
- **Rapport semantics:** Hostile lines (yelling, insults, threats) get a negative delta. Polite or helpful lines get a positive delta. Neutral or repeated compliments can be 0. Magnitude stays inside −5…+5, as in `PRD.md` section 5.
- **Persona:** NPCs keep a Wild West voice.
- **Zero-hallucination grounding:** Townspeople may mention the Rattler. They do not mention fighting back, a combat skill, bounties, horses, or new cities.

## 3. Calibration & Regression Gate
- **Golden set:** 50+ prompt/response pairs covering trade quotes, friendly lines, hostile lines, repeated compliments, and lure questions about backlog features.
- **Thresholds:**
  - Deterministic evals: **100%**
  - Pricing direction and persona: **≥ 90%**
  - Rapport sign (hostile negative, friendly positive): **≥ 90%**
  - Zero-hallucination: **100%**
- **Promotion rule:** Prompt, model, or core-rules changes do not merge to `main` without passing this suite once v2.2 is the active version.
