# Lone Star Frontier - Schema & Tool Contracts

v2.0 implementation contract. Product rules are in `PRD.md`. If a number below and the PRD table ever diverge, fix them in the same commit. These tables are the seed both the Lovable mock and the Replit backend use. The v2.0 client is 2D.

## Constants
- `PRICE_MIN_FACTOR` 0.7, `PRICE_MAX_FACTOR` 1.3
- `QUOTE_TTL_SECONDS` 60
- `RAPPORT_START` 50, `RAPPORT_MIN` 0, `RAPPORT_MAX` 100
- `RAPPORT_DELTA_MIN` −5, `RAPPORT_DELTA_MAX` +5
- `INVENTORY_SLOTS` 14
- `STAMINA_REGEN_PER_SEC` 2 while standing, talking, or walking. There is no running.
- `PICKAXE_STAMINA_RELIEF` 2 per pickaxe tier above the ore's requirement
- `MIN_PICKAXE_STAMINA` 4, applied before clothing
- `CLOTHING_STAMINA_CAP` 30 (percent)
- `CLOTHING_YIELD_CAP` 25 (percent)
- `CHAT_HISTORY_LIMIT` 20 messages sent to the model
- `FLOOR_WIDTH` 20, `FLOOR_HEIGHT` 14. Tiles are integers, `x` 0–19 and `y` 0–13.
- `WALK_MS_PER_TILE` 400
- `MONSTER_REACH` 3 (Euclidean)
- `MONSTER_HIT_DAMAGE` `5 + floor number`
- `MONSTER_HIT_INTERVAL_MS` 1000
- `MONSTER_WALK_MS_PER_TILE` 2400
- `MONSTER_ORE_ROAM_DISTANCE` 3
- `KNOCKOUT_KEEP` 3 rows, after starter clothes
- `MAX_HP` 100

Gold, prices, XP, stamina, and rapport are integers. A fractional price rounds to the nearest integer, then clamps into the integer band `[round(base * 0.7), round(base * 1.3)]`.

## Database Schema (Supabase PostgreSQL)

### 1. `players`
- `id`: UUID (PK)
- `username`: Text
- `mining_level`: Integer (default 1)
- `experience_xp`: Integer (default 0)
- `health_hp`: Integer (default 100)
- `max_hp`: Integer (default 100)
- `stamina`: Integer (default 100)
- `max_stamina`: Integer (default 100)
- `stamina_bank_ms`: Integer (default 0)
- `swing_ends_at`: Timestamp, nullable
- `gold`: Integer (default 50)
- `current_location`: Text (default `saloon`)
- `current_pickaxe_id`: UUID (FK `items_catalog`, nullable)
- `equipped_clothing_id`: UUID (FK `items_catalog`, nullable)
- `equipped_top_id`: UUID (FK `items_catalog`, nullable)
- `equipped_bottom_id`: UUID (FK `items_catalog`, nullable)
- `equipped_hat_id`: UUID (FK `items_catalog`, nullable)
- `pending_swing`: JSONB, nullable
- `mastery_badge_earned`: Boolean (default false)
- `pos_x`: Integer, nullable
- `pos_y`: Integer, nullable
- `step_credit_ms`: Integer (default 0)
- `attack_bank_ms`: Integer (default 0)

Pickaxe tier is not a player column. Read `items_catalog.tier` through `current_pickaxe_id`. HP changes when a Rattler hits and when a knockout refills it. `pos_x` and `pos_y` are the tile on a mine floor, and null everywhere else.

A new player starts at the Saloon with the Rusty Pickaxe in inventory and equipped, the three starter clothes owned and worn, no bonus clothing, no badge, and rapport 50 with each NPC. That is 4 of `INVENTORY_SLOTS` used. `equipped_clothing_id` starts empty. The bonus slot is the only clothing that changes stamina or yield.

### 2. `items_catalog`
- `id`: UUID (PK)
- `name`: Text
- `type`: Text (`pickaxe`, `clothing`, `ore`)
- `tier`: Integer
- `base_value`: Integer (gold)
- `description`: Text
- `required_mining_level`: Integer, nullable (ores)
- `required_pickaxe_tier`: Integer, nullable (ores)
- `xp_per_mine`: Integer, nullable (ores)
- `base_stamina`: Integer, nullable (ores, cost with the minimum pickaxe)
- `swing_seconds`: Numeric, nullable (ores)
- `base_swings`: Integer, nullable (ores, at the required Mining Level and minimum pickaxe)
- `respawn_seconds`: Integer, nullable (ores)
- `stamina_modifier`: Integer, nullable (clothing, 0–30)
- `yield_modifier`: Integer, nullable (clothing, 0–25)
- `outfit_slot`: Text, nullable (`top`, `bottom`, `hat` on clothing)

### 3. `player_inventory`
- `id`: UUID (PK)
- `player_id`: UUID (FK `players`)
- `item_id`: UUID (FK `items_catalog`)
- `quantity`: Integer (default 1)

Ores do not stack. Each ore row has quantity 1, and one player may hold many rows of the same ore. Pickaxes and clothing stay at quantity 1, one row per catalog item. A second gear row for an owned item is `ALREADY_OWNED`.

### 4. `mining_levels`
Total XP required to *be* that Mining Level.

| Level | Rocks of the best ore | XP required |
| ---: | :--- | ---: |
| 1 | — | 0 |
| 2 | 10 copper | 100 |
| 3 | 15 copper | 250 |
| 4 | 20 iron | 730 |
| 5 | 25 iron | 1330 |
| 6 | 30 silver | 2680 |
| 7 | 35 silver | 4255 |
| 8 | 40 gold | 7455 |
| 9 | 45 gold | 11055 |
| 10 | 50 mithril | 18055 |

After XP is added, `mining_level` becomes the highest level whose XP required is ≤ `experience_xp`. Crossing into level 10 sets `mastery_badge_earned` true. It stays true.

### 5. `mine_levels`
- `level_number`: Integer (PK, 1–10)
- `required_mining_level`: Integer (floor entry)

| Floor | Enter at |
| ---: | ---: |
| 1 | 1 |
| 2 | 1 |
| 3 | 3 |
| 4 | 3 |
| 5 | 5 |
| 6 | 5 |
| 7 | 7 |
| 8 | 7 |
| 9 | 9 |
| 10 | 9 |

### 6. `mine_level_ores`
- `mine_level`: Integer (FK `mine_levels`)
- `ore_id`: UUID (FK `items_catalog`)
- `weight`: Integer
- PK (`mine_level`, `ore_id`)

Weights are the full table. A living spot rolls one ore the player has unlocked (Mining Level ≥ `required_mining_level` and equipped pickaxe tier ≥ `required_pickaxe_tier`), using the remaining weights. A broken spot stores `respawn_at` and rolls again only when that time is reached. It does not refill while it is being mined.

### 6b. Floor tiles
The way up is `(1, 7)`. The way down is `(18, 7)` on floors 1–9. Floor 10 has no way down. Entering the floor sets `pos_x, pos_y` to the way up.

Every floor rolls its Rattler tiles when that floor's spots are first created and does not roll again on later visits. Floors 1–4 roll 1, floors 5–8 roll 2, floors 9–10 roll 3. Each starting tile is any floor tile except a rock, the way up, the way down, and another Rattler, and it is farther than `MONSTER_REACH` from the way up. On `tick`, every `MONSTER_WALK_MS_PER_TILE` each Rattler steps one cardinal tile. The step cannot land on a rock, the way up, the way down, another Rattler, the player, or a tile within `MONSTER_REACH` of the way up. A step within `MONSTER_ORE_ROAM_DISTANCE` of an ore is preferred. Otherwise a step closer to the nearest ore is preferred. No legal step means it stays. A hit deals `5 + floor number` HP. A player inside more than one reach is still hit once per interval.

Floors 1–2:

| Spot | x | y |
| ---: | ---: | ---: |
| 1 | 4 | 3 |
| 2 | 8 | 2 |
| 3 | 12 | 3 |
| 4 | 5 | 6 |
| 5 | 4 | 11 |
| 6 | 8 | 12 |
| 7 | 12 | 11 |
| 8 | 15 | 7 |

Floors 3–4:

| Spot | x | y |
| ---: | ---: | ---: |
| 1 | 4 | 3 |
| 2 | 8 | 2 |
| 3 | 5 | 6 |
| 4 | 4 | 11 |
| 5 | 8 | 12 |
| 6 | 12 | 11 |
| 7 | 16 | 3 |
| 8 | 16 | 11 |
| 9 | 11 | 7 |
| 10 | 17 | 7 |

Floors 5–10:

| Spot | x | y |
| ---: | ---: | ---: |
| 1 | 4 | 3 |
| 2 | 8 | 2 |
| 3 | 4 | 11 |
| 4 | 8 | 12 |
| 5 | 16 | 3 |
| 6 | 11 | 7 |
| 7 | 17 | 4 |
| 8 | 17 | 10 |

| Floor | Copper | Iron | Silver | Gold | Mithril |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 100 | — | — | — | — |
| 2 | 100 | — | — | — | — |
| 3 | 70 | 30 | — | — | — |
| 4 | 55 | 45 | — | — | — |
| 5 | 25 | 35 | 40 | — | — |
| 6 | 15 | 25 | 60 | — | — |
| 7 | 12 | 15 | 28 | 45 | — |
| 8 | 10 | 12 | 18 | 60 | — |
| 9 | 8 | 8 | 12 | 27 | 45 |
| 10 | 5 | 8 | 10 | 22 | 55 |

### 7. `npcs`
- `id`: Text (PK)
- `name`: Text
- `role`: Text
- `location`: Text
- `portrait_key`: Text
- `persona`: Text

| Id | Name | Location | Portrait key |
| :--- | :--- | :--- | :--- |
| `store_manager` | General Store Manager | `mining_quarter` | `portrait_store_manager` |
| `saloon_bartender` | Bartender | `saloon` | `portrait_bartender` |
| `saloon_prospector` | Old Prospector | `saloon` | `portrait_prospector` |

Persona text may mention the Rattler. It stays out of the `PRD.md` backlog: no fighting back, bounties, horses, or other towns.

### 8. `npc_interactions`
- `id`: UUID (PK)
- `player_id`: UUID (FK `players`)
- `npc_id`: Text (FK `npcs`)
- `chat_history`: JSONB
- `rapport_score`: Integer (default 50)
- Unique (`player_id`, `npc_id`)

### 9. `store_quotes`
- `id`: UUID (PK)
- `player_id`: UUID (FK `players`)
- `item_id`: UUID (FK `items_catalog`)
- `action_type`: Text (`buy` or `sell`)
- `quantity`: Integer
- `unit_price`: Integer
- `total_price`: Integer
- `expires_at`: Timestamp
- `consumed`: Boolean (default false)

## Catalog Seed
Base values are placeholders and can be rebalanced without a version bump. Descriptions should use the master names from `PRD.md`.

**Ores**

| Name | Tier | Base value | Mining | Pickaxe tier | XP | Base stamina | Swing seconds | Base swings | Respawn seconds |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Red Dirt Copper | 1 | 5 | 1 | 1 | 10 | 6 | 2 | 3 | 10 |
| Pecos Iron | 2 | 12 | 3 | 2 | 24 | 8 | 2.5 | 4 | 15 |
| Brazos Silver | 3 | 30 | 5 | 3 | 45 | 10 | 3 | 5 | 20 |
| Alamo Gold | 4 | 70 | 7 | 4 | 80 | 12 | 3.5 | 6 | 30 |
| Lone Star Mithril | 5 | 150 | 9 | 5 | 140 | 14 | 4 | 8 | 45 |

Mithril description includes the local nickname Bluebonnet Quartz.

**Pickaxes**

| Name | Tier | Base value |
| :--- | ---: | ---: |
| Rusty Pickaxe | 1 | 20 |
| Iron Pickaxe | 2 | 100 |
| Steel Pickaxe | 3 | 300 |
| Reinforced Pickaxe | 4 | 800 |
| Masterwork Pickaxe | 5 | 2000 |

**Starter clothes** (owned at the start, worn, never sold)

| Name | Id | Tier | Base value | Outfit slot |
| :--- | :--- | ---: | ---: | :--- |
| Basic Shirt | `basic_top` | 0 | 0 | `top` |
| Basic Trousers | `basic_bottom` | 0 | 0 | `bottom` |
| Basic Hat | `basic_hat` | 0 | 0 | `hat` |

No stamina or yield modifier. `list_store_items` omits them. A buy quote for one returns `INVALID_ACTION`.

**Bonus clothing** (one worn at a time, in the top slot; modifiers are percents)

| Name | Tier | Base value | Stamina | Yield | Outfit slot |
| :--- | ---: | ---: | ---: | ---: | :--- |
| Worn Bandana | 1 | 80 | 10 | 0 | `top` |
| Prospector's Vest | 2 | 200 | 0 | 10 | `top` |
| Trail Duster | 3 | 500 | 20 | 15 | `top` |

## Shared Error Shape
`{ "code": string, "message": string }`

| Code | When |
| :--- | :--- |
| `LEVEL_LOCKED` | Floor entry or move, Mining Level too low |
| `NO_PICKAXE` | Swing with nothing equipped |
| `NOT_ENOUGH_STAMINA` | Swing cost is above current stamina |
| `SWING_IN_PROGRESS` | Another mine request arrives before `swing_ends_at` |
| `ROCK_DEPLETED` | That spot is empty until `respawn_at` |
| `INVENTORY_FULL` | Swing or purchase needs a slot the player does not have |
| `INSUFFICIENT_GOLD` | Buy quote, not enough gold |
| `INSUFFICIENT_ITEMS` | Sell quote asks for more rows of that ore than the player holds |
| `QUOTE_EXPIRED` | Past `expires_at` |
| `QUOTE_NOT_FOUND` | Unknown or already consumed |
| `INVALID_QUANTITY` | Quantity < 1, or a buy quantity other than 1 |
| `BAD_POSITION` | `set_position` is off the floor, skips a tile, or comes before `WALK_MS_PER_TILE` has been credited |
| `INVALID_ACTION` | Selling gear, or buying an ore |
| `ALREADY_OWNED` | Buying a pickaxe or clothing row the player already holds |
| `NOT_OWNED` | Equipping an item that is not in inventory |
| `UNKNOWN_NPC` | Bad npc id |
| `WRONG_LOCATION` | Talking to an NPC in another place, or swinging on a floor the player is not standing in |
| `UNKNOWN_LOCATION` | Move target outside the closed set |

## Tool Contracts

### `get_player_state(player_id)`
Resolves a pending swing whose `swing_ends_at` has passed, then returns the state. Returns mining level, XP, XP required for the next level (null at 10), HP, max HP, stamina, max stamina, gold, location, `inventory_capacity` (`INVENTORY_SLOTS`), the current floor's spots, `swing_ends_at`, equipped pickaxe (id, name, tier), `equipped_outfit` (`top`, `bottom`, `hat`, each id and name or null), equipped bonus clothing (id, name, modifiers or null), `mastery_badge_earned`, inventory rows (`row_id` integer, item id, name, type, quantity), and `{npc_id, rapport_score}` for every NPC. Ore rows share an item id and each take a slot.

Each spot returns index, `x`, `y`, ore or empty, name, swings done, swings needed, swings left, stamina cost, swing seconds, unlocked, `respawn_at`, `progress`, and `progress_target`. With `N` swings needed and `d` swings already finished, a resting rock has `progress` and `progress_target` at `d / N`. During a swing they move from `d / N` toward `(d + 1) / N`, and `progress_target` is that end. An empty spot is bare ground: the client draws no name and no countdown. The spot list is the table for the player's current floor.

On a mine floor the state returns `position` as `{x, y}` and `floor`: `width`, `height`, `way_up`, `way_down` (null on floor 10), `rattlers` (`id`, `x`, `y`, `strike_sequence`), `rattler_reach`, `hit_damage`, and `walk_ms_per_tile`. `strike_sequence` goes up by 1 when that Rattler lands a hit. Elsewhere `position` and `floor` are null. Stored columns remain `pos_x` and `pos_y`. HP is the stored value, not a constant 100.

### `list_mine_levels(player_id)`
For each floor: level number, entry requirement, whether it is locked, and each ore with weight, unlocked flag, required Mining Level, required pickaxe tier, and the stamina cost for the player's current pickaxe. The UI builds lock hints from these fields (`STYLE_GUIDE.md`).

### `list_store_items(player_id)`
Catalog rows the store sells (pickaxes and bonus clothing) and ores the store buys, with `base_value` and whether the player already owns that gear row. Starter clothes are absent. Quoted prices come only from `get_store_quote`.

### `move(player_id, location)`
`saloon` and `mining_quarter` are always allowed. `mine_N` requires `mining_level >= required_mining_level`. Every move between locations is free. The client plays the walk first and calls `move` when the character arrives. This call does not simulate the path inside Boomtown. Success sets `current_location`. Entering a mine floor ensures that floor's spots exist, sets the tile to `(1, 7)`, and clears `step_credit_ms` and `attack_bank_ms`. Leaving a floor clears `swing_ends_at`, discards `pending_swing` without granting it, clears the tile and both banks, and leaves the spots, including their respawn timers, in place. A locked floor never starts the walk.

### `set_position(player_id, x, y)`
Requires `current_location` of `mine_N`. Any other location returns `WRONG_LOCATION`. `x` and `y` are integers inside the floor. The new tile must be the current tile or a neighbor at Chebyshev distance 1 (the eight surrounding tiles). A farther tile returns `BAD_POSITION` and does not change the tile. A changed tile requires `step_credit_ms >= WALK_MS_PER_TILE`; otherwise `BAD_POSITION`. On success, subtract `WALK_MS_PER_TILE` and store the tile. The same tile is free and does not spend credit. A changed tile discards an unapplied `pending_swing` and clears `swing_ends_at`. That swing grants nothing, and the stamina already spent is not returned. This call does not apply hits. Hits land on `tick`.

### `tick(player_id, elapsed_ms)`
Adds `elapsed_ms` to `step_credit_ms` and caps that credit at `WALK_MS_PER_TILE`.

If the player is within `MONSTER_REACH` of any Rattler on this floor, add `elapsed_ms` to `attack_bank_ms`. Every `MONSTER_HIT_INTERVAL_MS` in that bank deals `5 + floor number` and subtracts that interval. Being inside two reaches does not deal a second hit. Outside every reach, set `attack_bank_ms` to 0. Clients do not edit HP themselves.

If HP falls to 0 or below, this call knocks the player out and does not resolve a pending swing:
- Set HP to `MAX_HP` and location to `mining_quarter`.
- Clear the tile, `step_credit_ms`, `attack_bank_ms`, `swing_ends_at`, and `pending_swing`. The swing grants nothing.
- Keep every starter-clothes row (`basic_top`, `basic_bottom`, `basic_hat`).
- Of the other rows, keep `KNOCKOUT_KEEP` with the highest `items_catalog.base_value`. Ties go to an equipped row, then a pickaxe, then other clothing, then the lowest row id. Fewer than 3 such rows means keep them all.
- Delete every row that was not kept. If the equipped pickaxe or a worn clothing row was deleted, clear that column. Deleting the bonus clothing clears `equipped_clothing_id`.
- Gold, XP, Mining Level, and the mastery badge do not change.

If the player is still standing, resolve a pending swing whose `swing_ends_at` has passed. Then add `elapsed_ms` to `stamina_bank_ms`. Every 1000 stored milliseconds restore 2 stamina and subtract those milliseconds. Clamp stamina to `0…max_stamina`.

Returns the `get_player_state` fields and `knocked_out` (true only on the call that drops the player).

### `mine_ore(player_id, mine_level, spot_index)`
Requires `current_location == mine_{level}`, entry level met, a pickaxe equipped, `spot_index` in the floor's spot table, a living rock the player can mine, and `swing_ends_at` in the past or empty. The player's tile must be Chebyshev-adjacent to the spot, or on it. A farther tile returns `WRONG_LOCATION` and changes nothing. A swing still running returns `SWING_IN_PROGRESS`. An empty spot returns `ROCK_DEPLETED`. Neither of those two changes anything.

Swings needed = `max(1, base_swings − (mining_level − required_mining_level) − (pickaxe_tier − required_pickaxe_tier))`.

Pickaxe cost = `max(4, base_stamina − 2 × (pickaxe_tier − required_pickaxe_tier))`. Bonus clothing then applies: `max(1, ceil(pickaxe_cost × (1 − stamina_modifier / 100)))`. The modifier is 0 when nothing is equipped, and never above 30.

If stamina is below that cost, return `NOT_ENOUGH_STAMINA` and change nothing. On the swing that would break the rock, one free slot is required. If the bag has none, return `INVENTORY_FULL` and change nothing. Otherwise spend stamina, set `swing_ends_at` to now plus `swing_seconds`, and store `pending_swing`. This call does not add ore, XP, a level, the badge, or `respawn_at`.

`pending_swing` holds the spot, the preview quantity, and the preview XP. Quantity is 0 until the breaking swing. On that swing the preview is 1. If a second slot is free and `yield_modifier` is above 0, that percent chance makes the preview 2. A full second slot means the chance is not rolled. Each granted ore is its own row at quantity 1. Preview XP is `xp_per_mine × quantity`. The first `get_player_state` or `tick` after `swing_ends_at` applies it once, unless a knockout on that `tick` discarded it: insert the rows and XP, recompute Mining Level, award the mastery badge if level 10 was just reached, and on the breaking swing set the spot empty until `respawn_seconds` after `swing_ends_at`. Then clear `pending_swing` and `swing_ends_at`.

The client reads state until `swing_ends_at` is null. While that rock stays selected and the player has not walked away, the client calls `mine_ore` again until the rock breaks. The server does not start the next swing.

Returns `ore_id`, `quantity`, `xp_gained`, `stamina_spent`, `swings_done`, `swings_needed`, `swing_ends_at`, `respawn_at`, `mining_level`, and `mastery_badge_earned`. `quantity` and `xp_gained` are the preview. The inventory and XP change on the later read.

### `equip_item(player_id, item_id)`
Item must be in inventory and be a pickaxe or clothing. A pickaxe sets `current_pickaxe_id`. Clothing fills `equipped_top_id`, `equipped_bottom_id`, or `equipped_hat_id` from `outfit_slot`. Bonus clothing also sets `equipped_clothing_id`. Equipping a starter top clears `equipped_clothing_id` when the top slot had held the bonus item. The row stays in the inventory. A living rock the player can no longer mine is left in place until they can, or until they break it with a pickaxe that qualifies.

### `unequip_item(player_id, item_id)`
Clothing only. The item must be the one in its outfit slot. That slot becomes empty. If it was `equipped_clothing_id`, that column clears and its modifiers stop. A pickaxe returns `INVALID_ACTION` and stays equipped. The row stays in the inventory.

### `talk_to_npc(player_id, npc_id, message)`
NPC must exist and share the player's location. The model sees the persona, the last 20 messages, the current rapport, and the new message. It returns a reply and a suggested `rapport_delta`. A hostile line is negative, a polite line is positive, and a neutral line may be 0. The server clamps the delta to −5…+5, adds it to the stored score, clamps the score to 0…100, and appends the exchange. No flat bonus is added on top.

Returns `reply`, `rapport_delta`, `rapport_score`.

The mock stand-in, until Replit is connected: words such as yell, insult, or threat suggest a negative delta; thanks, please, or friend suggest a small positive delta; otherwise 0. The same clamps apply. This stand-in is not the semantic model.

### `get_store_quote(player_id, item_id, action_type, quantity)`
- `sell`: ores only, `1 ≤ quantity ≤` the number of rows of that ore.
- `buy`: pickaxes and bonus clothing only, quantity 1, not already owned. Starter clothes return `INVALID_ACTION`.
- Rapport input is the General Store Manager's score only. Mining Level does not change the price.
- Unit price, for both the mock and Replit, with rapport `r` from 0 to 100:
  - Sell: `round(base * (0.7 + 0.6 * r / 100))`
  - Buy: `round(base * (1.3 - 0.6 * r / 100))`
  - Then clamp to the integer band.
- `total_price = unit_price * quantity`. `expires_at` is 60 seconds from creation.

Returns `quote_id`, `unit_price`, `quantity`, `total_price`, `expires_at`.

### `execute_trade(player_id, quote_id)`
The quote must exist, be unconsumed, and be unexpired. Re-check gold, row count, ownership, and free slots. Then apply gold and inventory, mark the quote consumed, and if a sold row was equipped, clear that pickaxe, bonus slot, or outfit slot. A sell of quantity N deletes N rows of that ore. Rapport does not change on a trade. Starter clothes are not a trade.

## Client Seam
Lovable mirrors these functions on `GameService` (`AGENTS.md`), including `unequip_item` and `set_position`. Components call the interface. They do not reimplement prices, drops, stamina, hit points, knockout, level locks, or rapport. `inventory_capacity` and the spot list are the inventory size and the rocks. Components do not write those numbers themselves.
