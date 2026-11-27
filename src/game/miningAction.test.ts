import { describe, expect, it } from "vitest";
import { createMockService } from "./mockService";
import { mineRockToCompletion } from "./miningAction";

describe("one selection mines a whole rock", () => {
  it("records ore and XP for a second rock without an extra selection", async () => {
    let now = 0;
    const service = createMockService({ rng: () => 0, now: () => now });
    await service.move("mine_1");
    const sleep = async () => { now += 250; };
    service._debug.setPosition(4, 3);
    await mineRockToCompletion(service, 1, 1, () => {}, sleep);
    expect((await service.get_player_state()).experience_xp).toBe(10);
    service._debug.setPosition(8, 2);
    const result = await mineRockToCompletion(service, 1, 2, () => {}, sleep);
    const state = await service.get_player_state();
    expect(result?.quantity).toBe(1);
    expect(state.experience_xp).toBe(20);
    expect(state.inventory.filter((row) => row.id === "ore_copper")).toHaveLength(2);
    expect(state.rock_spots[1]?.ore_id).toBeNull();
    expect(state.swing_ends_at).toBeNull();
  });
  it("stops and returns nothing when the player walks away mid-rock", async () => {
    let now = 0;
    const service = createMockService({ rng: () => 0, now: () => now });
    await service.move("mine_1");
    service._debug.setPosition(4, 3);
    let walked = false;
    const sleep = async () => { now += 500; if (!walked) { walked = true; await service.tick(400); await service.set_position(4, 4); } };
    const result = await mineRockToCompletion(service, 1, 1, () => {}, sleep, () => walked);
    const state = await service.get_player_state();
    expect(result).toBeNull();
    expect(state.experience_xp).toBe(0);
    expect(state.rock_spots[0]?.swings_done).toBe(0);
  });
});
