// Central gameplay tuning: schema defaults plus requested preview overrides.
export const STARTING_GOLD = 50;
export const STARTING_HP = 100;
export const STARTING_STAMINA = 100;
export const PRICE_MIN_FACTOR = 0.7;
export const PRICE_MAX_FACTOR = 1.3;
export const QUOTE_TTL_SECONDS = 60;
export const RAPPORT_START = 50;
export const RAPPORT_MIN = 0;
export const RAPPORT_MAX = 100;
export const RAPPORT_DELTA_MIN = -5;
export const RAPPORT_DELTA_MAX = 5;
export const RAPPORT_FRIENDLY_DELTA = 2;
export const RAPPORT_RUDE_DELTA = -4;
export const INVENTORY_SLOTS = 14;
export const ORE_STACK_CAP = 9999;
export const STAMINA_REGEN_PER_SEC = 2;
export const PICKAXE_STAMINA_RELIEF = 2;
export const MIN_PICKAXE_STAMINA = 4;
export const ROCKS_PER_FLOOR = 3;
export const CLOTHING_STAMINA_CAP = 30;
export const CLOTHING_YIELD_CAP = 25;
export const CHAT_HISTORY_LIMIT = 20;
export const MAX_MINING_LEVEL = 10;

/** Total XP required to be each Mining Level (index 0 = level 1). */
export const XP_TABLE = [0, 100, 250, 730, 1330, 2680, 4255, 7455, 11055, 18055] as const;
