# Lone Star Frontier - Product Requirements Document (Living Spec)

## Document Control & Changelog
- **Active Version:** v1.0 (Core Mining Loop & Boomtown Hub)
- **Previous Versions:** None
- **Changelog:**
  - **v1.0:** Initial v1 scope—Boomtown hub, 10-level Mine, 5-tier ore ladder, 4 player stats, progressive Ranger Badges, dynamic LLM store pricing, and lore-grounded townspeople.

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
  - **Onboarding District / Saloon:** Where the character onboards, receives their initial Ranger badge and starter pickaxe, and talks to various townspeople to learn about the basic world.
  - **Mining Quarter:** Contains the General Store and the entrance to the Mine, keeping all NPCs relevant throughout the entire game.
- **The Mine (10 Levels):** A vertical 10-level mine where users mine ores. Deeper levels unlock higher-tier ores, yield higher experience, and require upgraded pickaxes.

## 3. Player Stats & Movement Mechanics (v1.0)
- **Mining Level:** Determines which mine levels and ores are unlocked.
- **Experience (XP):** Earned by mining ores; drives Mining Level progression.
- **Hit Points (HP) / Health:** Core character vitality stat.
- **Stamina:** Players can toggle between **Walking** and **Running**; running drains stamina.

## 4. Core Gameplay Loop & Progression (v1.0)
- **Gameplay Loop:** Mine ore across levels 1–10 -> Gather ore in inventory -> Keep ore or sell ore to the General Store NPC for gold -> Buy upgraded pickaxes and clothing -> Unlock deeper mine levels and earn badges. Players can also separately interact and converse with NPCs outside of transactions.
- **Skill (1 total in v1.0):** **Mining** — custom Wild West themed ore progression ladder modeled on RuneScape across 10 mine levels:
  - Different ores yield varying experience (XP) and gold values.
  - Higher-tier ores and deeper mine levels unlock at higher Mining Levels and require higher-tier pickaxes.
  - 5-tier Wild West ore ladder across the 10 mine levels:
    - Levels 1–2: Red Dirt Copper (Rusty Pickaxe)
    - Levels 3–4: Pecos Iron (Iron Pickaxe)
    - Levels 5–6: Brazos Silver (Steel Pickaxe)
    - Levels 7–8: Alamo Gold (Reinforced Pickaxe)
    - Levels 9–10: Lone Star Mithril / Bluebonnet Quartz (Masterwork Pickaxe)
- **General Store Items:**
  - **Pickaxes:** Tiered pickaxe progression required to mine higher-tier ores and access deeper mine levels.
  - **Clothing:** Provides mining bonuses/benefits (such as stamina preservation or yield bonuses), but is **not** a hard access requirement to enter deeper mine levels.
- **Win Condition / Progression Arc:** Earning progressive **Ranger Badges** culminating in the final **Mine Level 10 Badge**.

## 5. AI NPCs & Characters (v1.0)
- **General Store Manager:** Buys player ores and sells pickaxes and clothing. Uses context-aware dynamic pricing decided by the LLM based on context such as player Mining Level and how much the player chats/builds rapport with NPCs prior to trading.
- **Townspeople / Saloon Locals:** Pure dialogue, world lore, rumors, and mining hints (such as mine level yields and tips), strictly grounded in the v1.0 game world without referencing unimplemented features.

## 6. Version-Gated Backlog & Future Roadmap (Out of Scope for v1.0)
Features below are strictly out of scope for v1.0 and must not be built until promoted into the active spec after clearing their Promotion Gate:

| Target Version | Feature / Epic | Scope Summary | Promotion Gate (Before Building) |
| :--- | :--- | :--- | :--- |
| **v1.1** | **Eval & Guardrail Hardening** | Offline golden set + LLM-as-a-Judge (`EVALS.md`), hard price floor/ceiling enforcement, and zero-hallucination lore checks. | v1.0 playable end-to-end across Lovable UI + Replit backend. |
| **v2.0** | **Ore Bounty Giver & Quests** | Ore-focused bounty NPC and multi-step quests to earn skill experience and gold. | v1.1 eval suite passes at >= 95% across store pricing & lore grounding. |
| **v2.1** | **Horseback Riding Skill** | Wild horse progression loop: feeding horses in the wild -> becoming friends -> taming them to ride -> riding for experience across horse difficulty tiers. | v2.0 quest state schema and bounty contracts verified in Supabase. |
| **v3.0** | **Monsters, Combat & Map Expansion** | Mine enemies, roaming low-level monsters that attack the player, combat mechanics, additional skills, deeper skill trees, and new cities/map regions. | Multi-skill progression validated (>80% full journey completion). |
