# Lone Star Frontier - Product Requirements Document (Living Spec)

## Recent changes
Lovable: apply this section to the prototype first. It is the only list of what just changed. The changelog below is history.

**2026-11-25 — v2.0, 2D**
Top-down only. 3D is v2.1. Tiles are in `SCHEMA.md`.

- Floor is 20×14. Way up `(1, 7)`. Way down `(18, 7)`, except floor 10.
- Floors 1–2: 8 rocks.
- Floors 3–4: 10 rocks. Floors 5–10: 8 rocks.
- Every rock rolls from that floor's ore weights.
- Every floor has Rattlers. One on floors 1–4, two on 5–8, three on 9–10. Tiles are rolled once. Each one then wanders one tile every 2.4 seconds, staying near ore and off rocks, ladders, and the player. Reach 3, not drawn. A hit is 5 + the floor number, every 1 second. The player cannot attack them. Overlapping reaches still hit once.
- A hit does not stop a swing. Walking to another tile does. That swing grants nothing. Stamina already spent stays spent.
- `set_position` is one tile and needs 400ms. `tick` applies hits.
- At 0 HP: cancel the swing, HP returns to 100, player goes to `mining_quarter`. Gold, level, and XP stay.
- Keep starter clothes and the 3 other rows with the highest `base_value`. Delete the rest. Unequip a deleted item.
- Ore does not stack. Capacity stays 14. A bonus ore needs its own free slot.

## Document Control & Changelog
- **Active Version:** v2.0 (Dangerous Mine, 2D)
- **Previous Versions:** v1.0
- **Changelog:**
  - **v2.0:** Position on each floor, denser rock layouts, Rattlers on every floor that get stronger and more numerous with depth, a swing the player can walk away from, knockout that keeps the 3 most valuable non-starter rows, and unstacked ore. The client stays 2D. 3D is v2.1.
  - **v1.0:** Initial v1 scope—Boomtown hub, 10-level Mine, 5-tier ore ladder, 4 player stats, progressive Ranger Badges, dynamic LLM store pricing, and lore-grounded townspeople.
  - **v1.0 (amended):** Mixed ore drops per floor, ore unlocks separate from floor entry, one Mine Level 10 Badge, semantic rapport, and stamina regen while walking or idle. Seed numbers for these rules live in `SCHEMA.md`.
  - **v1.0 (amended):** Stamina comes from the ore and the pickaxe. Each Mining Level takes more swings of the best available ore than the level before it. Price is a rapport formula. Hit points do not change in v1.0.
  - **v1.0 (amended):** No running in v1.0. A swing takes the ore's duration, and the next rock appears only when that swing ends.
  - **v1.0 (amended):** Breaking a rock takes several swings, fewer with a higher Mining Level or a better pickaxe. A broken spot stays empty until its respawn timer.
  - **v1.0 (amended):** The v1 client is 2D and top-down. A 3D follow view is a parallel prototype on the same GameService.
  - **v1.0 (amended):** The version after v1.0 improves the game. Eval and guardrail hardening comes after that version.
  - **v1.0 (amended):** Inventory is 14 slots. Clothing has shirt, trousers, and hat slots, with a free starter set. Bonus clothing wears in the shirt slot. Ore and XP land when the swing's time has passed.

## 1. Terminology & Variables (SSoT for Names)
To allow for easy rebranding, all entities use the following "Master Names" which should be centralized in the code:
- **HUB_CITY_NAME:** "Boomtown" (Placeholder - will change)
- **GENERAL_STORE_NAME:** "The General Store"
- **MINING_NPC_NAME:** "General Store Manager"
- **STARTING_SALOON_NAME:** "The Last Stand Saloon"

## 2. High-Level Premise & Motivation
- **Premise:** Wild West Texas Ranger RPG with RuneScape-style skill progression and AI NPCs.
- **Motivation:** Create an entertaining and rewarding game that balances the thrill of interactive world progression with a classic Wild West theme to appeal to the nostalgia of that era.
- **Success Criteria:** Meaningful character journeys per user, defined as users completing greater than 80% of the full journey, progression arc, and plot line once defined.

## 2. World Topology & Locations (v2.0)
- **Boomtown (Unified Hub):** Collapses the onboarding and town hubs into 1 unified Boomtown containing:
  - **Onboarding District / Saloon:** Where the character onboards, receives their starter pickaxe and starter clothes, and talks to various townspeople to learn about the basic world.
  - **Mining Quarter:** Contains the General Store and the entrance to the Mine, keeping all NPCs relevant throughout the entire game.
- **The Mine (10 Levels):** A vertical 10-level mine where users mine ores. Deeper levels open at higher Mining Levels and lean toward higher-tier ores, while common ores still drop. Upgraded pickaxes unlock those ores rather than the floor itself. From floor 1, Rattlers stand in the chamber and attack anyone who walks into their reach. Deeper floors have more of them, and each hit hurts more.

## 3. Player Stats & Movement Mechanics (v2.0)
- **Mining Level:** Determines which mine levels and ores are unlocked.
- **Experience (XP):** Earned by mining ores; drives Mining Level progression. A knockout does not take XP away.
- **Hit Points (HP) / Health:** Shown in the sidebar. The player starts at 100. A Rattler's hit lowers it. There is no regen. At 0 the player is knocked out: HP returns to 100, the player is sent to the mine entrance, and the bag is reduced as in section 4. Town does not heal.
- **Position:** On a mine floor the server stores a tile. The walk still plays on the client. Each step is one tile and takes 400ms. Boomtown locations do not use tiles.
- **Stamina:** There is no running. Standing still, talking, and walking restore stamina at 2 per second, everywhere including the mine. A swing spends that ore's stamina once.

## 4. Core Gameplay Loop & Progression (v2.0)
- **Gameplay Loop:** Mine ore across levels 1–10, walking around the Rattler from floor 3 on -> Fill the 14 slots -> Sell ore to the General Store NPC for gold, or lose all but the 3 most valuable rows on a knockout -> Buy upgraded pickaxes and clothing -> Unlock deeper mine levels and earn the Mine Level 10 Badge. Players can also talk to NPCs outside of transactions.
- **Skill (1 total in v2.0):** **Mining** — custom Wild West themed ore progression ladder modeled on RuneScape across 10 mine levels:
  - Different ores yield varying experience (XP) and gold values.
  - **4a. Ores:** Five ores. A higher Mining Level and the matching pickaxe unlock the next ore. Stamina and XP come from the ore and the pickaxe, not from the floor. Lone Star Mithril is one ore; Bluebonnet Quartz is another name for it.
    - Red Dirt Copper — Mining 1, Rusty Pickaxe, 10 XP, 6 stamina, 2 second swing, 3 swings to break, 10 second respawn
    - Pecos Iron — Mining 3, Iron Pickaxe, 24 XP, 8 stamina, 2.5 second swing, 4 swings to break, 15 second respawn
    - Brazos Silver — Mining 5, Steel Pickaxe, 45 XP, 10 stamina, 3 second swing, 5 swings to break, 20 second respawn
    - Alamo Gold — Mining 7, Reinforced Pickaxe, 80 XP, 12 stamina, 3.5 second swing, 6 swings to break, 30 second respawn
    - Lone Star Mithril — Mining 9, Masterwork Pickaxe, 140 XP, 14 stamina, 4 second swing, 8 swings to break, 45 second respawn
  - The swing counts above are for a player at that ore's Mining Level with its minimum pickaxe. Each Mining Level above that requirement, and each pickaxe tier above that minimum, removes 1 swing. The count never goes below 1. Iron at Mining 3 with an Iron Pickaxe takes 4 swings. Iron at Mining 5 with an Iron Pickaxe takes 2. A better pickaxe removes swings the same way. The ore and XP are granted only for the swing that breaks the rock, and only once that swing's time has passed.
  - **4b. Floors:** A floor is a 20 by 14 chamber. Spot counts:

    | Floors | Spots | Rattlers |
    | :--- | ---: | ---: |
    | 1–4 | 8 on 1–2, 10 on 3–4 | 1 |
    | 5–8 | 8 | 2 |
    | 9–10 | 8 | 3 |

    Each living spot rolls one unlocked ore from that floor's weights. The player sees the ore and the stamina cost. Each swing lasts that ore's duration. Another mine click during a swing does nothing. A hit does not stop the swing. Walking to another tile does, and that swing grants nothing. The client keeps the rock selected until it breaks or the player walks away. When the last swing's time has passed, the spot goes empty for that ore's respawn time, then rolls again. An empty spot is bare ground. Tiles are in `SCHEMA.md`.
  - **4b2. Rattler:** Every floor has them. Tiles are rolled once when the floor is created. On `tick`, each Rattler steps one cardinal tile every 2.4 seconds. It will not step onto a rock, a ladder, another Rattler, the player, or a tile within 3 of the way up. It prefers a step within 3 of an ore, otherwise a step closer to ore. It cannot be attacked. The reach is not drawn. A hit is `5 + floor` HP every 1 second while the player is within 3 tiles of any of them. Two reaches at once still hit once. Leaving every reach stops the hits. At 0 HP the current swing grants nothing, starter clothes are kept, the 3 other rows with the highest catalog base value are kept, every other row is deleted, HP is set to 100, and the location becomes `mining_quarter`. Gold and XP do not change.
  - **Floor weights:**
    | Floor | Enter at | Copper | Iron | Silver | Gold | Mithril |
    | :--- | :--- | ---: | ---: | ---: | ---: | ---: |
    | 1–2 | Mining 1 | 100 | — | — | — | — |
    | 3 | Mining 3 | 70 | 30 | — | — | — |
    | 4 | Mining 3 | 55 | 45 | — | — | — |
    | 5 | Mining 5 | 25 | 35 | 40 | — | — |
    | 6 | Mining 5 | 15 | 25 | 60 | — | — |
    | 7 | Mining 7 | 12 | 15 | 28 | 45 | — |
    | 8 | Mining 7 | 10 | 12 | 18 | 60 | — |
    | 9 | Mining 9 | 8 | 8 | 12 | 27 | 45 |
    | 10 | Mining 9 | 5 | 8 | 10 | 22 | 55 |
  - **4c. XP:** XP is granted when a rock breaks, that ore's XP times how many you received. Swings before the breaking swing give no XP. Mining Level is the highest level whose total XP the player has reached. Each level asks for more rocks of the best ore you can mine than the level before it. A cheaper rock on a deep floor still pays that cheaper ore's XP.
    | Mining Level | Rocks of the best ore | Total XP |
    | :--- | :--- | ---: |
    | 1 | — | 0 |
    | 2 | 10 copper | 100 |
    | 3 | 15 copper | 250 |
    | 4 | 20 iron | 730 |
    | 5 | 25 iron | 1,330 |
    | 6 | 30 silver | 2,680 |
    | 7 | 35 silver | 4,255 |
    | 8 | 40 gold | 7,455 |
    | 9 | 45 gold | 11,055 |
    | 10 | 50 mithril | 18,055 |
- **General Store Items:**
  - **Pickaxes:** Tiered pickaxe progression required to mine higher-tier ores. A pickaxe above an ore's requirement lowers that ore's stamina cost by 2 per extra tier, to a minimum of 4 before clothing.
  - **Clothing:** Shirt, trousers, and hat are worn on the character. The starter set has no mining bonus and is not sold. Bonus clothing (stamina preservation or yield) wears in the shirt slot, one at a time, and is **not** a hard access requirement to enter deeper mine levels. Clicking a worn clothing row takes it off. A pickaxe can be swapped and cannot be taken off.
- **Win Condition / Progression Arc:** Earning the **Mine Level 10 Badge** at Mining Level 10.

## 5. AI NPCs & Characters (v2.0)
- **General Store Manager:** Buys player ores and sells pickaxes and clothing. The player talks to him only while standing in the Mining Quarter. Price comes from rapport with him, not from Mining Level: selling pays `round(base × (0.7 + 0.6 × rapport / 100))`, and buying charges `round(base × (1.3 − 0.6 × rapport / 100))`, clamped to 70–130% of the base value. Rapport starts at 50 with each NPC. A hostile line lowers it, a polite line raises it, and a neutral line can leave it unchanged. The model suggests the change from what the player said, and the server keeps each change inside −5…+5.
- **Townspeople / Saloon Locals:** Dialogue, world lore, rumors, and mining hints, including the Rattler on the deeper floors. They do not describe fighting one, and they do not mention bounties, horses, or other towns. The player talks to them only while standing in the Saloon.

## 6. Version-Gated Backlog & Future Roadmap (Out of Scope for v2.0)
v2.0 is the active version: the 2D mine above. Features below are not built until promoted into the active spec after clearing their Promotion Gate.

| Target Version | Feature / Epic | Scope Summary | Promotion Gate (Before Building) |
| :--- | :--- | :--- | :--- |
| **v2.1** | **3D follow view** | The same `GameService` and the same floors, seen from behind and above. No new rules, no mouse-look. | v2.0 playable end-to-end in the 2D client. |
| **v2.2** | **Eval & Guardrail Hardening** | Offline golden set + LLM-as-a-Judge (`EVALS.md`) against the v2.0 rules, hard price floor/ceiling enforcement, and lore checks. | v2.0 playable end-to-end. |
| **v3.0** | **Ore Bounty Giver & Quests** | Ore-focused bounty NPC and multi-step quests to earn skill experience and gold. | v2.2 eval suite passes at >= 95% across store pricing and lore grounding. |
| **v3.1** | **Horseback Riding Skill** | Wild horse progression loop: feeding horses in the wild, becoming friends, taming them to ride, and riding for experience across horse difficulty tiers. | v3.0 quest state schema and bounty contracts verified in Replit PostgreSQL. |
| **v4.0** | **Fighting Back & Map Expansion** | The player can attack, a combat skill, and new cities or map regions. The Rattler already attacks in v2.0. | Multi-skill progression validated (>80% full journey completion). |
