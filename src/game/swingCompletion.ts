import type { GameService } from "./api";
import type { PlayerState } from "./types";

/** Timers can wake early; keep the action locked until the service confirms it landed. */
export async function waitForSwingCompletion(
  service: Pick<GameService, "get_player_state">,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
): Promise<PlayerState> {
  let state = await service.get_player_state();
  while (state.swing_ends_at !== null) {
    await sleep(Math.max(16, Math.min(250, state.swing_ends_at - Date.now())));
    state = await service.get_player_state();
  }
  return state;
}