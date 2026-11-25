import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/game/GameProvider";
import { MINE_NAME } from "@/game/gameConfig";
import type { MineLevelInfo } from "@/game/types";
import { cn } from "@/lib/utils";
import { OreGem } from "../icons";
import { PlayerToken } from "./MapTokens";
import { WALK_SPEED } from "./TownMap";
import { followingView, groundPoint } from "./mapView";
import { useWalker, type Pt } from "./useWalker";

const W = 1000;
const H = 560;
const UP: Pt = { x: 110, y: 130 };
const DOWN: Pt = { x: 890, y: 450 };
const ROCKS: Pt[] = [{ x: 320, y: 240 }, { x: 550, y: 370 }, { x: 770, y: 230 }];

function OreMeter({ rock, progress, target, endsAt }: { rock: Pt; progress: number; target: number; endsAt: number }) {
  const [displayed, setDisplayed] = useState(progress);
  useEffect(() => {
    const started = Date.now();
    const duration = Math.max(1, endsAt - started);
    let frame = 0;
    const paint = () => {
      const fraction = Math.max(0, Math.min(1, (Date.now() - started) / duration));
      setDisplayed(progress + (target - progress) * fraction);
      if (endsAt > Date.now()) frame = requestAnimationFrame(paint);
    };
    paint();
    return () => cancelAnimationFrame(frame);
  }, [endsAt, progress, target]);
  return <g pointerEvents="none" role="progressbar" aria-label="Ore mining progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(displayed * 100)}>
    <rect x={rock.x - 40} y={rock.y + 32} width="80" height="8" rx="2" fill="var(--wood-dark)" />
    <rect x={rock.x - 40} y={rock.y + 32} width={displayed * 80} height="8" rx="2" fill="var(--dusty-gold)" />
  </g>;
}

export function MineMap({ level }: { level: MineLevelInfo }) {
  const { player, levels, swing, move } = useGame();
  const n = level.level_number;
  const { pos, moving, facing, walkTo, face } = useWalker({ x: UP.x + 60, y: UP.y + 40 });
  const [active, setActive] = useState<{ index: number; seconds: number } | null>(null);
  const [reward, setReward] = useState<string | null>(null);
  const lockedAction = useRef(false);
  const prev = levels.find((l) => l.level_number === n - 1);
  const next = levels.find((l) => l.level_number === n + 1);
  const locked = level.ores.filter((o) => !o.unlocked);
  const poolWeight = level.ores.filter((o) => o.unlocked).reduce((s, o) => s + o.weight, 0);

  const mineRock = (index: number) => {
    if (lockedAction.current) return;
    const spot = player?.rock_spots.find((s) => s.index === index);
    const rock = ROCKS[index - 1];
    if (!spot?.ore_id || !spot.unlocked || !rock) return;
    lockedAction.current = true;
    const side = pos.x < rock.x ? -1 : 1;
    walkTo({ x: rock.x + side * 60, y: rock.y + 12 }, WALK_SPEED, () => {
      face(side === -1 ? 1 : -1);
      setReward(null);
      setActive({ index, seconds: spot.swing_seconds });
      void swing(n, index).then((result) => {
        lockedAction.current = false;
        setActive(null);
        if (result?.quantity) setReward(`+${result.xp_gained} XP · ${result.quantity} × ${spot.name}`);
      });
    });
  };

  const ladder = (target: Pt, location: "mining_quarter" | `mine_${number}`, locked = false) => {
    if (lockedAction.current || locked) return;
    walkTo({ x: target.x + (target.x > W / 2 ? -40 : 40), y: target.y + 30 }, WALK_SPEED, () => void move(location));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl font-black">{MINE_NAME} · Floor {n}</h1>
        <nav aria-label="Mine destinations" className="flex gap-2">
          <Button variant="outline" size="sm" disabled={active !== null} onClick={() => ladder(UP, prev ? `mine_${prev.level_number}` : "mining_quarter")}><ArrowUp />{prev ? `Floor ${prev.level_number}` : "Surface"}</Button>
          {next && <Button variant="outline" size="sm" disabled={next.locked || active !== null} title={next.locked ? `Requires Mining Level ${next.required_mining_level}.` : undefined} onClick={() => ladder(DOWN, `mine_${next.level_number}`, next.locked)}><ArrowDown />Floor {next.level_number}{next.locked ? " 🔒" : ""}</Button>}
        </nav>
      </div>
      <div className="relative overflow-hidden rounded-sm border-4 border-wood-dark shadow-panel">
        <svg viewBox={followingView(pos, W, H, 900, 540)} className="block h-auto w-full select-none" role="application" aria-label={`${MINE_NAME} floor ${n}`}>
          <rect width={W} height={H} fill="var(--ink)" />
          <path d="M40 90 Q200 30 420 70 Q650 20 900 80 Q980 200 960 360 Q990 500 860 530 Q600 560 360 520 Q120 540 50 430 Q10 260 40 90 Z" fill="var(--rock)" stroke="var(--wood-dark)" strokeWidth="6" />
          <rect width={W} height={H} fill="transparent" className="cursor-crosshair" onClick={(e) => {
            if (lockedAction.current) return;
            const point = groundPoint(e);
            if (point) walkTo({ x: Math.max(80, Math.min(W - 80, point.x)), y: Math.max(110, Math.min(H - 80, point.y)) }, WALK_SPEED);
          }} />
          {[[230, 80], [700, 70], [520, 520]].map(([x, y]) => (
            <g key={`${x}`} pointerEvents="none">
              <circle cx={x} cy={y} r="70" fill="var(--dusty-gold)" opacity="0.12" />
              <circle cx={x} cy={y} r="7" fill="var(--dusty-gold)" />
            </g>
          ))}
          <g role="button" tabIndex={0} aria-label={prev ? `Climb to floor ${prev.level_number}` : "Climb to the surface"} className="cursor-pointer outline-hidden"
            onClick={() => ladder(UP, prev ? `mine_${prev.level_number}` : "mining_quarter")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ladder(UP, prev ? `mine_${prev.level_number}` : "mining_quarter"); } }}>
            <rect x={UP.x - 22} y={UP.y - 70} width="44" height="90" fill="transparent" />
            {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={UP.x - 18} y={UP.y - 60 + i * 18} width="36" height="4" fill="var(--saddle)" />)}
            <rect x={UP.x - 22} y={UP.y - 70} width="5" height="90" fill="var(--saddle)" />
            <rect x={UP.x + 17} y={UP.y - 70} width="5" height="90" fill="var(--saddle)" />
            <text x={UP.x} y={UP.y + 40} textAnchor="middle" className="map-label" fill="var(--dusty-gold)" fontSize="14" fontWeight="700">▲ {prev ? `Floor ${prev.level_number}` : "Surface"}</text>
          </g>
          {next && (
            <g role="button" tabIndex={next.locked ? -1 : 0} aria-disabled={next.locked} aria-label={next.locked ? `Floor ${next.level_number}, requires Mining Level ${next.required_mining_level}` : `Climb down to floor ${next.level_number}`} className={cn("outline-hidden", !next.locked && "cursor-pointer")}
              onClick={() => ladder(DOWN, `mine_${next.level_number}`, next.locked)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ladder(DOWN, `mine_${next.level_number}`, next.locked); } }}>
              <ellipse cx={DOWN.x} cy={DOWN.y} rx="42" ry="20" fill="var(--ink)" stroke="var(--wood-dark)" strokeWidth="4" />
              {[0, 1, 2].map((i) => <rect key={i} x={DOWN.x - 14} y={DOWN.y - 12 + i * 8} width="28" height="3" fill="var(--saddle)" />)}
              <text x={DOWN.x} y={DOWN.y + 44} textAnchor="middle" className="map-label" fill="var(--dusty-gold)" fontSize="14" fontWeight="700">▼ Floor {next.level_number}{next.locked ? ` 🔒 Lv ${next.required_mining_level}` : ""}</text>
            </g>
          )}
          {player?.rock_spots.map((spot) => {
            const r = ROCKS[spot.index - 1];
            if (!r) return null;
            const swinging = active?.index === spot.index;
            return (
              <g key={spot.index} role={spot.ore_id ? "button" : undefined} tabIndex={spot.ore_id && spot.unlocked ? 0 : -1} aria-disabled={!spot.ore_id || !spot.unlocked || active !== null} aria-label={spot.ore_id ? `Ore rock ${spot.index}: ${spot.name}` : undefined} className={cn("outline-hidden", spot.ore_id && "cursor-pointer")} onClick={() => mineRock(spot.index)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); mineRock(spot.index); } }}>
                {spot.ore_id ? <>
                  <path className={swinging ? "svg-shake" : undefined} d={`M${r.x - 42} ${r.y + 20} Q${r.x - 46} ${r.y - 22} ${r.x - 8} ${r.y - 34} Q${r.x + 34} ${r.y - 36} ${r.x + 44} ${r.y + 2} Q${r.x + 46} ${r.y + 24} ${r.x + 10} ${r.y + 28} Z`} fill="var(--wood)" stroke="var(--wood-dark)" strokeWidth="4" />
                  <foreignObject x={r.x - 14} y={r.y - 16} width="28" height="28" pointerEvents="none"><div className="grid size-full place-items-center"><OreGem oreId={spot.ore_id} className="size-4" /></div></foreignObject>
                </> : <ellipse cx={r.x} cy={r.y + 15} rx="28" ry="9" fill="var(--ink)" stroke="var(--wood)" strokeWidth="2" />}
                {spot.ore_id && <text x={r.x} y={r.y - 48} textAnchor="middle" className="map-label" fill="var(--parchment)" fontSize="16" fontWeight="700">{spot.name}</text>}
                {swinging && <OreMeter key={player?.swing_ends_at ?? 0} rock={r} progress={spot.progress} target={spot.progress_target} endsAt={player?.swing_ends_at ?? 0} />}
              </g>
            );
          })}
          <PlayerToken x={pos.x} y={pos.y} moving={moving} facing={facing} miningSeconds={active?.seconds ?? 0} swingKey={player?.swing_ends_at ?? 0} clothingId={player?.equipped_outfit.top ?? null} bottomId={player?.equipped_outfit.bottom ?? null} hatId={player?.equipped_outfit.hat ?? null} />
        </svg>
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
