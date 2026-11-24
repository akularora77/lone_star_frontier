# Lone Star Frontier - Product Requirements Document (Living Spec)

## Document Control & Changelog
- **Active Version:** v1.0 (Core Mining Loop & Boomtown Hub)
- **Previous Versions:** None
- **Changelog:**
  - **v1.0:** Initial v1 scope—Boomtown hub, 10-level Mine, 5-tier ore ladder, 4 player stats, progressive Ranger Badges, dynamic LLM store pricing, and lore-grounded townspeople.
  - **v1.0 (amended):** Mixed ore drops per floor, ore unlocks separate from floor entry, one Mine Level 10 Badge, semantic rapport, and stamina regen while walking or idle. Seed numbers for these rules live in `SCHEMA.md`.

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

## 2. World Topology & Locations (v1.0)
- **Boomtown (Unified Hub):** Collapses the onboarding and town hubs into 1 unified Boomtown containing:
  - **Onboarding District / Saloon:** Where the character onboards, receives their starter pickaxe, and talks to various townspeople to learn about the basic world.
  - **Mining Quarter:** Contains the General Store and the entrance to the Mine, keeping all NPCs relevant throughout the entire game.
- **The Mine (10 Levels):** A vertical 10-level mine where users mine ores. Deeper levels open at higher Mining Levels and lean toward higher-tier ores, while common ores still drop. Upgraded pickaxes unlock those ores rather than the floor itself.

## 3. Player Stats & Movement Mechanics (v1.0)
- **Mining Level:** Determines which mine levels and ores are unlocked.
- **Experience (XP):** Earned by mining ores; drives Mining Level progression.
- **Hit Points (HP) / Health:** Core character vitality stat.
- **Stamina:** Players can toggle between **Walking** and **Running**; running drains stamina at 4 per second. Walking or sitting idle restores stamina at 2 per second, everywhere including the mine.

## 4. Core Gameplay Loop & Progression (v1.0)
- **Gameplay Loop:** Mine ore across levels 1–10 -> Gather ore in inventory -> Keep ore or sell ore to the General Store NPC for gold -> Buy upgraded pickaxes and clothing -> Unlock deeper mine levels and earn the Mine Level 10 Badge. Players can also separately interact and converse with NPCs outside of transactions.
- **Skill (1 total in v1.0):** **Mining** — custom Wild West themed ore progression ladder modeled on RuneScape across 10 mine levels:
  - Different ores yield varying experience (XP) and gold values.
  - **4a. Ores:** Five ores. A higher Mining Level and the matching pickaxe unlock the next ore. Lone Star Mithril is one ore; Bluebonnet Quartz is another name for it.
    - Red Dirt Copper — Mining 1, Rusty Pickaxe, 10 XP
    - Pecos Iron — Mining 3, Iron Pickaxe, 20 XP
    - Brazos Silver — Mining 5, Steel Pickaxe, 35 XP
    - Alamo Gold — Mining 7, Reinforced Pickaxe, 55 XP
    - Lone Star Mithril — Mining 9, Masterwork Pickaxe, 80 XP
  - **4b. Floors:** A swing rolls one ore from that floor's weights. Ores the player has not unlocked are left out, and the remaining weights fill the roll. From floor 5 up, older ores stay in the mix.
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
  - **4c. XP:** XP is the XP of the ore received. Mining Level is the highest level whose total XP the player has reached.
    | Mining Level | Total XP |
    | :--- | ---: |
    | 1 | 0 |
    | 2 | 80 |
    | 3 | 200 |
    | 4 | 400 |
    | 5 | 700 |
    | 6 | 1,100 |
    | 7 | 1,600 |
    | 8 | 2,300 |
    | 9 | 3,200 |
    | 10 | 4,400 |
- **General Store Items:**
  - **Pickaxes:** Tiered pickaxe progression required to mine higher-tier ores.
  - **Clothing:** Provides mining bonuses/benefits (such as stamina preservation or yield bonuses), but is **not** a hard access requirement to enter deeper mine levels.
- **Win Condition / Progression Arc:** Earning the **Mine Level 10 Badge** at Mining Level 10.

## 5. AI NPCs & Characters (v1.0)
- **General Store Manager:** Buys player ores and sells pickaxes and clothing. Uses context-aware dynamic pricing decided by the LLM based on context such as player Mining Level and rapport with the General Store Manager. Rapport starts at 50 with each NPC and changes only when the LLM suggests a delta from what the player said; it can go down.
- **Townspeople / Saloon Locals:** Pure dialogue, world lore, rumors, and mining hints (such as mine level yields and tips), strictly grounded in the v1.0 game world without referencing unimplemented features.

## 6. Version-Gated Backlog & Future Roadmap (Out of Scope for v1.0)
Features below are strictly out of scope for v1.0 and must not be built until promoted into the active spec after clearing their Promotion Gate:

| Target Version | Feature / Epic | Scope Summary | Promotion Gate (Before Building) |
| :--- | :--- | :--- | :--- |
| **v1.1** | **Eval & Guardrail Hardening** | Offline golden set + LLM-as-a-Judge (`EVALS.md`), hard price floor/ceiling enforcement, and zero-hallucination lore checks. | v1.0 playable end-to-end across Lovable UI + Replit backend. |
| **v2.0** | **Ore Bounty Giver & Quests** | Ore-focused bounty NPC and multi-step quests to earn skill experience and gold. | v1.1 eval suite passes at >= 95% across store pricing & lore grounding. |
| **v2.1** | **Horseback Riding Skill** | Wild horse progression loop: feeding horses in the wild -> becoming friends -> taming them to ride -> riding for experience across horse difficulty tiers. | v2.0 quest state schema and bounty contracts verified in Supabase. |
| **v3.0** | **Monsters, Combat & Map Expansion** | Mine enemies, roaming low-level monsters that attack the player, combat mechanics, additional skills, deeper skill trees, and new cities/map regions. | Multi-skill progression validated (>80% full journey completion). |
