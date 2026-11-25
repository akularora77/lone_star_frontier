import { useEffect, useState, type MouseEvent } from "react";
import { DoorOpen, Pickaxe, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/game/GameProvider";
import { GENERAL_STORE_NAME, HUB_CITY_NAME, MINE_NAME, MINING_QUARTER_NAME, STARTING_SALOON_NAME } from "@/game/gameConfig";
import { NPCS } from "@/game/seed";
import type { NpcId } from "@/game/types";
import { NpcToken, PlayerToken } from "./MapTokens";
import { StorePanel } from "./StorePanel";
import { followingView, groundPoint } from "./mapView";
import { openGround, townPath } from "./townWalking";
import { useWalker, type Pt } from "./useWalker";

export const WALK_SPEED = 150;
const W = 1000;
const H = 620;
const DISTRICT_SPLIT_X = 500;

const NPC_SPOTS: Record<NpcId, Pt> = {
  saloon_bartender: { x: 140, y: 345 },
  saloon_prospector: { x: 300, y: 450 },
  store_manager: { x: 720, y: 345 },
};
const SALOON_DOOR: Pt = { x: 205, y: 340 };
const STORE_DOOR: Pt = { x: 650, y: 340 };
const MINE_MOUTH: Pt = { x: 870, y: 470 };
const START: Record<"saloon" | "mining_quarter", Pt> = { saloon: { x: 230, y: 375 }, mining_quarter: { x: 860, y: 500 } };

type Panel = null | "store";

export function TownMap() {
  const { player, move, openNpc, dialogue } = useGame();
  const here = player?.current_location === "mining_quarter" ? "mining_quarter" : "saloon";
  const { pos, moving, facing, walkTo } = useWalker(START[here]);
  const [panel, setPanel] = useState<Panel>(null);
  const [ring, setRing] = useState<{ x: number; y: number; k: number } | null>(null);
  const speed = WALK_SPEED;
  const district = (p: Pt): "saloon" | "mining_quarter" => (p.x < DISTRICT_SPLIT_X ? "saloon" : "mining_quarter");

  // Keep the server's location in sync with the district the player is standing in.
  const syncDistrict = async (p: Pt) => {
    const d = district(p);
    if (player && player.current_location !== d) await move(d);
  };

  const go = (target: Pt, then?: () => void) => {
    setPanel(null);
    const path = townPath(pos, target);
    const destination = path.at(-1);
    if (!destination) return;
    walkTo(destination, speed, () => { void syncDistrict(destination).then(() => then?.()); }, path.slice(0, -1));
  };

  useEffect(() => { if (!moving) void syncDistrict(pos); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [moving]);

  const onGround = (e: MouseEvent<SVGRectElement | SVGPathElement>) => {
    const point = groundPoint(e);
    if (!point) return;
    const { x, y } = openGround(point);
    setRing({ x, y, k: Date.now() });
    go({ x, y });
  };

  const talkTo = (id: NpcId) => {
    const s = NPC_SPOTS[id];
    go({ x: s.x + (pos.x < s.x ? -45 : 45), y: s.y + 10 }, () => openNpc(id));
  };

  return (
    <div className="space-y-2">
      <nav aria-label="Town destinations" className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="h-auto min-h-8 whitespace-normal" onClick={() => go(SALOON_DOOR, () => openNpc("saloon_bartender"))}><DoorOpen />{STARTING_SALOON_NAME}</Button>
        <Button variant="outline" size="sm" className="h-auto min-h-8 whitespace-normal" onClick={() => go(STORE_DOOR, () => setPanel("store"))}><Store />{GENERAL_STORE_NAME}</Button>
        <Button variant="outline" size="sm" className="h-auto min-h-8 whitespace-normal" onClick={() => go(MINE_MOUTH, () => void move("mine_1"))}><Pickaxe />{MINE_NAME}</Button>
      </nav>
      <div className="relative overflow-hidden rounded-sm border-4 border-wood-dark shadow-panel">
        <svg viewBox={followingView(pos, W, H, 650, 500)} className="block h-auto w-full select-none" role="application" aria-label={`Map of ${HUB_CITY_NAME}`}>
          {/* sky band + desert */}
          <rect x="0" y="0" width={W} height="110" fill="oklch(0.86 0.06 80)" />
          <path d="M0 110 L120 70 L230 100 L360 55 L500 95 L640 60 L780 92 L900 50 L1000 85 L1000 110 Z" fill="oklch(0.7 0.08 45)" opacity="0.6" />
          <rect x="0" y="110" width={W} height={H - 110} fill="oklch(0.83 0.07 75)" onClick={onGround} className="cursor-crosshair" />
          <rect x="0" y="320" width={W} height={H - 320} fill="oklch(0.8 0.08 70)" onClick={onGround} className="cursor-crosshair" />
          {/* main street */}
          <path d="M0 340 L1000 340 L1000 410 L0 410 Z" fill="oklch(0.74 0.07 60)" onClick={onGround} className="cursor-crosshair" />
          <path d="M0 375 L1000 375" stroke="oklch(0.68 0.07 55)" strokeWidth="3" strokeDasharray="14 18" pointerEvents="none" />
          {/* path to mine */}
          <path d="M760 410 Q820 450 860 470" stroke="oklch(0.74 0.07 60)" strokeWidth="46" fill="none" strokeLinecap="round" onClick={onGround} className="cursor-crosshair" />

          {/* scenery */}
          {[[60, 520], [420, 560], [520, 480], [960, 330]].map(([x, y]) => (
            <g key={`${x}-${y}`} transform={`translate(${x} ${y})`} pointerEvents="none">
              <rect x="-6" y="-40" width="12" height="40" rx="6" fill="oklch(0.55 0.1 140)" />
              <rect x="-20" y="-28" width="9" height="18" rx="4.5" fill="oklch(0.55 0.1 140)" />
              <rect x="11" y="-34" width="9" height="16" rx="4.5" fill="oklch(0.55 0.1 140)" />
            </g>
          ))}
          {/* district sign */}
          <g transform={`translate(${DISTRICT_SPLIT_X} 300)`} pointerEvents="none">
            <rect x="-4" y="0" width="8" height="40" fill="var(--wood-dark)" />
            <rect x="-100" y="-24" width="200" height="30" rx="3" fill="var(--wood)" stroke="var(--wood-dark)" strokeWidth="3" />
            <text y="-4" textAnchor="middle" fill="var(--parchment)" fontSize="15" fontWeight="700">← · {HUB_CITY_NAME} · →</text>
          </g>

          {/* Saloon */}
          <g role="button" tabIndex={0} aria-label={`Enter ${STARTING_SALOON_NAME}`} className="cursor-pointer outline-hidden" onClick={() => go(SALOON_DOOR, () => openNpc("saloon_bartender"))} onKeyDown={(e) => e.key === "Enter" && go(SALOON_DOOR, () => openNpc("saloon_bartender"))}>
            <rect x="70" y="150" width="270" height="170" fill="oklch(0.55 0.08 45)" stroke="var(--wood-dark)" strokeWidth="4" />
            <rect x="60" y="120" width="290" height="40" fill="var(--wood)" stroke="var(--wood-dark)" strokeWidth="4" />
            <text x="205" y="148" textAnchor="middle" fill="var(--dusty-gold)" fontSize="19" fontWeight="900" fontFamily="var(--font-display)">{STARTING_SALOON_NAME}</text>
            <rect x="60" y="300" width="290" height="14" fill="var(--wood-dark)" />
            {[100, 270].map((x) => <rect key={x} x={x} y="185" width="40" height="40" fill="oklch(0.85 0.1 85)" stroke="var(--wood-dark)" strokeWidth="3" />)}
            <rect x="180" y="250" width="50" height="52" fill="var(--wood-dark)" />
            <path d="M182 258 L203 262 L203 296 L182 296 Z M228 258 L207 262 L207 296 L228 296 Z" fill="var(--saddle)" />
          </g>

          {/* General Store */}
          <g role="button" tabIndex={0} aria-label={`Enter ${GENERAL_STORE_NAME}`} className="cursor-pointer outline-hidden" onClick={() => go(STORE_DOOR, () => setPanel("store"))} onKeyDown={(e) => e.key === "Enter" && go(STORE_DOOR, () => setPanel("store"))}>
            <rect x="550" y="160" width="210" height="160" fill="oklch(0.62 0.06 70)" stroke="var(--wood-dark)" strokeWidth="4" />
            <path d="M540 165 L655 110 L770 165 Z" fill="var(--saddle)" stroke="var(--wood-dark)" strokeWidth="4" />
            <rect x="565" y="175" width="180" height="30" fill="var(--parchment)" stroke="var(--wood-dark)" strokeWidth="3" />
            <text x="655" y="196" textAnchor="middle" fill="var(--wood-dark)" fontSize="17" fontWeight="900" fontFamily="var(--font-display)">{GENERAL_STORE_NAME}</text>
            <rect x="630" y="250" width="44" height="70" fill="var(--wood-dark)" />
            <rect x="575" y="230" width="40" height="36" fill="oklch(0.85 0.1 85)" stroke="var(--wood-dark)" strokeWidth="3" />
            <rect x="695" y="230" width="40" height="36" fill="oklch(0.85 0.1 85)" stroke="var(--wood-dark)" strokeWidth="3" />
          </g>

          {/* Mine entrance */}
          <g role="button" tabIndex={0} aria-label={`Enter ${MINE_NAME}`} className="cursor-pointer outline-hidden" onClick={() => go(MINE_MOUTH, () => void move("mine_1"))} onKeyDown={(e) => e.key === "Enter" && go(MINE_MOUTH, () => void move("mine_1"))}>
            <path d="M780 620 L830 430 Q880 360 960 400 L1000 440 L1000 620 Z" fill="var(--rock)" stroke="var(--wood-dark)" strokeWidth="4" />
            <path d="M850 470 L850 420 Q880 395 910 420 L910 470 Z" fill="var(--ink)" stroke="var(--saddle)" strokeWidth="8" />
            <text x="880" y="530" textAnchor="middle" className="map-label" fill="var(--dusty-gold)" fontSize="17" fontWeight="900">{MINE_NAME}</text>
          </g>

          {/* District labels */}
          <text x="205" y="600" textAnchor="middle" className="map-label" fill="var(--parchment)" fontSize="16" fontWeight="700" pointerEvents="none">{STARTING_SALOON_NAME}</text>
          <text x="650" y="600" textAnchor="middle" className="map-label" fill="var(--parchment)" fontSize="16" fontWeight="700" pointerEvents="none">{MINING_QUARTER_NAME}</text>

          {ring && <circle key={ring.k} cx={ring.x} cy={ring.y} r="6" fill="none" stroke="var(--dusty-gold)" strokeWidth="3" className="animate-click-ring" pointerEvents="none" />}

          {NPCS.map((n) => {
            const s = NPC_SPOTS[n.id];
            return <NpcToken key={n.id} x={s.x} y={s.y} name={n.name} portraitKey={n.portrait_key} active={dialogue?.npcId === n.id} onClick={() => talkTo(n.id)} />;
          })}
          <PlayerToken x={pos.x} y={pos.y} moving={moving} facing={facing} clothingId={player?.equipped_outfit.top ?? null} bottomId={player?.equipped_outfit.bottom ?? null} hatId={player?.equipped_outfit.hat ?? null} />
        </svg>

        {panel === "store" && (
          <div className="absolute inset-y-3 left-3 w-[min(440px,calc(100%_-_1.5rem))]"><StorePanel onClose={() => setPanel(null)} /></div>
        )}
      </div>
    </div>
  );
}
