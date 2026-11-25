import type { GameService } from "./api";
import { GENERAL_STORE_NAME, HUB_CITY_NAME, MINING_QUARTER_NAME } from "./gameConfig";
import * as C from "./constants";
import { CATALOG, MINE_FLOORS, MINE_LEVEL_ORES, NPCS, STARTER_PICKAXE_ID } from "./seed";
import {
  GameError, type CatalogItem, type Location, type MineLevelInfo, type NpcId,
  type OreId, type RockSpot, type PlayerState, type Quote, type StoreItem,
} from "./types";

/**
 * In-memory stand-in for the Replit backend, including SCHEMA.md mining/pricing
 * and the preview's cosmetic starter outfit. Not persisted (CONTEXT.md).
 */
export interface MockOptions { rng?: () => number; now?: () => number; catalog?: readonly CatalogItem[] }

interface PlayerRow {
  mining_level: number; experience_xp: number; health_hp: number; max_hp: number;
  stamina: number; max_stamina: number; stamina_bank_ms: number; swing_ends_at: number | null; gold: number;
  current_location: Location; current_pickaxe_id: string | null; equipped_clothing_id: string | null;
  outfit: PlayerState["equipped_outfit"];
  mastery_badge_earned: boolean;
}

interface StoredQuote extends Quote { consumed: boolean }

/** Missing ore settings are configuration errors, never silently substituted rules. */
function oreSetting(ore: CatalogItem, key: "xp_per_mine" | "base_stamina" | "base_swings" | "swing_seconds" | "respawn_seconds" | "required_mining_level" | "required_pickaxe_tier"): number {
  const value = ore[key];
  if (value === undefined) throw new GameError("INVALID_ACTION", `Missing ${key} for ${ore.name}.`);
  return value;
}

export function levelForXp(xp: number): number {
  let lvl = 1;
  C.XP_TABLE.forEach((req, i) => { if (xp >= req) lvl = i + 1; });
  return lvl;
}

export function priceBand(base: number): [number, number] {
  return [Math.round(base * C.PRICE_MIN_FACTOR), Math.round(base * C.PRICE_MAX_FACTOR)];
}

export function mockUnitPrice(base: number, action: "buy" | "sell", rapport: number): number {
  const range = C.PRICE_MAX_FACTOR - C.PRICE_MIN_FACTOR;
  const raw = action === "sell"
    ? Math.round(base * (C.PRICE_MIN_FACTOR + (range * rapport) / C.RAPPORT_MAX))
    : Math.round(base * (C.PRICE_MAX_FACTOR - (range * rapport) / C.RAPPORT_MAX));
  const [lo, hi] = priceBand(base);
  return Math.min(hi, Math.max(lo, raw));
}

export function mockRapportDelta(message: string): number {
  const m = message.toLowerCase();
  if (/\b(yell|insult|threat|threaten|stupid|idiot|shut up|hate)\b/.test(m)) return C.RAPPORT_RUDE_DELTA;
  if (/\b(thanks|thank you|please|friend|appreciate|howdy)\b/.test(m)) return C.RAPPORT_FRIENDLY_DELTA;
  return 0;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function floorOf(location: Location): number | null {
  const m = /^mine_(\d+)$/.exec(location);
  return m ? Number(m[1]) : null;
}

export function createMockService(opts: MockOptions = {}): GameService & { _debug: { setXp(xp: number): void; setGold(g: number): void; setStamina(s: number): void; addItem(id: string, q: number): void } } {
  const rng = opts.rng ?? Math.random;
  const now = opts.now ?? Date.now;
  const catalog = opts.catalog ?? CATALOG;
  const itemById = new Map(catalog.map((i) => [i.id, i]));
  const item = (id: string): CatalogItem => {
    const it = itemById.get(id);
    if (!it) throw new GameError("INVALID_ACTION", "That item doesn't exist.");
    return it;
  };
  let quoteSeq = 0;

  const p: PlayerRow = {
    mining_level: 1, experience_xp: 0, health_hp: C.STARTING_HP, max_hp: C.STARTING_HP, stamina: C.STARTING_STAMINA, max_stamina: C.STARTING_STAMINA,
    stamina_bank_ms: 0, swing_ends_at: null, gold: C.STARTING_GOLD, current_location: "saloon", current_pickaxe_id: STARTER_PICKAXE_ID,
    equipped_clothing_id: null, mastery_badge_earned: false,
    outfit: { top: "basic_top", bottom: "basic_bottom", hat: "basic_hat" },
  };
  const inv = new Map<string, number>([[STARTER_PICKAXE_ID, 1], ["basic_top", 1], ["basic_bottom", 1], ["basic_hat", 1]]);
  const rapport = new Map<NpcId, number>(NPCS.map((n) => [n.id, C.RAPPORT_START]));
  const history = new Map<NpcId, { role: "player" | "npc"; text: string }[]>();
  const quotes = new Map<string, StoredQuote>();

  const pickTier = () => (p.current_pickaxe_id ? item(p.current_pickaxe_id).tier : 0);
  const usedSlots = () => [...inv.values()].filter((q) => q > 0).length;
  const clothing = () => (p.equipped_clothing_id ? item(p.equipped_clothing_id) : null);

  interface StoredSpot { index: number; ore_id: OreId | null; swings_done: number; respawn_at: number | null }
  const floors = new Map<number, StoredSpot[]>();
  let pending: { spot: StoredSpot; ore: CatalogItem; quantity: number; needed: number; end: number; respawn: number | null } | null = null;

  function staminaCost(o: CatalogItem) {
    const pickCost = Math.max(C.MIN_PICKAXE_STAMINA, oreSetting(o, "base_stamina") - C.PICKAXE_STAMINA_RELIEF * (pickTier() - oreSetting(o, "required_pickaxe_tier")));
    return Math.max(1, Math.ceil(pickCost * (1 - Math.min(C.CLOTHING_STAMINA_CAP, clothing()?.stamina_modifier ?? 0) / 100)));
  }
  function swingsNeeded(o: CatalogItem) {
    return Math.max(1, oreSetting(o, "base_swings") - (p.mining_level - oreSetting(o, "required_mining_level")) - (pickTier() - oreSetting(o, "required_pickaxe_tier")));
  }
  function rollOre(n: number): OreId | null {
    const pool = (MINE_LEVEL_ORES[n] ?? []).filter((o) => oreUnlocked(o.ore_id));
    let roll = rng() * pool.reduce((sum, o) => sum + o.weight, 0);
    for (const o of pool) { if (roll < o.weight) return o.ore_id; roll -= o.weight; }
    return pool.at(-1)?.ore_id ?? null;
  }
  function ensureSpots(n: number) {
    let spots = floors.get(n);
    if (!spots) {
      spots = Array.from({ length: C.ROCKS_PER_FLOOR }, (_, i) => ({ index: i + 1, ore_id: rollOre(n), swings_done: 0, respawn_at: null }));
      floors.set(n, spots);
    }
    for (const spot of spots) {
      if (!spot.ore_id && (spot.respawn_at === null || now() >= spot.respawn_at)) {
        spot.ore_id = rollOre(n); spot.swings_done = 0; spot.respawn_at = null;
      }
    }
    return spots;
  }
  function finishSwing() {
    const action = pending;
    if (!action || now() < action.end) return;
    pending = null; p.swing_ends_at = null;
    action.spot.swings_done += 1;
    if (action.spot.swings_done >= action.needed) {
      inv.set(action.ore.id, (inv.get(action.ore.id) ?? 0) + action.quantity);
      addXp(oreSetting(action.ore, "xp_per_mine") * action.quantity);
      action.spot.ore_id = null; action.spot.respawn_at = action.respawn;
    }
  }
  function currentSpots(): RockSpot[] {
    const n = floorOf(p.current_location);
    if (n === null) return [];
    return ensureSpots(n).map((spot) => {
      const o = spot.ore_id ? item(spot.ore_id) : null;
      const action = pending?.spot === spot ? pending : null;
      const needed = action?.needed ?? (o ? swingsNeeded(o) : 0);
      const swingFraction = action ? clamp(1 - (action.end - now()) / (oreSetting(action.ore, "swing_seconds") * 1000), 0, 1) : 0;
      const progress = needed ? clamp((spot.swings_done + swingFraction) / needed, 0, 1) : 1;
      return { ...spot, name: o?.name ?? "Empty spot", swings_needed: needed,
        progress, progress_target: action && needed ? Math.min(1, (spot.swings_done + 1) / needed) : progress,
        swings_left: Math.max(0, needed - spot.swings_done), stamina_cost: o ? staminaCost(o) : 0,
        swing_seconds: o ? oreSetting(o, "swing_seconds") : 0, unlocked: spot.ore_id ? oreUnlocked(spot.ore_id) : false };
    });
  }

  function snapshot(): PlayerState {
    finishSwing();
    const lvl = p.mining_level;
    const pick = p.current_pickaxe_id ? item(p.current_pickaxe_id) : null;
    const cl = clothing();
    return {
      id: "mock-player", username: "Ranger",
      mining_level: lvl, experience_xp: p.experience_xp,
      xp_for_current_level: C.XP_TABLE[lvl - 1] ?? 0,
      xp_for_next_level: lvl >= C.MAX_MINING_LEVEL ? null : (C.XP_TABLE[lvl] ?? null),
      health_hp: p.health_hp, max_hp: p.max_hp, stamina: p.stamina, max_stamina: p.max_stamina,
      swing_ends_at: p.swing_ends_at, rock_spots: currentSpots(), gold: p.gold, current_location: p.current_location,
      equipped_pickaxe: pick ? { id: pick.id, name: pick.name, tier: pick.tier } : null,
      equipped_clothing: cl ? { id: cl.id, name: cl.name, stamina_modifier: cl.stamina_modifier ?? 0, yield_modifier: cl.yield_modifier ?? 0 } : null,
      equipped_outfit: { ...p.outfit }, inventory_capacity: C.INVENTORY_SLOTS,
      mastery_badge_earned: p.mastery_badge_earned,
      inventory: [...inv.entries()].filter(([, q]) => q > 0).map(([id, quantity]) => {
        const it = item(id);
        return { ...it, quantity };
      }),
      rapport: NPCS.map((n) => ({ npc_id: n.id, rapport_score: rapport.get(n.id) ?? C.RAPPORT_START })),
    };
  }

  function oreUnlocked(oreId: OreId) {
    const o = item(oreId);
    return p.mining_level >= oreSetting(o, "required_mining_level") && pickTier() >= oreSetting(o, "required_pickaxe_tier");
  }

  function addXp(xp: number) {
    p.experience_xp += xp;
    p.mining_level = levelForXp(p.experience_xp);
    if (p.mining_level >= C.MAX_MINING_LEVEL) p.mastery_badge_earned = true;
  }

  const pickaxeNameForTier = (tier: number) => catalog.find((i) => i.type === "pickaxe" && i.tier === tier)?.name ?? "better pickaxe";

  const svc = {
    async get_player_state() { return snapshot(); },

    async list_mine_levels(): Promise<MineLevelInfo[]> {
      return MINE_FLOORS.map((f) => ({
        level_number: f.level_number,
        required_mining_level: f.required_mining_level,
        locked: p.mining_level < f.required_mining_level,
        ores: (MINE_LEVEL_ORES[f.level_number] ?? []).map(({ ore_id, weight }) => {
          const o = item(ore_id);
          return {
            ore_id, name: o.name, tier: o.tier, weight, unlocked: oreUnlocked(ore_id),
            required_mining_level: oreSetting(o, "required_mining_level"), required_pickaxe_tier: oreSetting(o, "required_pickaxe_tier"),
            required_pickaxe_name: pickaxeNameForTier(oreSetting(o, "required_pickaxe_tier")),
            stamina_cost: staminaCost(o), swing_seconds: oreSetting(o, "swing_seconds"),
          };
        }),
      }));
    },

    async list_store_items(): Promise<StoreItem[]> {
      return catalog.filter((i) => !i.id.startsWith("basic_")).map((i) => ({
        id: i.id, name: i.name, type: i.type, tier: i.tier, base_value: i.base_value, description: i.description,
        owned: (inv.get(i.id) ?? 0) > 0, mode: i.type === "ore" ? "buys" : "sells",
      }));
    },

    async move(location: Location) {
      finishSwing();
      if (location === "saloon" || location === "mining_quarter") {
        pending = null; p.swing_ends_at = null;
        p.current_location = location;
        return snapshot();
      }
      const n = floorOf(location);
      const floor = n === null ? undefined : MINE_FLOORS.find((f) => f.level_number === n);
      if (!floor) throw new GameError("UNKNOWN_LOCATION", "There's no such place.");
      if (p.mining_level < floor.required_mining_level) {
        throw new GameError("LEVEL_LOCKED", `Requires Mining Level ${floor.required_mining_level}.`);
      }
      pending = null; p.swing_ends_at = null;
      p.current_location = location;
      ensureSpots(floor.level_number);
      return snapshot();
    },

    async tick(elapsed_ms: number) {
      p.stamina_bank_ms += Math.max(0, Math.floor(elapsed_ms));
      const sec = Math.floor(p.stamina_bank_ms / 1000);
      p.stamina_bank_ms -= sec * 1000;
      p.stamina = clamp(p.stamina + C.STAMINA_REGEN_PER_SEC * sec, 0, p.max_stamina);
      return snapshot();
    },

    async mine_ore(mine_level: number, spot_index: number) {
      finishSwing();
      const floor = MINE_FLOORS.find((f) => f.level_number === mine_level);
      if (!floor) throw new GameError("UNKNOWN_LOCATION", "There's no such floor.");
      if (p.current_location !== `mine_${mine_level}`) throw new GameError("WRONG_LOCATION", "You need to stand on that floor first.");
      if (p.mining_level < floor.required_mining_level) throw new GameError("LEVEL_LOCKED", `Requires Mining Level ${floor.required_mining_level}.`);
      if (pending) throw new GameError("SWING_IN_PROGRESS", "Your swing is still in progress.");
      if (!p.current_pickaxe_id) throw new GameError("NO_PICKAXE", "You need a pickaxe equipped.");
      if (!Number.isInteger(spot_index) || spot_index < 1 || spot_index > C.ROCKS_PER_FLOOR) throw new GameError("INVALID_ACTION", "Choose a rock spot from 1 to 3.");
      const spot = ensureSpots(mine_level).find((x) => x.index === spot_index);
      if (!spot?.ore_id) throw new GameError("ROCK_DEPLETED", "That spot is still empty.");
      if (!oreUnlocked(spot.ore_id)) throw new GameError("NO_PICKAXE", "Equip a pickaxe that can mine this rock.");
      const ore = item(spot.ore_id);
      const cost = staminaCost(ore);
      if (p.stamina < cost) throw new GameError("NOT_ENOUGH_STAMINA", `You need ${cost} stamina to swing. Catch your breath.`);
      const needed = swingsNeeded(ore);
      const breaking = spot.swings_done + 1 >= needed;
      const have = inv.get(ore.id) ?? 0;
      if (breaking && ((have === 0 && usedSlots() >= C.INVENTORY_SLOTS) || have >= C.ORE_STACK_CAP)) throw new GameError("INVENTORY_FULL", "Your pack is full. Sell something first.");
      const yieldMod = Math.min(C.CLOTHING_YIELD_CAP, clothing()?.yield_modifier ?? 0);
      const qty = breaking ? Math.min(1 + (yieldMod > 0 && rng() * 100 < yieldMod ? 1 : 0), C.ORE_STACK_CAP - have) : 0;
      const end = now() + oreSetting(ore, "swing_seconds") * 1000;
      const respawn = breaking ? end + oreSetting(ore, "respawn_seconds") * 1000 : null;
      p.stamina -= cost; p.swing_ends_at = end;
      pending = { spot, ore, quantity: qty, needed, end, respawn };
      return { ore_id: spot.ore_id, quantity: qty, xp_gained: oreSetting(ore, "xp_per_mine") * qty,
        stamina_spent: cost, swings_done: spot.swings_done + 1, swings_needed: needed,
        swing_ends_at: end, respawn_at: respawn, mining_level: p.mining_level, mastery_badge_earned: p.mastery_badge_earned };
    },

    async equip_item(item_id: string) {
      if ((inv.get(item_id) ?? 0) <= 0) throw new GameError("NOT_OWNED", "You don't own that.");
      const it = item(item_id);
      if (it.type === "pickaxe") p.current_pickaxe_id = it.id;
      else if (it.id === "basic_bottom") p.outfit.bottom = it.id;
      else if (it.id === "basic_hat") p.outfit.hat = it.id;
      else if (it.type === "clothing") { p.outfit.top = it.id; p.equipped_clothing_id = it.id === "basic_top" ? null : it.id; }
      else throw new GameError("INVALID_ACTION", "You can't equip ore.");
      return snapshot();
    },

    async unequip_item(item_id: string) {
      if ((inv.get(item_id) ?? 0) <= 0) throw new GameError("NOT_OWNED", "You don't own that.");
      const it = item(item_id);
      if (it.type !== "clothing") throw new GameError("INVALID_ACTION", "Only clothing can be removed.");
      for (const slot of ["top", "bottom", "hat"] as const) {
        if (p.outfit[slot] === item_id) p.outfit[slot] = null;
      }
      if (p.equipped_clothing_id === item_id) p.equipped_clothing_id = null;
      return snapshot();
    },

    async talk_to_npc(npc_id: NpcId, message: string) {
      const npc = NPCS.find((n) => n.id === npc_id);
      if (!npc) throw new GameError("UNKNOWN_NPC", "Nobody by that name around here.");
      if (npc.location !== p.current_location) throw new GameError("WRONG_LOCATION", `${npc.name} isn't here.`);
      const delta = clamp(mockRapportDelta(message), C.RAPPORT_DELTA_MIN, C.RAPPORT_DELTA_MAX);
      const score = clamp((rapport.get(npc_id) ?? C.RAPPORT_START) + delta, C.RAPPORT_MIN, C.RAPPORT_MAX);
      rapport.set(npc_id, score);
      const reply = mockReply(npc_id, message, delta, rng);
      const h = history.get(npc_id) ?? [];
      h.push({ role: "player", text: message }, { role: "npc", text: reply });
      history.set(npc_id, h.slice(-C.CHAT_HISTORY_LIMIT));
      return { reply, rapport_delta: delta, rapport_score: score };
    },

    async get_store_quote(item_id: string, action_type: "buy" | "sell", quantity: number) {
      const it = item(item_id);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > C.ORE_STACK_CAP) throw new GameError("INVALID_QUANTITY", "That's not a sensible quantity.");
      const owned = inv.get(item_id) ?? 0;
      if (action_type === "sell") {
        if (it.type !== "ore") throw new GameError("INVALID_ACTION", "The store only buys ore.");
        if (quantity > owned) throw new GameError("INSUFFICIENT_ITEMS", "You don't have that many.");
      } else {
        if (it.type === "ore") throw new GameError("INVALID_ACTION", "The store doesn't sell ore.");
        if (quantity !== 1) throw new GameError("INVALID_QUANTITY", "Gear is sold one at a time.");
        if (owned > 0) throw new GameError("ALREADY_OWNED", "You already own that.");
      }
      const unit = mockUnitPrice(it.base_value, action_type, rapport.get("store_manager") ?? C.RAPPORT_START);
      const total = unit * quantity;
      if (action_type === "buy" && total > p.gold) throw new GameError("INSUFFICIENT_GOLD", `That's ${total} gold; you have ${p.gold}.`);
      const q: StoredQuote = {
        quote_id: `q_${++quoteSeq}`, item_id, action_type, unit_price: unit, quantity, total_price: total,
        expires_at: now() + C.QUOTE_TTL_SECONDS * 1000, consumed: false,
      };
      quotes.set(q.quote_id, q);
      const { consumed: _c, ...pub } = q;
      return pub;
    },

    async execute_trade(quote_id: string) {
      const q = quotes.get(quote_id);
      if (!q || q.consumed) throw new GameError("QUOTE_NOT_FOUND", "That offer's no longer on the table.");
      if (now() > q.expires_at) throw new GameError("QUOTE_EXPIRED", "That offer has expired. Ask for a fresh quote.");
      const owned = inv.get(q.item_id) ?? 0;
      if (q.action_type === "buy") {
        if (owned > 0) throw new GameError("ALREADY_OWNED", "You already own that.");
        if (p.gold < q.total_price) throw new GameError("INSUFFICIENT_GOLD", "You can't cover that.");
        if (usedSlots() >= C.INVENTORY_SLOTS) throw new GameError("INVENTORY_FULL", "Your pack is full.");
        p.gold -= q.total_price;
        inv.set(q.item_id, 1);
      } else {
        if (owned < q.quantity) throw new GameError("INSUFFICIENT_ITEMS", "You don't have that many anymore.");
        p.gold += q.total_price;
        const left = owned - q.quantity;
        if (left > 0) inv.set(q.item_id, left); else inv.delete(q.item_id);
        if (left === 0 && p.current_pickaxe_id === q.item_id) p.current_pickaxe_id = null;
        if (left === 0 && p.equipped_clothing_id === q.item_id) p.equipped_clothing_id = null;
      }
      q.consumed = true;
      return snapshot();
    },

    _debug: {
      setXp(xp: number) { p.experience_xp = 0; addXp(xp); },
      setGold(g: number) { p.gold = g; },
      setStamina(s: number) { p.stamina = s; },
      addItem(id: string, q: number) { inv.set(id, (inv.get(id) ?? 0) + q); },
    },
  };
  return svc;
}

function pick<T>(arr: readonly T[], rng: () => number): T {
  const value = arr[Math.floor(rng() * arr.length) % arr.length];
  if (value === undefined) throw new Error("Empty reply list");
  return value;
}

/** Canned Wild West replies, grounded in the v1.0 world only. */
function mockReply(npc: NpcId, message: string, delta: number, rng: () => number): string {
  if (delta < 0) {
    return pick([
      "Easy there, partner. Keep that tone and you'll find this town a mite colder.",
      "Talk to me like that again and we're gonna have words.",
      "I'll pretend I didn't hear that. Once.",
    ], rng);
  }
  const m = message.toLowerCase();
  const thanks = delta > 0 ? "Well, ain't you polite. " : "";
  if (npc === "store_manager") {
    if (/(price|sell|buy|deal|trade|cost)/.test(m)) return thanks + "Prices move with the company you keep, friend. Treat me square and I'll treat you square.";
    if (/(pickaxe|pick|tool)/.test(m)) return thanks + "Each pickaxe opens a new ore. Iron for Pecos Iron, Steel for Brazos Silver, on up to the Masterwork.";
    if (/(cloth|bandana|vest|duster|wear)/.test(m)) return thanks + "A bandana saves your wind, a vest fills your pockets. The duster does a bit of both.";
    return thanks + pick([
      "Bring me ore and I'll bring you gold. Simple as that.",
      "Copper's cheap, but it adds up. Gold's another story entirely.",
      "Folks who chat a while tend to get a better deal. Just sayin'.",
    ], rng);
  }
  if (npc === "saloon_prospector") {
    if (/(mithril|quartz|deep|bottom|ten|10)/.test(m)) return thanks + "Bluebonnet Quartz, the locals call it. Lone Star Mithril on paper. Only shows on floors nine and ten, and only for a Masterwork pick.";
    if (/(gold|alamo)/.test(m)) return thanks + "Alamo Gold starts showin' on floor seven. You'll want a Reinforced Pickaxe and Mining Level 7.";
    if (/(silver|brazos)/.test(m)) return thanks + "Brazos Silver glints from floor five down. Steel pick, Mining Level 5.";
    if (/(stamina|tired|run|breath)/.test(m)) return thanks + "Standing, talking, or walking restores your wind, even underground. Each swing spends stamina.";
    return thanks + pick([
      "Deeper floors open as your Mining Level climbs. The good ore needs a better pick, though.",
      "Common copper still turns up deep down. Don't curse it, it's still coin.",
      "Reach Mining Level 10 and you'll earn the badge every miner in these parts dreams of.",
    ], rng);
  }
  return thanks + pick([
    `Welcome to ${HUB_CITY_NAME}, stranger. That rusty pick ain't much, but every miner starts somewhere.`,
    `Head to the ${MINING_QUARTER_NAME} when you're ready. ${GENERAL_STORE_NAME} and the mine both sit there.`,
    "The old prospector in the corner knows the mine better than anyone. Buy him a sarsaparilla.",
    "Quiet night. Just miners, dust, and the price of copper.",
  ], rng);
}
