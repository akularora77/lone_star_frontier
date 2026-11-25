import { useGame } from "@/game/GameProvider";
import { HUB_CITY_NAME, MINE_NAME, MINING_QUARTER_NAME, STARTING_SALOON_NAME } from "@/game/gameConfig";
import type { Location } from "@/game/types";
import { MineMap } from "./map/MineMap";
import { TownMap } from "./map/TownMap";

function floorOf(loc: Location): number | null {
  const m = /^mine_(\d+)$/.exec(loc);
  return m ? Number(m[1]) : null;
}

function locationLabel(loc: Location) {
  if (loc === "saloon") return STARTING_SALOON_NAME;
  if (loc === "mining_quarter") return MINING_QUARTER_NAME;
  return `${MINE_NAME} · Floor ${floorOf(loc)}`;
}

export function WorldViewport() {
  const { player, levels } = useGame();
  if (!player) return <p className="p-8 text-center font-display text-xl">Saddling up…</p>;
  const n = floorOf(player.current_location);
  const level = n === null ? undefined : levels.find((l) => l.level_number === n);
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        <span className="font-display font-bold text-saddle">{HUB_CITY_NAME}</span> › {locationLabel(player.current_location)}
      </p>
      {n === null ? <TownMap /> : level && <MineMap key={level.level_number} level={level} />}
    </div>
  );
}
