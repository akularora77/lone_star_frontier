import type { Pt } from "./useWalker";

export interface Block { left: number; right: number; top: number; bottom: number }
// Expanded footprints leave room for the character, not just its centre point.
export const BUILDINGS: Block[] = [
  { left: 48, right: 362, top: 108, bottom: 332 },
  { left: 528, right: 782, top: 98, bottom: 332 },
];

export function insideBuilding(p: Pt, b: Block) {
  return p.x > b.left && p.x < b.right && p.y > b.top && p.y < b.bottom;
}

export function openGround(point: Pt): Pt {
  let p = { x: Math.max(30, Math.min(970, point.x)), y: Math.max(110, Math.min(600, point.y)) };
  for (const b of BUILDINGS) {
    if (!insideBuilding(p, b)) continue;
    const options = [{ x: b.left, y: p.y }, { x: b.right, y: p.y }, { x: p.x, y: b.bottom }];
    p = options.sort((a, c) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(c.x - p.x, c.y - p.y))[0] ?? p;
  }
  return p;
}

export function crossesBuilding(a: Pt, z: Pt): boolean {
  return BUILDINGS.some((b) => {
    let low = 0; let high = 1;
    for (const [start, delta, min, max] of [
      [a.x, z.x - a.x, b.left + 0.01, b.right - 0.01],
      [a.y, z.y - a.y, b.top + 0.01, b.bottom - 0.01],
    ]) {
      if (start === undefined || delta === undefined || min === undefined || max === undefined) continue;
      if (Math.abs(delta) < 0.001) { if (start < min || start > max) return false; }
      else {
        const t1 = (min - start) / delta; const t2 = (max - start) / delta;
        low = Math.max(low, Math.min(t1, t2)); high = Math.min(high, Math.max(t1, t2));
      }
    }
    return low < high && high > 0 && low < 1;
  });
}

/** Shortest visible route around building corners, with free diagonal ground movement. */
export function townPath(start: Pt, requested: Pt): Pt[] {
  const target = openGround(requested);
  const corners = BUILDINGS.flatMap((b) => [
    { x: b.left, y: b.top }, { x: b.right, y: b.top },
    { x: b.left, y: b.bottom }, { x: b.right, y: b.bottom },
  ]).filter((p) => p.y >= 110);
  const points = [start, target, ...corners];
  const distances = points.map(() => Infinity); distances[0] = 0;
  const previous = new Map<number, number>(); const visited = new Set<number>();
  for (let step = 0; step < points.length; step++) {
    let current = -1;
    points.forEach((_, i) => { if (!visited.has(i) && (current < 0 || (distances[i] ?? Infinity) < (distances[current] ?? Infinity))) current = i; });
    const from = points[current];
    if (!from || !Number.isFinite(distances[current])) break;
    if (current === 1) break;
    visited.add(current);
    points.forEach((to, i) => {
      if (visited.has(i) || crossesBuilding(from, to)) return;
      const distance = (distances[current] ?? 0) + Math.hypot(to.x - from.x, to.y - from.y);
      if (distance < (distances[i] ?? Infinity)) { distances[i] = distance; previous.set(i, current); }
    });
  }
  if (!Number.isFinite(distances[1])) return [];
  const path: Pt[] = []; let index = 1;
  while (index !== 0) {
    const point = points[index]; if (!point) return [];
    path.unshift(point); const prev = previous.get(index); if (prev === undefined) return [];
    index = prev;
  }
  return path;
}