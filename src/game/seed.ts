import {
  BARTENDER_NAME, GENERAL_STORE_NAME, HUB_CITY_NAME, MINING_NPC_NAME, MINING_QUARTER_NAME,
  PROSPECTOR_NAME, STARTING_SALOON_NAME,
} from "./gameConfig";
import type { CatalogItem, Npc, OreId } from "./types";

// Gameplay catalog mirrors SCHEMA.md; zero-bonus starter clothes extend the preview
// outfit contract requested by the user (propose this addition for Replit's schema).
export const CATALOG: CatalogItem[] = [
  { id: "ore_copper", name: "Red Dirt Copper", type: "ore", tier: 1, base_value: 5, description: `Rust-red copper from the shallow floors under ${HUB_CITY_NAME}.`, required_mining_level: 1, required_pickaxe_tier: 1, xp_per_mine: 10, base_stamina: 6, swing_seconds: 2, base_swings: 3, respawn_seconds: 10 },
  { id: "ore_iron", name: "Pecos Iron", type: "ore", tier: 2, base_value: 12, description: "Heavy grey iron, named for the river men who first hauled it.", required_mining_level: 3, required_pickaxe_tier: 2, xp_per_mine: 24, base_stamina: 8, swing_seconds: 2.5, base_swings: 4, respawn_seconds: 15 },
  { id: "ore_silver", name: "Brazos Silver", type: "ore", tier: 3, base_value: 30, description: "Bright silver seams that glint by lantern light.", required_mining_level: 5, required_pickaxe_tier: 3, xp_per_mine: 45, base_stamina: 10, swing_seconds: 3, base_swings: 5, respawn_seconds: 20 },
  { id: "ore_gold", name: "Alamo Gold", type: "ore", tier: 4, base_value: 70, description: `Real color. ${GENERAL_STORE_NAME} pays well for it.`, required_mining_level: 7, required_pickaxe_tier: 4, xp_per_mine: 80, base_stamina: 12, swing_seconds: 3.5, base_swings: 6, respawn_seconds: 30 },
  { id: "ore_mithril", name: "Lone Star Mithril", type: "ore", tier: 5, base_value: 150, description: "A blue-white ore the locals call Bluebonnet Quartz. Found only in the deepest floors.", required_mining_level: 9, required_pickaxe_tier: 5, xp_per_mine: 140, base_stamina: 14, swing_seconds: 4, base_swings: 8, respawn_seconds: 45 },
  { id: "pick_rusty", name: "Rusty Pickaxe", type: "pickaxe", tier: 1, base_value: 20, description: `Handed out at ${STARTING_SALOON_NAME} to every new arrival.` },
  { id: "pick_iron", name: "Iron Pickaxe", type: "pickaxe", tier: 2, base_value: 100, description: "Bites into Pecos Iron." },
  { id: "pick_steel", name: "Steel Pickaxe", type: "pickaxe", tier: 3, base_value: 300, description: "Tempered steel for Brazos Silver." },
  { id: "pick_reinforced", name: "Reinforced Pickaxe", type: "pickaxe", tier: 4, base_value: 800, description: "Banded head that can split Alamo Gold." },
  { id: "pick_masterwork", name: "Masterwork Pickaxe", type: "pickaxe", tier: 5, base_value: 2000, description: "The finest tool in the territory. Cuts mithril." },
  { id: "cloth_bandana", name: "Worn Bandana", type: "clothing", tier: 1, base_value: 80, description: "Keeps the dust out. Swings cost less stamina.", stamina_modifier: 10, yield_modifier: 0 },
  { id: "cloth_vest", name: "Prospector's Vest", type: "clothing", tier: 2, base_value: 200, description: "Deep pockets mean the odd extra ore.", stamina_modifier: 0, yield_modifier: 10 },
  { id: "cloth_duster", name: "Trail Duster", type: "clothing", tier: 3, base_value: 500, description: "Long coat of a seasoned miner.", stamina_modifier: 20, yield_modifier: 15 },
  { id: "basic_top", name: "Basic Shirt", type: "clothing", tier: 0, base_value: 0, description: "Your everyday shirt. No mining bonuses.", stamina_modifier: 0, yield_modifier: 0 },
  { id: "basic_bottom", name: "Basic Trousers", type: "clothing", tier: 0, base_value: 0, description: "Your everyday trousers. No mining bonuses.", stamina_modifier: 0, yield_modifier: 0 },
  { id: "basic_hat", name: "Basic Hat", type: "clothing", tier: 0, base_value: 0, description: "Your everyday hat. No mining bonuses.", stamina_modifier: 0, yield_modifier: 0 },
];

export const MINE_FLOORS = [1, 1, 3, 3, 5, 5, 7, 7, 9, 9].map((required_mining_level, i) => ({ level_number: i + 1, required_mining_level }));

const ORE_ORDER: OreId[] = ["ore_copper", "ore_iron", "ore_silver", "ore_gold", "ore_mithril"];
const WEIGHT_ROWS: number[][] = [
  [100], [100], [70, 30], [55, 45], [25, 35, 40], [15, 25, 60],
  [12, 15, 28, 45], [10, 12, 18, 60], [8, 8, 12, 27, 45], [5, 8, 10, 22, 55],
];
/** floor number -> [{ore_id, weight}] */
export const MINE_LEVEL_ORES: Record<number, { ore_id: OreId; weight: number }[]> = Object.fromEntries(
  WEIGHT_ROWS.map((row, i) => [i + 1, row.flatMap((weight, j) => { const ore_id = ORE_ORDER[j]; return ore_id ? [{ ore_id, weight }] : []; })]),
);

export const NPCS: Npc[] = [
  { id: "store_manager", name: MINING_NPC_NAME, role: `Runs ${GENERAL_STORE_NAME}; buys ore, sells pickaxes and clothing`, location: "mining_quarter", portrait_key: "portrait_store_manager" },
  { id: "saloon_bartender", name: BARTENDER_NAME, role: `Pours drinks and trades rumors at ${STARTING_SALOON_NAME}`, location: "saloon", portrait_key: "portrait_bartender" },
  { id: "saloon_prospector", name: PROSPECTOR_NAME, role: `Has worked every floor of the mine under ${HUB_CITY_NAME}; offers mining tips`, location: "saloon", portrait_key: "portrait_prospector" },
];

export const STARTER_PICKAXE_ID = "pick_rusty";
export const LOCATION_LABELS = { saloon: STARTING_SALOON_NAME, mining_quarter: MINING_QUARTER_NAME } as const;
