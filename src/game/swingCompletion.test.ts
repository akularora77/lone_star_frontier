import { afterEach, describe, expect, it, vi } from "vitest";
import { createMockService } from "./mockService";
import { waitForSwingCompletion } from "./swingCompletion";

afterEach(() => vi.useRealTimers());

describe("XP completion refresh", () => {
  it("does not unlock an early timer before the breaking swing records 10 XP and one ore", async () => {
    vi.useFakeTimers();
    let now = 0;
    const service = createMockService({ now: () => now, rng: () => 0 });
    await service.move("mine_1");
    for (let i = 0; i < 2; i++) { await service.mine_ore(1, 1); now += 2000; await service.get_player_state(); }
    await service.mine_ore(1, 1);
    now = 5999; // Browser timer wakes one millisecond before completion.
    expect((await service.get_player_state()).experience_xp).toBe(0);
    let finished = false;
    const completed = waitForSwingCompletion(service, async () => { now += 1; }).then((state) => { finished = true; return state; });
    expect(finished).toBe(false);
    const state = await completed;
    expect(state.swing_ends_at).toBeNull();
    expect(state.experience_xp).toBe(10);
    expect(state.inventory.find((row) => row.id === "ore_copper")?.quantity).toBe(1);
    expect(state.rock_spots[0]?.ore_id).toBeNull();
  });
});