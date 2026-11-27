# Lone Star Frontier - Style Guide (v2.0)

## 1. Visual Aesthetic: "Modern Parchment"
Blend the weathered feel of the 1870s American West with the clarity of a modern RPG. The hex values below are the source of truth. CSS may store oklch tokens when they are conversions of these hex values.

### Color Palette
- **Primary Background:** `#F4EBD0` (Weathered Paper/Parchment)
- **Primary Accent:** `#8B4513` (Saddle Brown)
- **Secondary Accent:** `#D4AF37` (Dusty Gold)
- **Text (Body):** `#2F2F2F` (Charcoal / Faded Ink)
- **UI Borders:** `#5D4037` (Dark Wood / Iron)
- **Stamina Bar:** `#2E7D32` (Forest Green) → `#C62828` (Deep Red) when low
- **XP Bar:** `#1565C0` (Sky Blue)

### Typography
Loaded from the root head, which lives under `src/` so the frontend boundary still holds. Page title: **Lone Star Frontier**.
- **Headers:** Playfair Display. Bold, rugged, readable.
- **Body/UI:** Crimson Text. High legibility for lore and stats.

## 2. Screen
One game screen. Locations are state, not routes. Layout is three regions:

### A. Sidebar (right, fixed)
- **StatsPanel:** HP, Stamina, Mining Level, XP progress to the next level. HP falls when the Rattler hits and returns to 100 after a knockout. There is no walk/run toggle. At Mining Level 10 the XP bar reads full.
- **InventoryGrid:** `inventory_capacity` slots (14). Ores, pickaxes, and clothing. Each ore is one slot, with no stack count. The character wears the shirt, trousers, and hat from `equipped_outfit`.
- **BadgeGoldBar:** Gold balance, and the Mine Master badge once `mastery_badge_earned` is true. The slot is empty before that. Sell-all for the selected ore sells every row of that ore and confirms in the quote panel.

### B. WorldViewport (center)
- **LocationNav:** Saloon, General Store, mine entrance, and floors 1–10. Choosing one starts the same walk as a click in the world. It does not cut the camera there. A locked floor shows `Requires Mining Level {n}.` and the walk does not start.
- **SaloonScene**, **MiningQuarterScene**, **MineLevelScene** (one mine scene, parameterized by floor).
- **Viewpoint (v2.0):** The character paths. Click the ground, a person, a door, or a rock, and the character walks there. The view is 2D, seen from above. This is the client Replit integrates. Do not build the 3D follow view in this pass. That is v2.1, on this same `GameService`.
  - **Boomtown is one connected path.** The Saloon, the path between them, the General Store, and the mine entrance are the same walkable place. Click a local or the store manager and the character walks into reach, then the dialogue HUD opens. Click the mine entrance and the character walks to it, then steps into floor 1 when Mining Level allows.
  - **Mine floors:** The whole 20 by 14 chamber in `SCHEMA.md` is on screen, drawn from above. Rocks sit on their tiles. Every floor draws its Rattlers. The reach is not drawn. A hit plays a short lunge from `strike_sequence`. The client walks one tile at a time, calls `set_position` for each tile, and waits 400ms between tiles. Click a living rock and the character walks to a neighboring tile, then swings for that ore's `swing_seconds`. The walk costs no stamina. Another mine click during the swing does nothing. A hit does not stop the swing. Clicking a tile to walk does: the swing grants nothing, and the character leaves. The client keeps that rock selected only until the player walks away, the rock breaks, or a knockout sends them to the mine entrance. The spot shows no progress bar and no swing count. When the last swing's time has passed, the spot becomes bare ground until the respawn time ends. No name and no countdown. Clicking down walks to the next floor when it is unlocked. Clicking up on floor 1 walks back out to the mine entrance.
  - **Not in this pass:** the 3D camera, mouse-look, orbit, or zoom; a run control; any town besides Boomtown; custom models; attacking the Rattler. The 2D client uses the screen in this guide and the CSS shapes in section 3.
- On a floor, **MineLevelScene** shows the spots from the snapshot. A living rock shows its name, stamina cost, and swing time. An empty spot is bare ground and cannot be mined. Each ore in the floor's mix that the player has not unlocked shows `{Ore} unlocks at Mining Level {n} with a {pickaxe}.` Copy is built from `list_mine_levels`. It is not written by an NPC.

### C. DialogueHud (bottom)
- **Portrait** of the NPC.
- **Rapport meter** for that NPC, 0–100. The formula stays hidden. The meter updates from `talk_to_npc`'s returned score.
- **ScrollText** for the reply.
- **ActionButtons:** Talk. Trade when the open NPC is the General Store Manager. Sell all when an ore is selected. That sells every row of that ore.
- **QuotePanel:** Unit price, quantity, total, and the time left on the 60-second quote. Confirm calls `execute_trade`. The panel can be dismissed. Expiry is enforced by the service.

## 3. Asset Placeholders (v2.0)
CSS shapes or generic icons:
- **Ores:** Colored circles/gems by tier (copper, iron, silver, gold, mithril).
- **Rattlers:** One figure, used for every one of them, distinct from the player and from the rocks. No reach circle. A hit lunges toward the player and recoils.
- **Pickaxes and clothing:** Simple silhouettes.
- **Mine Master badge:** One star-shaped SVG, shown only after it is earned.
- **Portraits:** Placeholder frames keyed by `portrait_store_manager`, `portrait_bartender`, `portrait_prospector`.

## 4. UI Feedback & Animations
- **Mining:** Each swing lasts that ore's `swing_seconds`. The rock shakes and stays until the breaking swing's time has passed. No progress bar and no swing count. Then the spot is bare ground until it returns.
- **XP gain:** Floating text (for example `+10 XP`) that fades upward. Show `+20 XP` when a bonus ore also dropped, matching `xp_gained`.
- **Stamina:** The bar updates from `tick`. There is no run toggle.
- **HP:** The bar updates from `tick`. A knockout returns the character to the mine entrance and refills the bar.
- **Rapport:** The meter steps by the returned delta. A downward step is visible when the player is hostile.

## 5. Component Home
All of the above lives under `src/`. Suggested split: `Sidebar` (`StatsPanel`, `InventoryGrid`, `BadgeGoldBar`), `WorldViewport` (`LocationNav`, `SaloonScene`, `MiningQuarterScene`, `MineLevelScene`), `DialogueHud` (`Portrait`, `ScrollText`, `ActionButtons`, `QuotePanel`). Design tokens live in `src/styles.css`.
