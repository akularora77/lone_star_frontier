import type { GameService } from "./api";
import type { MineResult, PlayerState } from "./types";
import { waitForSwingCompletion } from "./swingCompletion";

/** One rock selection continues service-controlled swings until its reward is recorded. */
export async function mineRockToCompletion(
  service: Pick<GameService, "mine_ore" | "get_player_state">,
  floor: number,
  spot: number,
  onSnapshot: (state: PlayerState) => void,
  sleep?: (ms: number) => Promise<void>,
): Promise<MineResult> {
  while (true) {
    const result = await service.mine_ore(floor, spot);
    onSnapshot(await service.get_player_state());
    const completed = await waitForSwingCompletion(service, sleep);
    onSnapshot(completed);
    if (result.quantity > 0) return result;
    if (completed.current_location !== `mine_${floor}` || !completed.rock_spots.find((rock) => rock.index === spot)?.ore_id) {
      return result;
    }
  }
}