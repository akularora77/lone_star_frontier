import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as gameApi from "@/game/api";
import { GameProvider } from "@/game/GameProvider";
import { createMockService } from "@/game/mockService";
import { Sidebar } from "./Sidebar";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("inventory clothing activation", () => {
  it.each([
    ["basic_top", "Basic Shirt", "top"],
    ["basic_bottom", "Basic Trousers", "bottom"],
    ["basic_hat", "Basic Hat", "hat"],
    ["cloth_bandana", "Worn Bandana", "top"],
    ["cloth_vest", "Prospector's Vest", "top"],
    ["cloth_duster", "Trail Duster", "top"],
  ] as const)("a click removes %s and the next click re-equips it", async (id, name, slot) => {
    const service = createMockService();
    if (id.startsWith("cloth_")) service._debug.addItem(id, 1);
    await service.equip_item(id);
    vi.spyOn(gameApi, "getGameService").mockResolvedValue(service);
    render(<GameProvider><Sidebar /></GameProvider>);

    fireEvent.click(await screen.findByRole("button", { name: `${name}, equipped` }));
    await waitFor(async () => expect((await service.get_player_state()).equipped_outfit[slot]).toBeNull());
    expect((await service.get_player_state()).inventory.find((row) => row.id === id)?.quantity).toBe(1);

    fireEvent.click(await screen.findByRole("button", { name }));
    await waitFor(async () => expect((await service.get_player_state()).equipped_outfit[slot]).toBe(id));
  });
});