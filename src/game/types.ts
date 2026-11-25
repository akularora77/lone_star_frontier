export type ItemType = "pickaxe" | "clothing" | "ore";
export type OreId = "ore_copper" | "ore_iron" | "ore_silver" | "ore_gold" | "ore_mithril";
export type NpcId = "store_manager" | "saloon_bartender" | "saloon_prospector";
export type Location = "saloon" | "mining_quarter" | `mine_${number}`;

export interface CatalogItem {
  id: string;
  name: string;
  type: ItemType;
  tier: number;
  base_value: number;
  description: string;
  required_mining_level?: number;
  required_pickaxe_tier?: number;
  xp_per_mine?: number;
  base_stamina?: number;
  swing_seconds?: number;
  base_swings?: number;
  respawn_seconds?: number;
  stamina_modifier?: number;
  yield_modifier?: number;
}

export interface Npc {
  id: NpcId;
  name: string;
  role: string;
  location: Location;
  portrait_key: string;
}

export type ErrorCode =
  | "SWING_IN_PROGRESS" | "ROCK_DEPLETED"
  | "LEVEL_LOCKED" | "NO_PICKAXE" | "NOT_ENOUGH_STAMINA" | "INVENTORY_FULL" | "INSUFFICIENT_GOLD"
  | "INSUFFICIENT_ITEMS" | "QUOTE_EXPIRED" | "QUOTE_NOT_FOUND" | "INVALID_QUANTITY" | "INVALID_ACTION"
  | "ALREADY_OWNED" | "NOT_OWNED" | "UNKNOWN_NPC" | "WRONG_LOCATION" | "UNKNOWN_LOCATION";

/** Shared error shape from SCHEMA.md. */
export interface GameErrorShape { code: ErrorCode; message: string }

export class GameError extends Error implements GameErrorShape {
  constructor(public code: ErrorCode, message: string) {
    super(message);
    this.name = "GameError";
  }
}

export function isGameError(e: unknown): e is GameError {
  return typeof e === "object" && e !== null && "code" in e && "message" in e;
}

export interface InventoryRow extends CatalogItem { quantity: number }

export interface PlayerState {
  id: string;
  username: string;
  mining_level: number;
  experience_xp: number;
  xp_for_current_level: number;
  xp_for_next_level: number | null;
  health_hp: number;
  max_hp: number;
  stamina: number;
  max_stamina: number;
  swing_ends_at: number | null;
  rock_spots: RockSpot[];
  gold: number;
  current_location: Location;
  equipped_pickaxe: { id: string; name: string; tier: number } | null;
  equipped_clothing: { id: string; name: string; stamina_modifier: number; yield_modifier: number } | null;
  equipped_outfit: { top: string | null; bottom: string | null; hat: string | null };
  inventory_capacity: number;
  mastery_badge_earned: boolean;
  inventory: InventoryRow[];
  rapport: { npc_id: NpcId; rapport_score: number }[];
}

export interface MineLevelInfo {
  level_number: number;
  required_mining_level: number;
  locked: boolean;
  ores: { ore_id: OreId; name: string; tier: number; weight: number; unlocked: boolean; required_mining_level: number; required_pickaxe_tier: number; required_pickaxe_name: string; stamina_cost: number; swing_seconds: number }[];
}

export interface StoreItem { id: string; name: string; type: ItemType; tier: number; base_value: number; description: string; owned: boolean; mode: "sells" | "buys" }

export interface RockSpot {
  index: number; ore_id: OreId | null; name: string; swings_done: number; swings_needed: number;
  swings_left: number; stamina_cost: number; swing_seconds: number; respawn_at: number | null;
  unlocked: boolean;
  progress: number; progress_target: number;
}
export interface MineResult {
  ore_id: OreId; quantity: number; xp_gained: number; stamina_spent: number;
  swings_done: number; swings_needed: number; swing_ends_at: number; respawn_at: number | null;
  mining_level: number; mastery_badge_earned: boolean;
}
export interface TalkResult { reply: string; rapport_delta: number; rapport_score: number }
export interface Quote { quote_id: string; item_id: string; action_type: "buy" | "sell"; unit_price: number; quantity: number; total_price: number; expires_at: number }
