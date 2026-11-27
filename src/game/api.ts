import type { Location, MineLevelInfo, MineResult, NpcId, PlayerState, Quote, StoreItem, TalkResult } from "./types";

/**
 * Client seam mirroring the SCHEMA.md tool contracts. Components call only this interface.
 * Failures reject with a GameError ({ code, message }).
 */
export interface GameService {
  get_player_state(): Promise<PlayerState>;
  list_mine_levels(): Promise<MineLevelInfo[]>;
  list_store_items(): Promise<StoreItem[]>;
  move(location: Location): Promise<PlayerState>;
  tick(elapsed_ms: number): Promise<PlayerState>;
  set_position(x: number, y: number): Promise<PlayerState>;
  mine_ore(mine_level: number, spot_index: number): Promise<MineResult>;
  equip_item(item_id: string): Promise<PlayerState>;
  unequip_item(item_id: string): Promise<PlayerState>;
  talk_to_npc(npc_id: NpcId, message: string): Promise<TalkResult>;
  get_store_quote(item_id: string, action_type: "buy" | "sell", quantity: number): Promise<Quote>;
  execute_trade(quote_id: string): Promise<PlayerState>;
}

let instance: GameService | null = null;

/** Chooses the implementation. Today: in-memory mock. Later: an HTTP client for the Replit API. */
export async function getGameService(): Promise<GameService> {
  if (!instance) {
    const { createMockService } = await import("./mockService");
    instance = createMockService();
  }
  return instance;
}
