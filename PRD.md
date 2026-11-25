# Lone Star Frontier - Product Requirements Document (Living Spec)

## Recent changes
Lovable: apply this section to the prototype first. It is the only list of what just changed. The changelog below is history.

**2026-11-24**
- **Rocks take repeated swings, then stay empty.** A rock does not grant ore on the first click and does not come back when the swing ends. Swings to break it start at 3 copper, 4 iron, 5 silver, 6 gold, 8 mithril, and drop by 1 for each Mining Level above the ore's requirement and each pickaxe tier above its minimum, to a minimum of 1. After it breaks, that spot stays empty for 10s, 15s, 20s, 30s, or 45s. Each floor has 3 spots. See **4a** and **4b**.
- **Remove running.** No walk/run toggle and no stamina drain while standing. Stamina restores at 2 per second while standing, talking, or walking. See section 3, **Stamina**.
- **A swing takes time.** Copper 2s, iron 2.5s, silver 3s, gold 3.5s, mithril 4s. Another click during the swing does nothing. The next rock appears only when the swing ends. See **4a** and **4b**.
- **The character paths.** Boomtown is one walkable path connecting the Saloon, the General Store, and the mine entrance. Click ground, a person, or the rock and the character walks there. The camera follows. Each mine floor is a chamber: walk to the rock to swing, walk down for the next floor, walk up on floor 1 to leave. No mouse-look, no run, no second town. See `STYLE_GUIDE.md`, **Viewpoint (v1.0)**.

## Document Control & Changelog
- **Active Version:** v1.0 (Core Mining Loop & Boomtown Hub)
- **Previous Versions:** None
- **Changelog:**
  - **v1.0:** Initial v1 scope—Boomtown hub, 10-level Mine, 5-tier ore ladder, 4 player stats, progressive Ranger Badges, dynamic LLM store pricing, and lore-grounded townspeople.
  - **v1.0 (amended):** Mixed ore drops per floor, ore unlocks separate from floor entry, one Mine Level 10 Badge, semantic rapport, and stamina regen while walking or idle. Seed numbers for these rules live in `SCHEMA.md`.
  - **v1.0 (amended):** Stamina comes from the ore and the pickaxe. Each Mining Level takes more swings of the best available ore than the level before it. Price is a rapport formula. Hit points do not change in v1.0.
  - **v1.0 (amended):** No running in v1.0. A swing takes the ore's duration, and the next rock appears only when that swing ends.
  - **v1.0 (amended):** Breaking a rock takes several swings, fewer with a higher Mining Level or a better pickaxe. A broken spot stays empty until its respawn timer.

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
- **Hit Points (HP) / Health:** Core character vitality stat. Shown in the sidebar. It does not change in v1.0.
- **Stamina:** There is no running in v1.0. The map is small enough that walking covers it. Standing still, talking, and walking restore stamina at 2 per second, everywhere including the mine. A swing spends that ore's stamina once.

## 4. Core Gameplay Loop & Progression (v1.0)
- **Gameplay Loop:** Mine ore across levels 1–10 -> Gather ore in inventory -> Keep ore or sell ore to the General Store NPC for gold -> Buy upgraded pickaxes and clothing -> Unlock deeper mine levels and earn the Mine Level 10 Badge. Players can also separately interact and converse with NPCs outside of transactions.
- **Skill (1 total in v1.0):** **Mining** — custom Wild West themed ore progression ladder modeled on RuneScape across 10 mine levels:
  - Different ores yield varying experience (XP) and gold values.
  - **4a. Ores:** Five ores. A higher Mining Level and the matching pickaxe unlock the next ore. Stamina and XP come from the ore and the pickaxe, not from the floor. Lone Star Mithril is one ore; Bluebonnet Quartz is another name for it.
    - Red Dirt Copper — Mining 1, Rusty Pickaxe, 10 XP, 6 stamina, 2 second swing, 3 swings to break, 10 second respawn
    - Pecos Iron — Mining 3, Iron Pickaxe, 24 XP, 8 stamina, 2.5 second swing, 4 swings to break, 15 second respawn
    - Brazos Silver — Mining 5, Steel Pickaxe, 45 XP, 10 stamina, 3 second swing, 5 swings to break, 20 second respawn
    - Alamo Gold — Mining 7, Reinforced Pickaxe, 80 XP, 12 stamina, 3.5 second swing, 6 swings to break, 30 second respawn
    - Lone Star Mithril — Mining 9, Masterwork Pickaxe, 140 XP, 14 stamina, 4 second swing, 8 swings to break, 45 second respawn
  - The swing counts above are for a player at that ore's Mining Level with its minimum pickaxe. Each Mining Level above that requirement, and each pickaxe tier above that minimum, removes 1 swing. The count never goes below 1. Iron at Mining 3 with an Iron Pickaxe takes 4 swings. Iron at Mining 5 with an Iron Pickaxe takes 2. A better pickaxe removes swings the same way. The ore and XP are granted only on the swing that breaks the rock.
  - **4b. Floors:** Each floor has 3 rock spots. A living spot shows one ore, chosen from that floor's weights. The player sees the ore, the swings still left, and the stamina cost. Each swing lasts that ore's duration, and another click during a swing does nothing. When the last swing lands, the spot goes empty. It does not start refreshing during the swings, and it does not come back when the animation ends. It stays empty for that ore's respawn time, then rolls a new ore. Ores the player has not unlocked are left out of the roll. From floor 5 up, older ores stay in the mix.
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
  - **Clothing:** Provides mining bonuses/benefits (such as stamina preservation or yield bonuses), but is **not** a hard access requirement to enter deeper mine levels.
- **Win Condition / Progression Arc:** Earning the **Mine Level 10 Badge** at Mining Level 10.

## 5. AI NPCs & Characters (v1.0)
- **General Store Manager:** Buys player ores and sells pickaxes and clothing. The player talks to him only while standing in the Mining Quarter. Price comes from rapport with him, not from Mining Level: selling pays `round(base × (0.7 + 0.6 × rapport / 100))`, and buying charges `round(base × (1.3 − 0.6 × rapport / 100))`, clamped to 70–130% of the base value. Rapport starts at 50 with each NPC. A hostile line lowers it, a polite line raises it, and a neutral line can leave it unchanged. The model suggests the change from what the player said, and the server keeps each change inside −5…+5.
- **Townspeople / Saloon Locals:** Pure dialogue, world lore, rumors, and mining hints (such as mine level yields and tips), strictly grounded in the v1.0 game world without referencing unimplemented features. The player talks to them only while standing in the Saloon.

## 6. Version-Gated Backlog & Future Roadmap (Out of Scope for v1.0)
Features below are strictly out of scope for v1.0 and must not be built until promoted into the active spec after clearing their Promotion Gate:

| Target Version | Feature / Epic | Scope Summary | Promotion Gate (Before Building) |
| :--- | :--- | :--- | :--- |
| **v1.1** | **Eval & Guardrail Hardening** | Offline golden set + LLM-as-a-Judge (`EVALS.md`), hard price floor/ceiling enforcement, and zero-hallucination lore checks. | v1.0 playable end-to-end across Lovable UI + Replit backend. |
| **v2.0** | **Ore Bounty Giver & Quests** | Ore-focused bounty NPC and multi-step quests to earn skill experience and gold. | v1.1 eval suite passes at >= 95% across store pricing & lore grounding. |
| **v2.1** | **Horseback Riding Skill** | Wild horse progression loop: feeding horses in the wild -> becoming friends -> taming them to ride -> riding for experience across horse difficulty tiers. | v2.0 quest state schema and bounty contracts verified in Supabase. |
| **v3.0** | **Monsters, Combat & Map Expansion** | Mine enemies, roaming low-level monsters that attack the player, combat mechanics, additional skills, deeper skill trees, and new cities/map regions. | Multi-skill progression validated (>80% full journey completion). |
