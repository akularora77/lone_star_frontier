# Prototype drift — proposals for the root specs

Compared against GitHub `main` @ `9398fa6` (v2.0, 2D dangerous mine). Replit builds from the root specs, not from this file. Rules main already states are left out.

Closed on this pass: the mine now uses the SCHEMA 6b layouts (8 / 10 / 8 rocks), positions, the Rattler, knockout and unstacked ore. No `ROCKS_PER_FLOOR` literal remains.

## 1. Position and floor fields in `get_player_state`
- **Prototype:** returns `position: {x, y} | null` and `floor: { width, height, way_up, way_down, rattlers, rattler_reach, hit_damage, walk_ms_per_tile } | null`, so the client draws Rattlers and pathing from the service. The reach is not drawn.
- **Spec:** `pos_x` / `pos_y` are player columns and spots return `x`, `y`, but the `get_player_state` field list names neither the tile nor the floor dimensions, ladder tiles and walking interval.
- **Constant:** `FLOOR_WIDTH`, `FLOOR_HEIGHT`, `MONSTER_REACH`, `WALK_MS_PER_TILE`
- **Literal:** none

## Requested Rattler changes (2026-11-26)
These proposals were checked against the current main SCHEMA on this date; the older comparison above is retained for context.

### Slow roaming
- **Prototype:** GameService `tick` moves each Rattler one cardinal tile every 2400 ms. It wanders near ore spots, steering toward them when farther away, and avoids rocks, ladders, other snakes and the player's occupied tile. The entrance stays outside its reach. Snapshots and floor re-entry do not reroll positions.
- **Spec:** SCHEMA 6b says Rattlers do not move after their initial roll.
- **Constant:** none in SCHEMA; preview uses `MONSTER_WALK_MS_PER_TILE` and `MONSTER_ORE_ROAM_DISTANCE`.
- **Literal:** none; rules read `src/game/constants.ts`.

### Faster attacks
- **Prototype:** one bite per 1000 ms in reach; damage remains `5 + floor number`, with no extra hit for overlapping snakes.
- **Spec:** `MONSTER_HIT_INTERVAL_MS` is 2000.
- **Constant:** `MONSTER_HIT_INTERVAL_MS`
- **Literal:** none; rules read `src/game/constants.ts`.

### Hidden reach and strike events
- **Prototype:** no range circle is drawn. Each snake snapshot includes a stable `id` and `strike_sequence`; only the attacking snake increments its sequence, triggering a directed lunge and recoil animation. Animation never awards damage.
- **Spec:** SCHEMA supplies position, reach and damage, but no per-snake strike event or stable identifier; snakes are stationary.
- **Constant:** none
- **Literal:** none; animation timings in `src/styles.css` are cosmetic, not attack rules.

## 2. Inventory row id
- **Prototype:** each inventory row carries `row_id` (integer) and `quantity` 1.
- **Spec:** "row id" is listed but not named or typed.
- **Constant:** none
- **Literal:** none

## 3. `set_position` outside the mine
- **Prototype:** returns `WRONG_LOCATION`.
- **Spec:** requires `mine_N` but does not name the error.
- **Constant:** none
- **Literal:** none

## 4. Rock text
- **Prototype:** a rock shows a whole-rock progress bar while swinging and no swing count (the user asked to remove "N swings left").
- **Spec:** STYLE_GUIDE "Mine floors" says the spot shows the swings still left.
- **Constant:** none
- **Literal:** none

## 5. Mine view
- **Prototype:** the whole 20×14 chamber is in view so the Rattler is always visible before the player commits to a walk.
- **Spec:** the viewpoint text implies a following view.
- **Constant:** none
- **Literal:** none
