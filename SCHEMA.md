# Lone Star Frontier - Schema & Tool Contracts

v1.0 implementation contract. Product rules are in `PRD.md`. If a number below and the PRD table ever diverge, fix them in the same commit. These tables are the seed both the Lovable mock and the Replit backend use.

## Constants
- `PRICE_MIN_FACTOR` 0.7, `PRICE_MAX_FACTOR` 1.3
- `QUOTE_TTL_SECONDS` 60
- `RAPPORT_START` 50, `RAPPORT_MIN` 0, `RAPPORT_MAX` 100
- `RAPPORT_DELTA_MIN` −5, `RAPPORT_DELTA_MAX` +5
- `INVENTORY_SLOTS` 28
- `ORE_STACK_CAP` 9999
- `STAMINA_REGEN_PER_SEC` 2 (walk or idle)
- `RUN_DRAIN_PER_SEC` 4
- `CLOTHING_STAMINA_CAP` 30 (percent)
- `CLOTHING_YIELD_CAP` 25 (percent)
- `CHAT_HISTORY_LIMIT` 20 messages sent to the model

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
- `movement_mode`: Text (`walk` or `run`, default `walk`)
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

| Level | XP required |
| ---: | ---: |
| 1 | 0 |
| 2 | 80 |
| 3 | 200 |
| 4 | 400 |
| 5 | 700 |
| 6 | 1100 |
| 7 | 1600 |
| 8 | 2300 |
| 9 | 3200 |
| 10 | 4400 |

After XP is added, `mining_level` becomes the highest level whose XP required is ≤ `experience_xp`. Crossing into level 10 sets `mastery_badge_earned` true. It stays true.

### 5. `mine_levels`
- `level_number`: Integer (PK, 1–10)
- `required_mining_level`: Integer (floor entry)
- `stamina_cost`: Integer (before clothing)

| Floor | Enter at | Stamina |
| ---: | ---: | ---: |
| 1 | 1 | 5 |
| 2 | 1 | 5 |
| 3 | 2 | 8 |
| 4 | 3 | 8 |
| 5 | 4 | 12 |
| 6 | 5 | 12 |
| 7 | 6 | 16 |
| 8 | 7 | 16 |
| 9 | 8 | 20 |
| 10 | 9 | 20 |

### 6. `mine_level_ores`
- `mine_level`: Integer (FK `mine_levels`)
- `ore_id`: UUID (FK `items_catalog`)
- `weight`: Integer
- PK (`mine_level`, `ore_id`)

Weights are the full table. A swing keeps only ores the player has unlocked (Mining Level ≥ `required_mining_level` and equipped pickaxe tier ≥ `required_pickaxe_tier`), then rolls on the remaining weights.

| Floor | Copper | Iron | Silver | Gold | Mithril |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 100 | — | — | — | — |
| 2 | 100 | — | — | — | — |
| 3 | 80 | 20 | — | — | — |
| 4 | 60 | 40 | — | — | — |
| 5 | 40 | 40 | 20 | — | — |
| 6 | 25 | 35 | 40 | — | — |
| 7 | 20 | 25 | 30 | 25 | — |
| 8 | 15 | 20 | 25 | 40 | — |
| 9 | 12 | 15 | 20 | 28 | 25 |
| 10 | 10 | 12 | 18 | 25 | 35 |

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

| Name | Tier | Base value | Mining | Pickaxe tier | XP |
| :--- | ---: | ---: | ---: | ---: | ---: |
| Red Dirt Copper | 1 | 5 | 1 | 1 | 10 |
| Pecos Iron | 2 | 12 | 3 | 2 | 20 |
| Brazos Silver | 3 | 30 | 5 | 3 | 35 |
| Alamo Gold | 4 | 70 | 7 | 4 | 55 |
| Lone Star Mithril | 5 | 150 | 9 | 5 | 80 |

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
| `NOT_ENOUGH_STAMINA` | Swing cost, or trying to run at 0 |
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
Returns mining level, XP, XP required for the next level (null at 10), HP, max HP, stamina, max stamina, movement mode, gold, location, equipped pickaxe (id, name, tier), equipped clothing (id, name, modifiers or null), `mastery_badge_earned`, inventory rows (id, name, type, quantity), and `{npc_id, rapport_score}` for every NPC.

### `list_mine_levels(player_id)`
For each floor: level number, entry requirement, whether it is locked, stamina cost, and each ore with weight, unlocked flag, required Mining Level, and required pickaxe tier. The UI builds lock hints from these fields (`STYLE_GUIDE.md`).

### `list_store_items(player_id)`
Catalog rows the store sells (pickaxes, clothing) and ores the store buys, with `base_value` and whether the player already owns that gear row. Quoted prices come only from `get_store_quote`.

### `move(player_id, location)`
`saloon` and `mining_quarter` are always allowed. `mine_N` requires `mining_level >= required_mining_level`. Success sets `current_location`.

### `set_movement_mode(player_id, mode)`
`walk` or `run`. `run` at 0 stamina returns `NOT_ENOUGH_STAMINA`.

### `tick(player_id, elapsed_ms)`
Applies stamina for the elapsed time. Walk: `+2/sec`. Run: `−4/sec`. Round to the nearest integer and clamp to `0…max_stamina`. If a run tick lands on 0, set mode to `walk`. This is the only stamina regen and run drain. Clients do not edit stamina themselves.

### `mine_ore(player_id, mine_level)`
Requires `current_location == mine_{level}`, entry level met, a pickaxe equipped, and stamina ≥ the adjusted cost.

Adjusted cost = max(1, ceil(stamina_cost × (1 − clothing_stamina_modifier / 100))). The modifier is 0 when nothing is equipped, and never above 30.

Roll one unlocked ore on the filtered weights. If that ore needs a new slot and the inventory is full, return `INVENTORY_FULL` and change nothing. Otherwise add 1, then with `yield_modifier` percent chance add 1 more of the same ore, capped at 9,999. Add that ore's XP, recompute Mining Level, spend stamina, and award the mastery badge if level 10 was just reached.

Returns `ore_id`, `quantity`, `xp_gained`, `stamina_spent`, `mining_level`, `mastery_badge_earned`.

### `equip_item(player_id, item_id)`
Item must be in inventory and be a pickaxe or clothing. Sets `current_pickaxe_id` or `equipped_clothing_id`. The row stays in the inventory.

### `talk_to_npc(player_id, npc_id, message)`
NPC must exist and share the player's location. The model sees the persona, the last 20 messages, the current rapport, and the new message. It returns a reply and a suggested `rapport_delta`. The server clamps the delta to −5…+5, adds it to the stored score, clamps the score to 0…100, and appends the exchange. No flat bonus is added on top.

Returns `reply`, `rapport_delta`, `rapport_score`.

The mock stand-in, until Replit is connected: words such as yell, insult, or threat suggest a negative delta; thanks, please, or friend suggest a small positive delta; otherwise 0. The same clamps apply. This stand-in is not the semantic model.

### `get_store_quote(player_id, item_id, action_type, quantity)`
- `sell`: ores only, `1 ≤ quantity ≤ owned`.
- `buy`: pickaxes and clothing only, quantity 1, not already owned.
- Rapport input is the General Store Manager's score only.
- **Mock unit price** (the v1.0 UI stand-in), rapport `r` from 0 to 100:
  - Sell: `round(base * (0.7 + 0.6 * r / 100))`
  - Buy: `round(base * (1.3 - 0.6 * r / 100))`
  - Then clamp to the integer band.
- The Replit service may replace that formula with a model proposal that also sees Mining Level. It must still clamp to the band, still move in the player's favor as rapport rises, and still store the clamped numbers on the quote.
- `total_price = unit_price * quantity`. `expires_at` is 60 seconds from creation.

Returns `quote_id`, `unit_price`, `quantity`, `total_price`, `expires_at`.

### `execute_trade(player_id, quote_id)`
The quote must exist, be unconsumed, and be unexpired. Re-check gold, stack size, ownership, and free slots. Then apply gold and inventory, mark the quote consumed, and if the sold row was equipped, clear that equipment slot. Rapport does not change on a trade.

## Client Seam
Lovable mirrors these functions on `GameService` (`AGENTS.md`). Components call the interface. They do not reimplement prices, drops, stamina, level locks, or rapport.
