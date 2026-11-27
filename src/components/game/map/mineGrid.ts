import type { TilePos } from "@/game/types";

const key = (t: TilePos) => `${t.x},${t.y}`;

/**
 * Shortest 8-way path over the floor grid (presentation only; the service validates each step).
 * Returns the tiles to walk after `from`, ending on the first tile `isGoal` accepts, or null.
 */
export function findTilePath(from: TilePos, isGoal: (t: TilePos) => boolean, blocked: Set<string>, width: number, height: number): TilePos[] | null {
  if (isGoal(from)) return [];
  const prev = new Map<string, TilePos | null>([[key(from), null]]);
  const queue: TilePos[] = [from];
  while (queue.length) {
    const cur = queue.shift();
    if (!cur) break;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const next = { x: cur.x + dx, y: cur.y + dy };
      if (next.x < 0 || next.y < 0 || next.x >= width || next.y >= height) continue;
      const k = key(next);
      if (prev.has(k) || blocked.has(k)) continue;
      // no squeezing diagonally between two blocked tiles
      if (dx && dy && blocked.has(key({ x: cur.x + dx, y: cur.y })) && blocked.has(key({ x: cur.x, y: cur.y + dy }))) continue;
      prev.set(k, cur);
      if (isGoal(next)) {
        const path: TilePos[] = [];
        let at: TilePos | null = next;
        while (at && key(at) !== key(from)) { path.unshift(at); at = prev.get(key(at)) ?? null; }
        return path;
      }
      queue.push(next);
    }
  }
  return null;
}

export const tileKey = key;
export const adjacent = (a: TilePos, b: TilePos) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) <= 1;
