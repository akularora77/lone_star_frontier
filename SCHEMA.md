# Lone Star Frontier - Schema & Tool Contracts

## Database Schema (Supabase PostgreSQL)

### 1. `players`
- `id`: UUID (Primary Key)
- `username`: Text
- `mining_level`: Integer (Default: 1)
- `experience_xp`: Integer (Default: 0)
- `health_hp`: Integer (Default: 100)
- `stamina`: Integer (Default: 100)
- `gold`: Integer (Default: 50)
- `active_badge_id`: UUID (Foreign Key to `badges`)
- `current_pickaxe_id`: UUID (Foreign Key to `items_catalog`)

### 2. `items_catalog`
- `id`: UUID (Primary Key)
- `name`: Text
- `type`: Text ('pickaxe', 'clothing', 'ore')
- `tier`: Integer
- `base_value`: Integer (Gold)
- `description`: Text

### 3. `player_inventory`
- `id`: UUID (Primary Key)
- `player_id`: UUID (Foreign Key to `players`)
- `item_id`: UUID (Foreign Key to `items_catalog`)
- `quantity`: Integer (Default: 1)

### 4. `mine_levels`
- `level_number`: Integer (Primary Key, 1-10)
- `required_mining_level`: Integer
- `required_pickaxe_tier`: Integer
- `ore_id`: UUID (Foreign Key to `items_catalog`)
- `xp_per_mine`: Integer

### 5. `npc_interactions`
- `id`: UUID (Primary Key)
- `player_id`: UUID (Foreign Key to `players`)
- `npc_id`: Text (e.g., 'store_manager', 'saloon_local_1')
- `chat_history`: JSONB
- `rapport_score`: Integer (0-100)

---

## Backend Tool Contracts (Deterministic)

### `mine_ore(player_id, mine_level)`
- **Constraints:** 
  - Verify `players.mining_level >= mine_levels.required_mining_level`.
  - Verify `players.current_pickaxe_tier >= mine_levels.required_pickaxe_tier`.
  - Check `players.stamina >= cost_to_mine`.
- **Output:** 
  - Success: `ore_id`, `xp_gained`, `stamina_spent`.
  - Failure: Error message.

### `get_store_quote(player_id, item_id, action_type)`
- **`action_type`:** 'buy' or 'sell'.
- **LLM Role:** Propose a price based on `rapport_score` and `mining_level`.
- **Hard Guardrails:** 
  - Price must be within `[base_value * 0.7, base_value * 1.3]`.
  - Returns `quote_id`, `quoted_price`, `expires_at`.

### `execute_trade(player_id, quote_id)`
- **Constraints:** 
  - Verify `quote_id` is not expired.
  - Verify player has sufficient gold (if buying) or item quantity (if selling).
- **Action:** 
  - Update `players.gold`.
  - Update `player_inventory`.
