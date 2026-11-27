import { RATTLER_NAME } from "@/game/gameConfig";

/** Coiled desert rattlesnake: tan diamond-backed coils, raised head, flicking tongue, buzzing rattle. */
export function RattlerToken({ x, y, strikeSequence, target }: { x: number; y: number; strikeSequence: number; target: { x: number; y: number } }) {
  const angle = Math.atan2(target.y - y, target.x - x) * 180 / Math.PI + 90;
  return (
    <g className="rattler-roam" transform={`translate(${x} ${y})`} pointerEvents="none" aria-label={RATTLER_NAME} role="img" data-strike-sequence={strikeSequence}>
      <g transform={`rotate(${angle})`}>
      <ellipse cx="0" cy="12" rx="26" ry="8" fill="var(--ink)" opacity="0.35" />
      <ellipse cx="0" cy="6" rx="22" ry="12" fill="var(--rattler)" stroke="var(--wood-dark)" strokeWidth="2.5" />
      <ellipse cx="0" cy="6" rx="22" ry="12" fill="none" stroke="var(--rattler-dark)" strokeWidth="4" strokeDasharray="5 6" />
      <ellipse cx="-2" cy="2" rx="14" ry="8" fill="var(--rattler)" stroke="var(--wood-dark)" strokeWidth="2" />
      <ellipse cx="-2" cy="2" rx="14" ry="8" fill="none" stroke="var(--rattler-dark)" strokeWidth="3.5" strokeDasharray="4 5" />
      <g transform="translate(20 6)">
        {[0, 1, 2].map((i) => <ellipse key={i} cx={i * 4} cy={-i * 2} rx="3.2" ry="2.4" fill="var(--parchment)" stroke="var(--wood-dark)" strokeWidth="1" />)}
        <animateTransform attributeName="transform" type="rotate" values="-8 0 0;8 0 0;-8 0 0" dur="0.15s" repeatCount="indefinite" additive="sum" />
      </g>
      <g key={strikeSequence} className={strikeSequence > 0 ? "rattler-strike" : undefined}>
        <path d="M-6 0 Q-12 -14 -4 -24" fill="none" stroke="var(--rattler)" strokeWidth="8" strokeLinecap="round" />
        <path d="M-6 0 Q-12 -14 -4 -24" fill="none" stroke="var(--rattler-dark)" strokeWidth="8" strokeLinecap="round" strokeDasharray="2 6" />
        <path d="M-12 -28 Q-4 -36 6 -28 Q2 -20 -6 -21 Q-12 -22 -12 -28 Z" fill="var(--rattler)" stroke="var(--wood-dark)" strokeWidth="2" />
        <circle cx="-2" cy="-29" r="1.6" fill="var(--hp)" />
        <path d="M-7 -23 l1 7 2 -7 M0 -23 l1 7 2 -7" fill="var(--parchment)" />
        <path d="M6 -27 l6 -2 m-6 2 l6 2" stroke="var(--hp)" strokeWidth="1.4" strokeLinecap="round">
          <animate attributeName="opacity" values="1;0;1" dur="0.8s" repeatCount="indefinite" />
        </path>
      </g>
      </g>
      <text y="-42" textAnchor="middle" className="map-label" fill="var(--hp)" fontSize="13" fontWeight="700">{RATTLER_NAME}</text>
    </g>
  );
}
