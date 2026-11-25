# Prototype drift — proposals for the root specs

Compared against GitHub `main` @ `b54b859`. Each entry is a rule the Lovable 2D prototype
follows that PRD.md / SCHEMA.md do not already state. These are proposals only: Replit builds
from the root specs, not from this file. Rules main already states are left out.

## 1. Inventory size
- Prototype: 14 slots. `get_player_state` also returns `inventory_capacity` so the client never assumes a size.
- Spec: `INVENTORY_SLOTS` 28; capacity is not returned by `get_player_state`.
- Constant: `INVENTORY_SLOTS`
- Literal: none (`src/game/constants.ts` defines it; everything else reads it)

## 2. Clothing slots
- Prototype: three nullable outfit slots, `equipped_outfit: { top, bottom, hat }`, drive what the character wears on both maps. Bonus clothing (bandana, vest, duster) still uses the single bonus slot `equipped_clothing_id` and fills the top slot.
- Spec: one clothing slot, `equipped_clothing_id`; no visual outfit slots.
- Constant: none
- Literal: none

## 3. Starter clothing
- Prototype: three tier-0, value-0, no-bonus catalog rows — `basic_top` (Basic Shirt), `basic_bottom` (Basic Trousers), `basic_hat` (Basic Hat). A new player owns and wears all three plus the Rusty Pickaxe (4 of 14 slots used). `list_store_items` never lists them and they cannot be bought.
- Spec: "a new player starts … with the Rusty Pickaxe … no clothing"; no starter clothing rows.
- Constant: none
- Literal: none (rows live in `src/game/seed.ts`)

## 4. Equip and unequip
- Prototype: clicking clothing in the inventory toggles it. New tool `unequip_item(player_id, item_id)` clears that outfit slot, and clears `equipped_clothing_id` when it held the bonus item, removing its modifiers. Pickaxes can be equipped but not unequipped. `equip_item` on clothing fills its outfit slot.
- Spec: only `equip_item`, which sets `current_pickaxe_id` or `equipped_clothing_id`; no way to remove clothing.
- Constant: none
- Literal: none

## 5. Rocks per floor
- Prototype: 3 spots per floor, same as main. The spot payload adds `name`, `swings_left`, `stamina_cost`, `swing_seconds`, `unlocked`, `progress` and `progress_target` (0–1 whole-rock progress, including the swing in flight). Empty spots render as bare ground with no label or countdown.
- Spec: `ROCKS_PER_FLOOR` 3; spot = index, ore or empty, swings done, swings needed, `respawn_at`.
- Constant: `ROCKS_PER_FLOOR`
- Literal: `src/components/game/map/MineMap.tsx` (`ROCKS` array holds exactly 3 fixed positions) and `src/game/mockService.ts` (error text "Choose a rock spot from 1 to 3.")

## 6. Swing timer
- Prototype: `mine_ore` starts a swing and spends stamina. Ore, XP, level-ups, the badge and the spot's `respawn_at` are granted only once `swing_seconds` has elapsed, seen on the next read. The client polls `get_player_state` until `swing_ends_at` is null and keeps the rock selected, swinging again until it breaks. `quantity` / `xp_gained` returned by `mine_ore` are previews only.
- Spec: the breaking `mine_ore` call grants ore and XP immediately and sets `swing_ends_at`; no polling or auto-repeat contract.
- Constant: none (per-ore `swing_seconds` column)
- Literal: none (swing length and pickaxe animation read the ore's `swing_seconds`)
