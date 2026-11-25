# Lone Star Frontier - Schema & Tool Contracts

v1.0 implementation contract. Product rules are in `PRD.md`. If a number below and the PRD table ever diverge, fix them in the same commit. These tables are the seed both the Lovable mock and the Replit backend use.

## Constants
- `PRICE_MIN_FACTOR` 0.7, `PRICE_MAX_FACTOR` 1.3
- `QUOTE_TTL_SECONDS` 60
- `RAPPORT_START` 50, `RAPPORT_MIN` 0, `RAPPORT_MAX` 100
- `RAPPORT_DELTA_MIN` −5, `RAPPORT_DELTA_MAX` +5
- `INVENTORY_SLOTS` 28
- `ORE_STACK_CAP` 9999
- `STAMINA_REGEN_PER_SEC` 2 while standing, talking, or walking. There is no running in v1.0.
- `PICKAXE_STAMINA_RELIEF` 2 per pickaxe tier above the ore's requirement
- `MIN_PICKAXE_STAMINA` 4, applied before clothing
- `CLOTHING_STAMINA_CAP` 30 (percent)
- `CLOTHING_YIELD_CAP` 25 (percent)
- `CHAT_HISTORY_LIMIT` 20 messages sent to the model
- `ROCKS_PER_FLOOR` 3

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
- `mastery_badge_earned`: Boolean (default false)

Pickaxe tier is not a player column. Read `items_catalog.tier` through `current_pickaxe_id`. HP does not change in v1.0.

A new player starts at the Saloon with the Rusty Pickaxe in inventory and equipped, no clothing, no badge, and rapport 50 with each NPC.

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

### 3. `player_inventory`
- `id`: UUID (PK)
- `player_id`: UUID (FK `players`)
- `item_id`: UUID (FK `items_catalog`)
- `quantity`: Integer (default 1)
- Unique (`player_id`, `item_id`)

Ores stack to 9,999. Pickaxes and clothing stay at quantity 1. One row per catalog item.

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

Weights are the full table. Each floor has 3 spots. A living spot rolls one ore the player has unlocked (Mining Level ≥ `required_mining_level` and equipped pickaxe tier ≥ `required_pickaxe_tier`), using the remaining weights. A broken spot stores `respawn_at` and rolls again only when that time is reached. It does not refill while it is being mined.

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

Persona text tells the model to stay in the v1.0 world and out of the `PRD.md` backlog.

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

## v1.0 Catalog Seed
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

**Clothing** (one slot; modifiers are percents)

| Name | Tier | Base value | Stamina | Yield |
| :--- | ---: | ---: | ---: | ---: |
| Worn Bandana | 1 | 80 | 10 | 0 |
| Prospector's Vest | 2 | 200 | 0 | 10 |
| Trail Duster | 3 | 500 | 20 | 15 |

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
| `INSUFFICIENT_ITEMS` | Sell quote, stack shrunk or missing |
| `QUOTE_EXPIRED` | Past `expires_at` |
| `QUOTE_NOT_FOUND` | Unknown or already consumed |
| `INVALID_QUANTITY` | Quantity < 1, buy quantity ≠ 1, or above stack cap |
| `INVALID_ACTION` | Selling gear, or buying an ore |
| `ALREADY_OWNED` | Buying a pickaxe or clothing row the player already holds |
| `NOT_OWNED` | Equipping an item that is not in inventory |
| `UNKNOWN_NPC` | Bad npc id |
| `WRONG_LOCATION` | Talking to an NPC in another place, or swinging on a floor the player is not standing in |
| `UNKNOWN_LOCATION` | Move target outside the closed set |

## Tool Contracts

### `get_player_state(player_id)`
Returns mining level, XP, XP required for the next level (null at 10), HP, max HP, stamina, max stamina, gold, location, the current floor's 3 spots (index, ore or empty, swings done, swings needed, respawn_at), `swing_ends_at`, equipped pickaxe (id, name, tier), equipped clothing (id, name, modifiers or null), `mastery_badge_earned`, inventory rows (id, name, type, quantity), and `{npc_id, rapport_score}` for every NPC.

### `list_mine_levels(player_id)`
For each floor: level number, entry requirement, whether it is locked, and each ore with weight, unlocked flag, required Mining Level, required pickaxe tier, and the stamina cost for the player's current pickaxe. The UI builds lock hints from these fields (`STYLE_GUIDE.md`).

### `list_store_items(player_id)`
Catalog rows the store sells (pickaxes, clothing) and ores the store buys, with `base_value` and whether the player already owns that gear row. Quoted prices come only from `get_store_quote`.

### `move(player_id, location)`
`saloon` and `mining_quarter` are always allowed. `mine_N` requires `mining_level >= required_mining_level`. Every move is free. The client plays the walk first and calls `move` when the character arrives. This call does not simulate the path. Success sets `current_location`. Entering a mine floor ensures its 3 spots exist. Leaving a floor clears `swing_ends_at` and leaves the spots, including their respawn timers, in place. A locked floor never starts the walk.

### `tick(player_id, elapsed_ms)`
Adds `elapsed_ms` to `stamina_bank_ms`. Every 1000 stored milliseconds restore 2 stamina and subtract those milliseconds. Clamp stamina to `0…max_stamina`. Clients do not edit stamina themselves.

### `mine_ore(player_id, mine_level, spot_index)`
Requires `current_location == mine_{level}`, entry level met, a pickaxe equipped, `spot_index` in 1–3, a living rock the player can mine, and `swing_ends_at` in the past or empty. A swing still running returns `SWING_IN_PROGRESS`. An empty spot returns `ROCK_DEPLETED`. Neither changes anything.

Swings needed = `max(1, base_swings − (mining_level − required_mining_level) − (pickaxe_tier − required_pickaxe_tier))`.

Pickaxe cost = `max(4, base_stamina − 2 × (pickaxe_tier − required_pickaxe_tier))`. Clothing then applies: `max(1, ceil(pickaxe_cost × (1 − stamina_modifier / 100)))`. The modifier is 0 when nothing is equipped, and never above 30.

If stamina is below that cost, return `NOT_ENOUGH_STAMINA` and change nothing. Set `swing_ends_at` to now plus `swing_seconds` and spend stamina. If this is not the breaking swing, add 1 to swings done and grant nothing. On the breaking swing, if the ore needs a new slot and the inventory is full, return `INVENTORY_FULL` and change nothing. Otherwise add 1, then with `yield_modifier` percent chance add 1 more of the same ore, capped at 9,999. Add `xp_per_mine × quantity`, recompute Mining Level, award the mastery badge if level 10 was just reached, and set the spot empty until `respawn_seconds` after the swing ends.

Returns `ore_id`, `quantity` (0 until the rock breaks), `xp_gained`, `stamina_spent`, `swings_done`, `swings_needed`, `swing_ends_at`, `respawn_at`, `mining_level`, and `mastery_badge_earned`.

### `equip_item(player_id, item_id)`
Item must be in inventory and be a pickaxe or clothing. Sets `current_pickaxe_id` or `equipped_clothing_id`. The row stays in the inventory. A living rock the player can no longer mine is left in place until they can, or until they break it with a pickaxe that qualifies.

### `talk_to_npc(player_id, npc_id, message)`
NPC must exist and share the player's location. The model sees the persona, the last 20 messages, the current rapport, and the new message. It returns a reply and a suggested `rapport_delta`. A hostile line is negative, a polite line is positive, and a neutral line may be 0. The server clamps the delta to −5…+5, adds it to the stored score, clamps the score to 0…100, and appends the exchange. No flat bonus is added on top.

Returns `reply`, `rapport_delta`, `rapport_score`.

The mock stand-in, until Replit is connected: words such as yell, insult, or threat suggest a negative delta; thanks, please, or friend suggest a small positive delta; otherwise 0. The same clamps apply. This stand-in is not the semantic model.

### `get_store_quote(player_id, item_id, action_type, quantity)`
- `sell`: ores only, `1 ≤ quantity ≤ owned`.
- `buy`: pickaxes and clothing only, quantity 1, not already owned.
- Rapport input is the General Store Manager's score only. Mining Level does not change the price.
- Unit price, for both the mock and Replit, with rapport `r` from 0 to 100:
  - Sell: `round(base * (0.7 + 0.6 * r / 100))`
  - Buy: `round(base * (1.3 - 0.6 * r / 100))`
  - Then clamp to the integer band.
- `total_price = unit_price * quantity`. `expires_at` is 60 seconds from creation.

Returns `quote_id`, `unit_price`, `quantity`, `total_price`, `expires_at`.

### `execute_trade(player_id, quote_id)`
The quote must exist, be unconsumed, and be unexpired. Re-check gold, stack size, ownership, and free slots. Then apply gold and inventory, mark the quote consumed, and if the sold row was equipped, clear that equipment slot. Rapport does not change on a trade.

## Client Seam
Lovable mirrors these functions on `GameService` (`AGENTS.md`). Components call the interface. They do not reimplement prices, drops, stamina, level locks, or rapport.
