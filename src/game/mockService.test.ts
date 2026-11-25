import { describe, expect, it } from "vitest";
import { createMockService, mockUnitPrice, priceBand } from "./mockService";
import { GameError } from "./types";
import { CATALOG, MINE_FLOORS, MINE_LEVEL_ORES } from "./seed";
import { INVENTORY_SLOTS, XP_TABLE } from "./constants";
import { levelForXp } from "./mockService";

const fixed = (v: number) => () => v;

async function code(p: Promise<unknown>) {
  try { await p; return null; } catch (e) { return (e as GameError).code; }
}

describe("store pricing", () => {
  it("stays inside the 0.7x-1.3x band at every rapport", () => {
    for (const base of [5, 12, 30, 70, 150, 2000]) {
      const [lo, hi] = priceBand(base);
      for (let r = 0; r <= 100; r += 5) {
        for (const a of ["buy", "sell"] as const) {
          const p = mockUnitPrice(base, a, r);
          expect(p).toBeGreaterThanOrEqual(lo);
          expect(p).toBeLessThanOrEqual(hi);
        }
      }
    }
  });
  it("moves in the player's favor as rapport rises", () => {
    expect(mockUnitPrice(100, "sell", 100)).toBeGreaterThan(mockUnitPrice(100, "sell", 0));
    expect(mockUnitPrice(100, "buy", 100)).toBeLessThan(mockUnitPrice(100, "buy", 0));
    expect(mockUnitPrice(100, "buy", 50)).toBe(100);
  });
});

function clocked(rng = fixed(0)) {
  let time = 0;
  const service = createMockService({ rng, now: () => time });
  return { service, async advance(ms: number) { time += ms; return service.get_player_state(); } };
}

describe("updated seed rules", () => {
  it("uses the ten cumulative XP thresholds", () => {
    expect([...XP_TABLE]).toEqual([0, 100, 250, 730, 1330, 2680, 4255, 7455, 11055, 18055]);
    XP_TABLE.forEach((xp, i) => { expect(levelForXp(xp)).toBe(i + 1); if (xp > 0) expect(levelForXp(xp - 1)).toBe(i); });
  });
  it("uses the updated floor entry requirements", () => {
    expect(MINE_FLOORS.map((f) => f.required_mining_level)).toEqual([1, 1, 3, 3, 5, 5, 7, 7, 9, 9]);
  });
  it.each([
    [1, [100]], [2, [100]], [3, [70, 30]], [4, [55, 45]], [5, [25, 35, 40]],
    [6, [15, 25, 60]], [7, [12, 15, 28, 45]], [8, [10, 12, 18, 60]],
    [9, [8, 8, 12, 27, 45]], [10, [5, 8, 10, 22, 55]],
  ])("uses floor %i ore weights", (floor, weights) => {
    expect(MINE_LEVEL_ORES[Number(floor)]?.map((o) => o.weight)).toEqual(weights);
  });
});

describe("floors and persistent mining", () => {
  it("tracks whole-rock progress across three swings without resetting at each swing", async () => {
    const { service: s, advance } = clocked();
    await s.move("mine_1");
    expect((await s.get_player_state()).rock_spots[0]?.progress).toBe(0);
    for (let i = 0; i < 3; i++) {
      await s.mine_ore(1, 1);
      expect((await s.get_player_state()).rock_spots[0]?.progress_target).toBeCloseTo((i + 1) / 3);
      expect((await advance(1000)).rock_spots[0]?.progress).toBeCloseTo((i + 0.5) / 3);
      expect((await advance(1000)).rock_spots[0]?.progress).toBeCloseTo((i + 1) / 3);
    }
    expect((await s.get_player_state()).experience_xp).toBe(10);
  });
  it("reads configurable XP and rock reset timing rather than baked-in defaults", async () => {
    let now = 0;
    const catalog = CATALOG.map((item) => item.id === "ore_copper" ? { ...item, xp_per_mine: 77, swing_seconds: 0.25, base_swings: 1, respawn_seconds: 3 } : item);
    const s = createMockService({ catalog, rng: fixed(0), now: () => now });
    await s.move("mine_1");
    const result = await s.mine_ore(1, 1);
    expect(result.swing_ends_at).toBe(250);
    expect(result.respawn_at).toBe(3250);
    now = 249;
    expect((await s.get_player_state()).experience_xp).toBe(0);
    now = 250;
    expect((await s.get_player_state()).experience_xp).toBe(77);
    now = 3249;
    expect((await s.get_player_state()).rock_spots[0]?.ore_id).toBeNull();
    now = 3250;
    expect((await s.get_player_state()).rock_spots[0]?.ore_id).toBe("ore_copper");
  });
  it("refuses a locked floor and requires standing on the floor", async () => {
    const s = createMockService();
    expect(await code(s.move("mine_3"))).toBe("LEVEL_LOCKED");
    expect(await code(s.move("mine_99"))).toBe("UNKNOWN_LOCATION");
    expect(await code(s.mine_ore(1, 1))).toBe("WRONG_LOCATION");
    expect((await s.get_player_state()).current_location).toBe("saloon");
  });
  it("creates exactly 3 spots using only unlocked ores", async () => {
    const s = createMockService({ rng: fixed(0.99) });
    s._debug.setXp(1330);
    const state = await s.move("mine_5");
    expect(state.rock_spots).toHaveLength(3);
    expect(state.rock_spots.map((r) => r.index)).toEqual([1, 2, 3]);
    expect(state.rock_spots.every((r) => r.ore_id === "ore_copper")).toBe(true);
  });
  it("takes 3 two-second copper swings, awards only on completion, then stays empty for 10s", async () => {
    const { service: s, advance } = clocked();
    await s.move("mine_1");
    for (let i = 1; i <= 3; i++) {
      const result = await s.mine_ore(1, 1);
      expect(result.swings_done).toBe(i);
      expect(result.swings_needed).toBe(3);
      expect(result.quantity).toBe(i === 3 ? 1 : 0);
      const before = await advance(1999);
      expect(before.experience_xp).toBe(0);
      expect(before.rock_spots[0]?.ore_id).toBe("ore_copper");
      const landed = await advance(1);
      expect(landed.experience_xp).toBe(i === 3 ? 10 : 0);
      expect(landed.rock_spots[0]?.swings_left).toBe(i === 3 ? 0 : 3 - i);
    }
    expect((await s.get_player_state()).inventory.find((i) => i.id === "ore_copper")?.quantity).toBe(1);
    expect(await code(s.mine_ore(1, 1))).toBe("ROCK_DEPLETED");
    expect((await advance(9999)).rock_spots[0]?.ore_id).toBeNull();
    expect((await advance(1)).rock_spots[0]?.ore_id).toBe("ore_copper");
    expect((await s.get_player_state()).rock_spots[0]?.swings_left).toBe(3);
  });
  it.each([
    ["ore_copper", 1, "pick_rusty", 0, 3, 2, 10, 6, 10],
    ["ore_iron", 3, "pick_iron", 250, 4, 2.5, 15, 8, 24],
    ["ore_silver", 5, "pick_steel", 1330, 5, 3, 20, 10, 45],
    ["ore_gold", 7, "pick_reinforced", 4255, 6, 3.5, 30, 12, 80],
    ["ore_mithril", 9, "pick_masterwork", 11055, 8, 4, 45, 14, 140],
  ] as const)("enforces %s swing, stamina, XP and respawn values", async (id, floor, pick, xp, count, seconds, respawn, cost, reward) => {
    const { service: s, advance } = clocked(fixed(0.99));
    s._debug.setXp(xp); s._debug.addItem(pick, 1); await s.equip_item(pick);
    const st = await s.move(`mine_${floor}`);
    expect(st.rock_spots[0]?.ore_id).toBe(id);
    expect(st.rock_spots[0]?.swings_needed).toBe(count);
    for (let i = 0; i < count; i++) {
      s._debug.setStamina(100);
      const r = await s.mine_ore(floor, 1);
      expect(r.stamina_spent).toBe(cost);
      expect(r.xp_gained).toBe(i === count - 1 ? reward : 0);
      expect(r.swing_ends_at).toBe((i + 1) * seconds * 1000);
      if (i === count - 1) expect(r.respawn_at).toBe(r.swing_ends_at + respawn * 1000);
      await advance(seconds * 1000);
    }
    expect((await advance(respawn * 1000 - 1)).rock_spots[0]?.ore_id).toBeNull();
    expect((await advance(1)).rock_spots[0]?.ore_id).toBe(id);
  });
  it("ignores extra swings without spending stamina or changing a different rock", async () => {
    const { service: s } = clocked();
    await s.move("mine_1"); await s.mine_ore(1, 1);
    const before = await s.get_player_state();
    expect(await code(s.mine_ore(1, 2))).toBe("SWING_IN_PROGRESS");
    expect(await s.get_player_state()).toEqual(before);
  });
  it("keeps depleted spots and partial swings when leaving and returning", async () => {
    const { service: s, advance } = clocked();
    s._debug.setXp(250); // copper needs one swing at Mining 3
    await s.move("mine_1"); await s.mine_ore(1, 1); await advance(2000);
    await s.move("mining_quarter");
    expect((await s.move("mine_1")).rock_spots[0]?.ore_id).toBeNull();
    await advance(10000);
    expect((await s.get_player_state()).rock_spots[0]?.ore_id).toBe("ore_copper");
  });
  it("reduces iron from 4 swings at Mining 3 to 2 at Mining 5", async () => {
    const s = createMockService({ rng: fixed(0.99) });
    s._debug.setXp(250); s._debug.addItem("pick_iron", 1); await s.equip_item("pick_iron");
    expect((await s.move("mine_3")).rock_spots[0]?.swings_needed).toBe(4);
    s._debug.setXp(1330);
    expect((await s.get_player_state()).rock_spots[0]?.swings_needed).toBe(2);
    s._debug.addItem("pick_steel", 1); await s.equip_item("pick_steel");
    expect((await s.get_player_state()).rock_spots[0]?.swings_needed).toBe(1);
    s._debug.addItem("pick_masterwork", 1); await s.equip_item("pick_masterwork");
    expect((await s.get_player_state()).rock_spots[0]?.swings_needed).toBe(1);
  });
  it("uses ore stamina and pickaxe relief with a minimum of 4 before clothing", async () => {
    const s = createMockService();
    await s.move("mine_1");
    expect((await s.get_player_state()).rock_spots[0]?.stamina_cost).toBe(6);
    s._debug.addItem("pick_iron", 1); await s.equip_item("pick_iron");
    expect((await s.get_player_state()).rock_spots[0]?.stamina_cost).toBe(4);
    s._debug.addItem("pick_masterwork", 1); await s.equip_item("pick_masterwork");
    expect((await s.get_player_state()).rock_spots[0]?.stamina_cost).toBe(4);
    s._debug.addItem("cloth_duster", 1); await s.equip_item("cloth_duster");
    expect((await s.get_player_state()).rock_spots[0]?.stamina_cost).toBe(4); // ceil(4 * .8)
  });
  it("spends no stamina or progress when stamina is insufficient", async () => {
    const s = createMockService(); await s.move("mine_1"); s._debug.setStamina(5);
    const before = await s.get_player_state();
    expect(await code(s.mine_ore(1, 1))).toBe("NOT_ENOUGH_STAMINA");
    expect(await s.get_player_state()).toEqual(before);
  });
  it("multiplies XP by the bonus ore quantity", async () => {
    const { service: s, advance } = clocked();
    s._debug.setXp(250); s._debug.addItem("cloth_vest", 1); await s.equip_item("cloth_vest");
    await s.move("mine_1");
    const r = await s.mine_ore(1, 1);
    expect(r.quantity).toBe(2); expect(r.xp_gained).toBe(20);
    expect((await advance(2000)).experience_xp).toBe(270);
  });
  it("awards the permanent badge when total XP reaches 18055", async () => {
    const { service: s, advance } = clocked();
    s._debug.setXp(18045); await s.move("mine_1"); await s.mine_ore(1, 1);
    const landed = await advance(2000);
    expect(landed.experience_xp).toBe(18055); expect(landed.mining_level).toBe(10);
    expect(landed.mastery_badge_earned).toBe(true); expect(landed.xp_for_next_level).toBeNull();
  });
});

describe("stamina tick", () => {
  it("restores 2 per complete second, banking fractional ticks and clamping at 100", async () => {
    const s = createMockService(); s._debug.setStamina(50);
    expect((await s.tick(500)).stamina).toBe(50);
    expect((await s.tick(500)).stamina).toBe(52);
    expect((await s.tick(1000)).stamina).toBe(54);
    expect((await s.tick(60000)).stamina).toBe(100);
  });
  it("restores stamina while talking and underground, without reducing HP", async () => {
    const s = createMockService(); s._debug.setStamina(50);
    await s.talk_to_npc("saloon_bartender", "thanks");
    expect((await s.tick(1000)).stamina).toBe(52);
    await s.move("mine_1");
    const st = await s.tick(1000);
    expect(st.stamina).toBe(54); expect(st.health_hp).toBe(100);
  });
});

describe("trading", () => {
  it("halves capacity to 14 and enforces it for both gear purchases and new ore stacks", async () => {
    const s = createMockService();
    expect(INVENTORY_SLOTS).toBe(14);
    expect((await s.get_player_state()).inventory_capacity).toBe(14);
    for (const item of CATALOG.filter((row) => !["pick_rusty", "basic_top", "basic_bottom", "basic_hat", "ore_copper", "cloth_duster"].includes(row.id))) s._debug.addItem(item.id, 1);
    expect((await s.get_player_state()).inventory).toHaveLength(14);
    s._debug.setGold(1000);
    const q = await s.get_store_quote("cloth_duster", "buy", 1);
    expect(await code(s.execute_trade(q.quote_id))).toBe("INVENTORY_FULL");
    s._debug.setXp(250);
    await s.move("mine_1");
    expect(await code(s.mine_ore(1, 1))).toBe("INVENTORY_FULL");
    expect((await s.get_player_state()).inventory).toHaveLength(14);
  });
  it("allows existing ore stacks to grow within a full 14-slot inventory", async () => {
    const { service: s, advance } = clocked();
    for (const item of CATALOG.filter((row) => !["pick_rusty", "basic_top", "basic_bottom", "basic_hat", "ore_iron", "cloth_duster"].includes(row.id))) s._debug.addItem(item.id, 1);
    expect((await s.get_player_state()).inventory).toHaveLength(14);
    s._debug.setXp(250); await s.move("mine_1"); await s.mine_ore(1, 1);
    const state = await advance(2000);
    expect(state.inventory).toHaveLength(14);
    expect(state.inventory.find((row) => row.id === "ore_copper")?.quantity).toBe(2);
  });
  it.each([["basic_top", "top"], ["basic_bottom", "bottom"], ["basic_hat", "hat"]] as const)("removes and re-equips %s without deleting it from inventory", async (id, slot) => {
    const s = createMockService();
    const removed = await s.unequip_item(id);
    expect(removed.equipped_outfit[slot]).toBeNull();
    expect(removed.inventory.find((row) => row.id === id)?.quantity).toBe(1);
    const restored = await s.equip_item(id);
    expect(restored.equipped_outfit[slot]).toBe(id);
  });
  it("removes upgraded clothing bonuses and supplies its catalog stats in inventory", async () => {
    const s = createMockService(); s._debug.addItem("cloth_bandana", 1);
    await s.equip_item("cloth_bandana");
    const removed = await s.unequip_item("cloth_bandana");
    expect(removed.equipped_outfit.top).toBeNull();
    expect(removed.equipped_clothing).toBeNull();
    const bandana = removed.inventory.find((row) => row.id === "cloth_bandana");
    expect(bandana?.stamina_modifier).toBe(10);
    expect(bandana?.yield_modifier).toBe(0);
    expect((await s.equip_item("cloth_bandana")).equipped_clothing?.stamina_modifier).toBe(10);
  });
  it("starts with an equipped basic top, bottom and hat without mining bonuses", async () => {
    const s = createMockService();
    const state = await s.get_player_state();
    expect(state.equipped_outfit).toEqual({ top: "basic_top", bottom: "basic_bottom", hat: "basic_hat" });
    for (const id of ["basic_top", "basic_bottom", "basic_hat"]) expect(state.inventory.find((row) => row.id === id)?.quantity).toBe(1);
    expect(state.equipped_clothing).toBeNull();
    expect((await s.list_store_items()).some((row) => row.id.startsWith("basic_"))).toBe(false);
  });
  it("equips purchased clothing over the basic top while keeping trousers and hat", async () => {
    const s = createMockService();
    s._debug.setGold(100);
    const q = await s.get_store_quote("cloth_bandana", "buy", 1);
    await s.execute_trade(q.quote_id);
    const dressed = await s.equip_item("cloth_bandana");
    expect(dressed.equipped_outfit).toEqual({ top: "cloth_bandana", bottom: "basic_bottom", hat: "basic_hat" });
    expect(dressed.equipped_clothing?.stamina_modifier).toBe(10);
    const basic = await s.equip_item("basic_top");
    expect(basic.equipped_outfit.top).toBe("basic_top");
    expect(basic.equipped_clothing).toBeNull();
  });
  it("sells ore for the quoted total and consumes the quote", async () => {
    const s = createMockService();
    s._debug.addItem("ore_copper", 10);
    const q = await s.get_store_quote("ore_copper", "sell", 10);
    expect(q.total_price).toBe(q.unit_price * 10);
    const st = await s.execute_trade(q.quote_id);
    expect(st.gold).toBe(50 + q.total_price);
    expect(st.inventory.find((i) => i.id === "ore_copper")).toBeUndefined();
    expect(await code(s.execute_trade(q.quote_id))).toBe("QUOTE_NOT_FOUND");
  });
  it("rejects an expired quote", async () => {
    let t = 0;
    const s = createMockService({ now: () => t });
    s._debug.addItem("ore_copper", 1);
    const q = await s.get_store_quote("ore_copper", "sell", 1);
    t = 61_000;
    expect(await code(s.execute_trade(q.quote_id))).toBe("QUOTE_EXPIRED");
  });
  it("blocks buying without gold, owned gear, and invalid actions", async () => {
    const s = createMockService();
    expect(await code(s.get_store_quote("pick_iron", "buy", 1))).toBe("INSUFFICIENT_GOLD");
    expect(await code(s.get_store_quote("pick_rusty", "buy", 1))).toBe("ALREADY_OWNED");
    expect(await code(s.get_store_quote("pick_rusty", "sell", 1))).toBe("INVALID_ACTION");
    expect(await code(s.get_store_quote("ore_copper", "buy", 1))).toBe("INVALID_ACTION");
    expect(await code(s.get_store_quote("ore_copper", "sell", 1))).toBe("INSUFFICIENT_ITEMS");
  });
  it("buys gear and deducts gold", async () => {
    const s = createMockService();
    s._debug.setGold(500);
    const q = await s.get_store_quote("pick_iron", "buy", 1);
    const st = await s.execute_trade(q.quote_id);
    expect(st.gold).toBe(500 - q.total_price);
    expect(st.inventory.some((i) => i.id === "pick_iron")).toBe(true);
  });
});

describe("rapport", () => {
  it("clamps deltas and the score, and needs the NPC to be present", async () => {
    const s = createMockService();
    expect(await code(s.talk_to_npc("store_manager", "hi"))).toBe("WRONG_LOCATION");
    let last = 50;
    for (let i = 0; i < 40; i++) {
      const r = await s.talk_to_npc("saloon_bartender", "thanks friend");
      expect(r.rapport_delta).toBeLessThanOrEqual(5);
      last = r.rapport_score;
    }
    expect(last).toBe(100);
    const bad = await s.talk_to_npc("saloon_bartender", "you idiot, I insult you");
    expect(bad.rapport_delta).toBeLessThan(0);
    expect(bad.rapport_delta).toBeGreaterThanOrEqual(-5);
  });
});
