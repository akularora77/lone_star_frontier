# Lone Star Frontier - Style Guide (v1.0)

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
- **StatsPanel:** HP, Stamina, Mining Level, XP progress to the next level. HP stays full in v1.0. There is no walk/run toggle. At Mining Level 10 the XP bar reads full.
- **InventoryGrid:** 4×7 (28) slots. Ores, pickaxes, and clothing. Stack counts on ores.
- **BadgeGoldBar:** Gold balance, and the Mine Master badge once `mastery_badge_earned` is true. The slot is empty before that. Sell-all for the selected ore stack starts here and confirms in the quote panel.

### B. WorldViewport (center)
- **LocationNav:** Saloon, General Store, mine entrance, and floors 1–10. Choosing one starts the same walk as a click in the world. It does not cut the camera there. A locked floor shows `Requires Mining Level {n}.` and the walk does not start.
- **SaloonScene**, **MiningQuarterScene**, **MineLevelScene** (one mine scene, parameterized by floor).
- **Viewpoint (v1.0):** The character paths. Click the ground, a person, a door, or the rock, and the character walks there. The camera follows from behind and above. It does not orbit or look with the mouse.
  - **Boomtown is one connected path.** The Saloon, the path between them, the General Store, and the mine entrance are the same walkable place. Click a local or the store manager and the character walks into reach, then the dialogue HUD opens. Click the mine entrance and the character walks to it, then steps into floor 1 when Mining Level allows.
  - **Mine floors:** Each floor is a chamber with the one current rock and a way up and a way down. Click the rock and the character walks to it, then the swing plays for that ore's `swing_seconds`. The walk costs no stamina. Clicks during the swing do nothing. The rock is replaced only when the swing ends. Clicking down walks to the next floor when it is unlocked. Clicking up on floor 1 walks back out to the mine entrance.
  - **Not in this pass:** mouse-look, orbit, or zoom; a run control; any town besides Boomtown; more than one rock in a chamber; custom models. A capsule character, a plain path, box buildings, and the existing ore shapes are enough.
- On a floor, **MineLevelScene** shows the one rock currently up, with its name, stamina cost, and swing time, before the swing. Each ore in the floor's mix that the player has not unlocked shows `{Ore} unlocks at Mining Level {n} with a {pickaxe}.` Copy is built from `list_mine_levels`. It is not written by an NPC.

### C. DialogueHud (bottom)
- **Portrait** of the NPC.
- **Rapport meter** for that NPC, 0–100. The formula stays hidden. The meter updates from `talk_to_npc`'s returned score.
- **ScrollText** for the reply.
- **ActionButtons:** Talk. Trade when the open NPC is the General Store Manager. Sell all when an ore stack is selected.
- **QuotePanel:** Unit price, quantity, total, and the time left on the 60-second quote. Confirm calls `execute_trade`. The panel can be dismissed. Expiry is enforced by the service.

## 3. Asset Placeholders (v1.0)
CSS shapes or generic icons:
- **Ores:** Colored circles/gems by tier (copper, iron, silver, gold, mithril).
- **Pickaxes and clothing:** Simple silhouettes.
- **Mine Master badge:** One star-shaped SVG, shown only after it is earned.
- **Portraits:** Placeholder frames keyed by `portrait_store_manager`, `portrait_bartender`, `portrait_prospector`.

## 4. UI Feedback & Animations
- **Mining:** The swing animation fills that ore's `swing_seconds`. The rock stays put until the animation ends.
- **XP gain:** Floating text (for example `+10 XP`) that fades upward. Show `+20 XP` when a bonus ore also dropped, matching `xp_gained`.
- **Stamina:** The bar updates from `tick`. There is no run toggle.
- **Rapport:** The meter steps by the returned delta. A downward step is visible when the player is hostile.

## 5. Component Home
All of the above lives under `src/`. Suggested split: `Sidebar` (`StatsPanel`, `InventoryGrid`, `BadgeGoldBar`), `WorldViewport` (`LocationNav`, `SaloonScene`, `MiningQuarterScene`, `MineLevelScene`), `DialogueHud` (`Portrait`, `ScrollText`, `ActionButtons`, `QuotePanel`). Design tokens live in `src/styles.css`.
