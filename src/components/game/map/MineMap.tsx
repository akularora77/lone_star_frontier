import { useRef, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/game/GameProvider";
import { MINE_NAME, RATTLER_NAME } from "@/game/gameConfig";
import type { MineLevelInfo, TilePos } from "@/game/types";
import { cn } from "@/lib/utils";
import { OreGem } from "../icons";
import { PlayerToken } from "./MapTokens";
import { RattlerToken } from "./RattlerToken";
import { followingView, groundPoint } from "./mapView";
import { adjacent, findTilePath, tileKey } from "./mineGrid";
import { useWalker, type Pt } from "./useWalker";

/** Map units per floor tile (drawing scale only). */
const T = 50;
const center = (t: TilePos): Pt => ({ x: t.x * T + T / 2, y: t.y * T + T / 2 });

export function MineMap({ level }: { level: MineLevelInfo }) {
  const { player, levels, swing, move, step } = useGame();
  const n = level.level_number;
  const floor = player?.floor ?? null;
  const W = (floor?.width ?? 20) * T;
  const H = (floor?.height ?? 14) * T;
  const { pos, moving, facing, walkTo, face, current } = useWalker(center(player?.position ?? floor?.way_up ?? { x: 1, y: 7 }));
  const [active, setActive] = useState<{ index: number; seconds: number } | null>(null);
  const [reward, setReward] = useState<string | null>(null);
  const [hitAt, setHitAt] = useState(0);
  const token = useRef(0);
  const swinging = useRef(false);
  const playerRef = useRef(player);
  playerRef.current = player;
  const prev = levels.find((l) => l.level_number === n - 1);
  const next = levels.find((l) => l.level_number === n + 1);
  const locked = level.ores.filter((o) => !o.unlocked);
  const poolWeight = level.ores.filter((o) => o.unlocked).reduce((s, o) => s + o.weight, 0);

  // Flash when the service reports HP lost to the Rattler.
  const lastHp = useRef(player?.health_hp ?? 0);
  useEffect(() => {
    const hp = player?.health_hp ?? 0;
    if (hp < lastHp.current) setHitAt(Date.now());
    lastHp.current = hp;
  }, [player?.health_hp]);
  useEffect(() => () => { token.current++; }, []);

  const animateTo = (t: TilePos, ms: number) => new Promise<void>((resolve) => {
    const target = center(t);
    const from = current();
    const dist = Math.max(1, Math.hypot(target.x - from.x, target.y - from.y));
    walkTo(target, dist / (ms / 1000), resolve);
  });

  /** Starts a new command: any earlier walk or swing selection stops here (that swing grants nothing). */
  const begin = () => {
    token.current++;
    swinging.current = false;
    setActive(null);
    return token.current;
  };

  const walkPath = async (goal: (t: TilePos) => boolean, mine: number): Promise<boolean> => {
    const st = playerRef.current;
    if (!st?.position || !st.floor) return false;
    const blocked = new Set(st.rock_spots.filter((s) => s.ore_id).map((s) => tileKey(s)));
    for (const rattler of st.floor.rattlers) blocked.add(tileKey(rattler));
    const path = findTilePath(st.position, goal, blocked, st.floor.width, st.floor.height);
    if (!path) return false;
    for (const t of path) {
      if (token.current !== mine) return false;
      await animateTo(t, st.floor.walk_ms_per_tile);
      if (token.current !== mine) return false;
      if (!(await step(t.x, t.y))) return false;
    }
    if (!path.length && player?.position) await animateTo(player.position, 120);
    return token.current === mine;
  };

  const mineRock = (index: number) => {
    if (swinging.current) return; // another mine click during a swing does nothing
    const spot = player?.rock_spots.find((s) => s.index === index);
    if (!spot?.ore_id || !spot.unlocked) return;
    const mine = begin();
    swinging.current = true;
    void walkPath((t) => adjacent(t, spot), mine).then((arrived) => {
      if (!arrived) { if (token.current === mine) swinging.current = false; return; }
      face(current().x < center(spot).x ? 1 : -1);
      setReward(null);
      setActive({ index, seconds: spot.swing_seconds });
      void swing(n, index, () => token.current !== mine).then((result) => {
        if (token.current !== mine) return;
        swinging.current = false;
        setActive(null);
        if (result?.quantity) setReward(`+${result.xp_gained} XP · ${result.quantity} × ${spot.name}`);
      });
    });
  };

  const ladder = (target: TilePos | null | undefined, location: "mining_quarter" | `mine_${number}`, isLocked = false) => {
    if (!target || isLocked) return;
    const mine = begin();
    void walkPath((t) => t.x === target.x && t.y === target.y, mine).then((ok) => { if (ok) void move(location); });
  };
  const upTarget = prev ? (`mine_${prev.level_number}` as const) : "mining_quarter";

  const rattlers = floor?.rattlers ?? [];
  const hitRecently = Date.now() - hitAt < 600;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl font-black">{MINE_NAME} · Floor {n}</h1>
        <nav aria-label="Mine destinations" className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => ladder(floor?.way_up, upTarget)}><ArrowUp />{prev ? `Floor ${prev.level_number}` : "Surface"}</Button>
          {next && floor?.way_down && <Button variant="outline" size="sm" disabled={next.locked} title={next.locked ? `Requires Mining Level ${next.required_mining_level}.` : undefined} onClick={() => ladder(floor.way_down, `mine_${next.level_number}`, next.locked)}><ArrowDown />Floor {next.level_number}{next.locked ? " 🔒" : ""}</Button>}
        </nav>
      </div>
      {rattlers.length > 0 && <p className="text-sm text-muted-foreground">{rattlers.length} {RATTLER_NAME}{rattlers.length === 1 ? "" : "s"} · {floor?.hit_damage} HP per bite</p>}
      <div className={cn("relative overflow-hidden rounded-sm border-4 border-wood-dark shadow-panel", hitRecently && "border-hp")}>
        <svg viewBox={followingView(pos, W, H, W, H)} className="block h-auto w-full select-none" role="application" aria-label={`${MINE_NAME} floor ${n}`}>
          <defs>
            <pattern id="mine-tiles" width={T} height={T} patternUnits="userSpaceOnUse">
              <rect width={T} height={T} fill="none" stroke="var(--wood-dark)" strokeOpacity="0.18" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="var(--ink)" />
          <rect x="6" y="6" width={W - 12} height={H - 12} rx="60" fill="var(--rock)" stroke="var(--wood-dark)" strokeWidth="8" />
          <rect x="6" y="6" width={W - 12} height={H - 12} rx="60" fill="url(#mine-tiles)" pointerEvents="none" />
          {[[3, 1], [10, 0.6], [17, 1], [2, 13], [11, 13.4], [18, 13]].map(([x = 0, y = 0]) => (
            <g key={`${x}-${y}`} pointerEvents="none">
              <circle cx={x * T} cy={y * T} r="90" fill="var(--dusty-gold)" opacity="0.1" />
              <circle cx={x * T} cy={y * T} r="6" fill="var(--dusty-gold)" />
            </g>
          ))}
          <rect width={W} height={H} fill="transparent" className="cursor-crosshair" onClick={(e) => {
            const point = groundPoint(e);
            if (!point || !floor) return;
            const t = { x: Math.max(0, Math.min(floor.width - 1, Math.floor(point.x / T))), y: Math.max(0, Math.min(floor.height - 1, Math.floor(point.y / T))) };
            const mine = begin();
            void walkPath((g) => g.x === t.x && g.y === t.y, mine);
          }} />
          {floor && (
            <g role="button" tabIndex={0} aria-label={prev ? `Climb to floor ${prev.level_number}` : "Climb to the surface"} className="cursor-pointer outline-hidden"
              onClick={() => ladder(floor.way_up, upTarget)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ladder(floor.way_up, upTarget); } }}>
              {(() => { const c = center(floor.way_up); return <>
                <rect x={c.x - 20} y={c.y - 40} width="40" height="64" fill="transparent" />
                {[0, 1, 2, 3].map((i) => <rect key={i} x={c.x - 15} y={c.y - 34 + i * 15} width="30" height="4" fill="var(--saddle)" />)}
                <rect x={c.x - 19} y={c.y - 40} width="5" height="64" fill="var(--saddle)" />
                <rect x={c.x + 14} y={c.y - 40} width="5" height="64" fill="var(--saddle)" />
                <text x={c.x} y={c.y + 42} textAnchor="middle" className="map-label" fill="var(--dusty-gold)" fontSize="13" fontWeight="700">▲ {prev ? `Floor ${prev.level_number}` : "Surface"}</text>
              </>; })()}
            </g>
          )}
          {next && floor?.way_down && (
            <g role="button" tabIndex={next.locked ? -1 : 0} aria-disabled={next.locked} aria-label={next.locked ? `Floor ${next.level_number}, requires Mining Level ${next.required_mining_level}` : `Climb down to floor ${next.level_number}`} className={cn("outline-hidden", !next.locked && "cursor-pointer")}
              onClick={() => ladder(floor.way_down, `mine_${next.level_number}`, next.locked)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ladder(floor.way_down, `mine_${next.level_number}`, next.locked); } }}>
              {(() => { const c = center(floor.way_down); return <>
                <ellipse cx={c.x} cy={c.y} rx="30" ry="16" fill="var(--ink)" stroke="var(--wood-dark)" strokeWidth="4" />
                {[0, 1, 2].map((i) => <rect key={i} x={c.x - 11} y={c.y - 9 + i * 7} width="22" height="3" fill="var(--saddle)" />)}
                <text x={c.x} y={c.y + 36} textAnchor="middle" className="map-label" fill="var(--dusty-gold)" fontSize="13" fontWeight="700">▼ Floor {next.level_number}{next.locked ? ` 🔒 Lv ${next.required_mining_level}` : ""}</text>
              </>; })()}
            </g>
          )}
          {player?.rock_spots.map((spot) => {
            const r = center(spot);
            const isSwinging = active?.index === spot.index;
            return (
              <g key={spot.index} role={spot.ore_id ? "button" : undefined} tabIndex={spot.ore_id && spot.unlocked ? 0 : -1} aria-disabled={!spot.ore_id || !spot.unlocked || active !== null} aria-label={spot.ore_id ? `Ore rock ${spot.index}: ${spot.name}` : undefined} className={cn("outline-hidden", spot.ore_id && "cursor-pointer", spot.ore_id && !spot.unlocked && "opacity-60")} onClick={() => mineRock(spot.index)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); mineRock(spot.index); } }}>
                {spot.ore_id ? <>
                  <title>{spot.unlocked ? spot.name : `${spot.name} (needs a better pickaxe or level)`}</title>
                  <path className={isSwinging ? "svg-shake" : undefined} d={`M${r.x - 24} ${r.y + 14} Q${r.x - 27} ${r.y - 12} ${r.x - 5} ${r.y - 20} Q${r.x + 20} ${r.y - 22} ${r.x + 26} ${r.y + 2} Q${r.x + 27} ${r.y + 16} ${r.x + 6} ${r.y + 18} Z`} fill="var(--wood)" stroke="var(--wood-dark)" strokeWidth="3" />
                  <foreignObject x={r.x - 10} y={r.y - 11} width="20" height="20" pointerEvents="none"><div className="grid size-full place-items-center"><OreGem oreId={spot.ore_id} className="size-3.5" /></div></foreignObject>
                </> : <ellipse cx={r.x} cy={r.y + 8} rx="18" ry="6" fill="var(--ink)" opacity="0.6" pointerEvents="none" />}
              </g>
            );
          })}
          {rattlers.map((rattler, i) => <RattlerToken key={rattler.id ?? i} x={center(rattler).x} y={center(rattler).y} strikeSequence={rattler.strike_sequence ?? 0} target={pos} />)}
          <PlayerToken x={pos.x} y={pos.y} moving={moving} facing={facing} miningSeconds={active?.seconds ?? 0} swingKey={player?.swing_ends_at ?? 0} clothingId={player?.equipped_outfit.top ?? null} bottomId={player?.equipped_outfit.bottom ?? null} hatId={player?.equipped_outfit.hat ?? null} />
        </svg>
        {hitRecently && <div className="pointer-events-none absolute inset-0 bg-hp/20" aria-hidden />}
        {reward && <p key={reward} className="animate-float-up pointer-events-none absolute bottom-12 left-1/2 w-full px-3 text-center font-display text-lg font-bold text-dusty-gold" role="status">{reward}</p>}
      </div>
      <section className="space-y-2 border-t border-wood/30 pt-3" aria-label="Drop table">
        <h2 className="text-lg font-bold">Ore on this floor</h2>
        <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
          {level.ores.map((o) => <li key={o.ore_id} className={cn("inline-flex items-center gap-1.5", !o.unlocked && "opacity-55")}><OreGem oreId={o.ore_id} className="size-3.5" /> {o.name} {o.unlocked && poolWeight ? `${Math.round(o.weight / poolWeight * 100)}%` : "🔒"}</li>)}
        </ul>
        {locked.map((o) => <p key={o.ore_id} className="text-sm italic text-muted-foreground">{o.name} unlocks at Mining Level {o.required_mining_level} with a {o.required_pickaxe_name}.</p>)}
      </section>
    </div>
  );
}
