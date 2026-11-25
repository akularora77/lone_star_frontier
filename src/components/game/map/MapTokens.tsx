import { PORTRAITS } from "@/game/portraits";
import { useEffect, useRef, useState } from "react";

export function PlayerToken({ x, y, moving, facing, miningSeconds = 0, swingKey = 0, clothingId = "basic_top", bottomId = "basic_bottom", hatId = "basic_hat" }: { x: number; y: number; moving: boolean; facing: 1 | -1; miningSeconds?: number; swingKey?: number; clothingId?: string | null; bottomId?: string | null; hatId?: string | null }) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const swingAnimation = useRef<SVGAnimateTransformElement | null>(null);
  const shirt = clothingId === null ? "var(--character-skin)" : clothingId === "cloth_bandana" ? "var(--stamina-low)" : clothingId === "cloth_vest" ? "var(--saddle)" : clothingId === "cloth_duster" ? "var(--wood)" : "var(--character-shirt)";
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (miningSeconds > 0 && !reduceMotion) swingAnimation.current?.beginElement();
  }, [miningSeconds, swingKey, reduceMotion]);
  return (
    <g transform={`translate(${x} ${y})`} aria-label="You" pointerEvents="none">
      <ellipse cx="0" cy="4" rx="16" ry="6" fill="var(--wood-dark)" opacity="0.35" />
      <g transform={`scale(${facing} 1)`} className={moving ? "animate-pulse" : undefined}>
        <g aria-label={bottomId ? "Trousers and boots" : "Bare legs and boots"}>
          <path d="M-8 -13 L8 -13 L7 3 L2 3 L0 -5 L-2 3 L-7 3 Z" fill={bottomId ? "var(--character-trousers)" : "var(--character-skin)"} stroke="var(--wood-dark)" strokeWidth="2" />
          <path d="M-8 1 L-2 1 L-2 5 L-10 5 Z M2 1 L7 1 L10 5 L2 5 Z" fill="var(--wood-dark)" />
        </g>
        <path aria-label={clothingId ? `Wearing ${clothingId}` : "No top equipped"} d={clothingId === "cloth_duster" ? "M-7 -27 L7 -27 L11 -4 L2 -6 L0 -13 L-2 -6 L-11 -4 Z" : "M-7 -27 L7 -27 L9 -13 L-9 -13 Z"} fill={shirt} stroke="var(--wood-dark)" strokeWidth="2" />
        {clothingId && <><path d="M0 -26 L0 -14" stroke="var(--wood-dark)" strokeWidth="1" /><polygon points="0,-20 2,-16 6,-16 3,-13 4,-9 0,-11 -4,-9 -3,-13 -6,-16 -2,-16" fill="var(--dusty-gold)" /></>}
        <circle cx="0" cy="-33" r="7" fill="var(--character-skin)" stroke="var(--wood-dark)" strokeWidth="2" />
        {clothingId === "cloth_bandana" && <path d="M-7 -28 L7 -28 L0 -23 Z" fill="var(--stamina-low)" stroke="var(--wood-dark)" strokeWidth="1" />}
        {hatId && <g aria-label="Wearing basic_hat"><ellipse cx="0" cy="-38" rx="15" ry="3.5" fill="var(--wood-dark)" /><rect x="-7" y="-47" width="14" height="10" rx="3" fill="var(--wood-dark)" /></g>}
        {miningSeconds > 0 && <g transform="translate(5 -20)" aria-label="Swinging pickaxe">
          <g className="mining-arm">
            {!reduceMotion && <animateTransform ref={swingAnimation} attributeName="transform" type="rotate" values="25;-115;-115;25;25" keyTimes="0;0.35;0.55;0.85;1" dur={`${miningSeconds}s`} begin="indefinite" repeatCount="indefinite" />}
            <path d="M0 0 L15 3" stroke={shirt} strokeWidth="7" strokeLinecap="round" />
            <circle cx="16" cy="3" r="4" fill="var(--character-skin)" />
            <path d="M12 3 L46 3" stroke="var(--wood-dark)" strokeWidth="6" strokeLinecap="round" />
            <path d="M12 3 L46 3" stroke="var(--saddle)" strokeWidth="3" strokeLinecap="round" />
            <path d="M45 -11 Q56 -3 49 17 L44 5 L38 -5 Z" fill="var(--ore-silver)" stroke="var(--wood-dark)" strokeWidth="2" />
          </g>
        </g>}
      </g>
      <text y="-54" textAnchor="middle" className="map-label" fill="var(--dusty-gold)" fontSize="13" fontWeight="700">You</text>
    </g>
  );
}

export function NpcToken({ x, y, name, portraitKey, active, onClick }: { x: number; y: number; name: string; portraitKey: string; active: boolean; onClick: () => void }) {
  const clipId = `clip-${portraitKey}`;
  return (
    <g
      transform={`translate(${x} ${y})`}
      role="button"
      tabIndex={0}
      aria-label={`Talk to ${name}`}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      className="cursor-pointer outline-hidden [&:focus-visible>circle.ring]:stroke-dusty-gold"
    >
      <ellipse cx="0" cy="26" rx="20" ry="6" fill="var(--wood-dark)" opacity="0.35" />
      <defs><clipPath id={clipId}><circle cx="0" cy="0" r="24" /></clipPath></defs>
      <circle className="ring" cx="0" cy="0" r="27" fill="var(--wood-dark)" stroke={active ? "var(--dusty-gold)" : "var(--wood)"} strokeWidth="4" />
      <image href={PORTRAITS[portraitKey]} x="-24" y="-24" width="48" height="48" clipPath={`url(#${clipId})`} preserveAspectRatio="xMidYMid slice" />
      <text y="46" textAnchor="middle" className="map-label" fill="var(--parchment)" fontSize="13" fontWeight="700">{name}</text>
      <text y="-32" textAnchor="middle" fontSize="18">💬</text>
    </g>
  );
}
