# Lone Star Frontier - Product Requirements Document (Living Spec)

## Document Control & Changelog
- **Active Version:** v1.0 (Core Mining Loop & Boomtown Hub)
- **Previous Versions:** None
- **Changelog:**
  - **v1.0:** Initial v1 scope—Boomtown hub, 10-level Mine, 5-tier ore ladder, player stats, dynamic store pricing, and lore-grounded townspeople.
  - **v1.0 (amended):** Mixed ore drops on every deep floor, ore unlocks separate from floor entry, one Mining Level 10 mastery badge, semantic rapport, time-based stamina regen, and shared trade / inventory / dialogue contracts. Implementation numbers live in `SCHEMA.md`.

## 1. Terminology & Variables (SSoT for Names)
To allow for easy rebranding, all entities use the following master names, centralized in code:
- **HUB_CITY_NAME:** "Boomtown" (placeholder — will change)
- **GENERAL_STORE_NAME:** "The General Store"
- **MINING_NPC_NAME:** "General Store Manager"
- **STARTING_SALOON_NAME:** "The Last Stand Saloon"
- **SALOON_LOCAL_1_NAME:** "Bartender" (placeholder)
- **SALOON_LOCAL_2_NAME:** "Old Prospector" (placeholder)
- **MASTERY_BADGE_NAME:** "Mine Master"
- **CAPSTONE_ORE_NAME:** "Lone Star Mithril" (Bluebonnet Quartz is flavor text for this same ore, not a sixth ore)

## 2. High-Level Premise & Motivation
- **Premise:** Wild West Texas Ranger RPG with RuneScape-style skill progression and AI NPCs.
- **Motivation:** Create an entertaining and rewarding game that balances the thrill of interactive world progression with a classic Wild West theme.
- **Success Criteria:** Meaningful character journeys per user, defined as users completing greater than 80% of the full journey, progression arc, and plot line once defined.
- **v1.0 win condition:** Reach Mining Level 10 and earn the single Mine Master badge.

## 3. World Topology & Locations (v1.0)
Boomtown is one hub. The Saloon is where the player arrives and talks. The General Store in the Mining Quarter is the only shop. There is no Saloon shop and no rest action.

- **The Last Stand Saloon:** Onboarding and conversation. The player starts here with a Rusty Pickaxe already equipped. The Bartender and the Old Prospector are here.
- **Mining Quarter:** The General Store and the entrance to the Mine. The General Store Manager is here.
- **The Mine (10 levels):** A vertical mine. Deeper floors cost more stamina and put more weight on higher ores. Lower ores stay in the drop table, so a deep floor is not a pure high-tier faucet.

Locations are a closed set: `saloon`, `mining_quarter`, `mine_1` … `mine_10`. Floor entry is gated by Mining Level only. Which ore can drop is gated separately by Mining Level and pickaxe tier.

## 4. Player Stats & Movement (v1.0)
- **Mining Level (1–10):** Opens floors and, with the right pickaxe, puts new ores into the drop roll. Total XP thresholds are in `SCHEMA.md`.
- **Experience (XP):** Awarded for the ore actually received, not for the floor.
- **Hit Points:** Shown in the sidebar. Nothing in v1.0 changes HP. It stays at max.
- **Stamina (max 100):** Spent by mining and by running.
- **Gold:** Starts at 50.
- **Movement:** `walk` or `run`. Idle (standing still) uses the walk regen rule.
- **Stamina over time, everywhere including the mine:**
  - Walking or idle: restore 2 stamina per second, up to max.
  - Running: spend 4 stamina per second, and do not restore. At 0, the player drops back to walk.
- **Clothing:** One equipped clothing slot. Bonuses are a stamina-cost reduction up to 30% and an extra-ore chance up to 25%. Clothing never gates a floor or an ore.

## 5. Mining Loop & Ore Progression (v1.0)
**Loop:** Enter a floor you have unlocked → swing → receive a random eligible ore → keep it or sell it at the General Store → buy a better pickaxe or clothing → deeper floors and new ores open → hit Mining Level 10 and earn the Mine Master badge. The player can talk to NPCs outside of trades.

**Five ores.** A swing rolls one ore from that floor's weights. Any ore the player has not unlocked is removed and the remaining weights fill the roll. A swing the inventory cannot hold spends nothing and awards nothing.

| Ore | Unlocks at | Pickaxe | XP |
| :--- | :--- | :--- | ---: |
| Red Dirt Copper | Mining 1 | Rusty (tier 1) | 10 |
| Pecos Iron | Mining 3 | Iron (tier 2) | 20 |
| Brazos Silver | Mining 5 | Steel (tier 3) | 35 |
| Alamo Gold | Mining 7 | Reinforced (tier 4) | 55 |
| Lone Star Mithril | Mining 9 | Masterwork (tier 5) | 80 |

**Floors.** From floor 5 upward, older ores stay in the mix. Copper and iron still drop on the deepest floors. The new ore becomes the most common single drop on the lower floor of its band. It is never the whole table. Weights below are the full table once every listed ore is unlocked. Stamina is the cost of the swing before clothing.

| Floor | Enter at | Copper | Iron | Silver | Gold | Mithril | Stamina |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1–2 | Mining 1 | 100 | — | — | — | — | 5 |
| 3 | Mining 2 | 80 | 20 | — | — | — | 8 |
| 4 | Mining 3 | 60 | 40 | — | — | — | 8 |
| 5 | Mining 4 | 40 | 40 | 20 | — | — | 12 |
| 6 | Mining 5 | 25 | 35 | 40 | — | — | 12 |
| 7 | Mining 6 | 20 | 25 | 30 | 25 | — | 16 |
| 8 | Mining 7 | 15 | 20 | 25 | 40 | — | 16 |
| 9 | Mining 8 | 12 | 15 | 20 | 28 | 25 | 20 |
| 10 | Mining 9 | 10 | 12 | 18 | 25 | 35 | 20 |

Example: floor 3 can be entered at Mining 2, and until Mining 3 with an Iron Pickaxe the roll is 100% copper. At Mining 3 with that pickaxe, the 80/20 spread turns on.

Pickaxe tier is read from the equipped item in the catalog. The player row stores the item id only.

## 6. Inventory, Gear & the General Store (v1.0)
- **Inventory:** 28 slots (4×7). Ores stack, one slot per ore, up to 9,999. Pickaxes and clothing do not stack. A player holds at most one of each gear catalog row. The mastery badge is not an item.
- **Starter gear:** Rusty Pickaxe, already equipped. No clothing. No badge.
- **Store sells:** the five pickaxes and the clothing in `SCHEMA.md`. Buy quantity is 1.
- **Store buys:** ores only, including a whole stack in one quote.
- **Quotes:** The quote names the quantity, the unit price, and the total, and lasts 60 seconds. Executing it trades exactly that quantity at the stored price.
- **Price band:** Unit price stays inside 70–130% of the ore or item base value. A higher rapport with the General Store Manager is a better price for the player: the store pays more for ore and charges less for gear. v1.0 mock pricing is the straight rapport line in `SCHEMA.md`. The Replit service may let the model propose the price from rapport and Mining Level, and the server still clamps that proposal to the band and stores the clamped quote.
- **Clothing bonuses** apply to the next swing: stamina cost is reduced by the item's percent (cap 30, round the spent stamina up, minimum 1), and the yield percent (cap 25) is the chance of one extra of the same ore.

## 7. Mastery Badge (v1.0)
There is one badge. It is earned the moment Mining Level becomes 10, and it shows mastery of Mining. The Saloon does not hand out a starter badge. The sidebar slot stays empty until then. There is no badge collection and nothing to equip.

## 8. NPCs, Dialogue & Rapport (v1.0)
Three NPCs:

| Id | Name | Where | Role |
| :--- | :--- | :--- | :--- |
| `store_manager` | General Store Manager | Mining Quarter | Buys ore, sells gear |
| `saloon_bartender` | Bartender | Saloon | Lore, rumors, mining hints |
| `saloon_prospector` | Old Prospector | Saloon | Lore, rumors, mining hints |

The player talks only to an NPC who is in the current location. Each NPC has their own rapport, starting at 50. Sending a message does not add rapport by itself. The model reads the new line and the recent conversation and suggests a change. The server clamps that suggestion to −5…+5 and clamps the stored score to 0…100.

- Polite or on-topic: +1
- Notably kind or helpful: +2 or +3
- Neutral, or the same compliment repeated: 0
- Rude: −1 to −3
- Yelling, insults, or threats: −3 to −5

Only the General Store Manager's rapport affects prices. The other meters are still shown. Townspeople stay inside the v1.0 world: no bounties, horses, monsters, combat, or other backlog features. The mock may use a keyword stand-in so the meter moves in the UI. The Replit model is what actually judges the line.

## 9. Version-Gated Backlog (Out of Scope for v1.0)
Features below must not be built until promoted into the active spec.

| Target Version | Feature / Epic | Scope Summary | Promotion Gate (Before Building) |
| :--- | :--- | :--- | :--- |
| **v1.1** | **Eval & Guardrail Hardening** | Offline golden set + LLM-as-a-Judge (`EVALS.md`), hard price floor/ceiling enforcement, rapport-delta checks, and zero-hallucination lore checks. | v1.0 playable end-to-end across Lovable UI + Replit backend. |
| **v2.0** | **Ore Bounty Giver & Quests** | Ore-focused bounty NPC and multi-step quests to earn skill experience and gold. | v1.1 eval suite passes at >= 95% across store pricing, rapport, and lore grounding. |
| **v2.1** | **Horseback Riding Skill** | Wild horse progression loop: feeding horses in the wild, befriending them, taming them, riding for experience across difficulty tiers. | v2.0 quest state schema and bounty contracts verified in Supabase. |
| **v3.0** | **Monsters, Combat & Map Expansion** | Mine enemies, roaming monsters, combat, additional skills, and new regions. HP can change only after this version. | Multi-skill progression validated (>80% full journey completion). |
