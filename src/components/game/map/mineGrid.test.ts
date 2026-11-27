import { describe, expect, it } from "vitest";
import { adjacent, findTilePath, tileKey } from "./mineGrid";

describe("mine floor paths", () => {
  it("walks one tile at a time around blocked rocks", () => {
    const blocked = new Set([tileKey({ x: 2, y: 0 }), tileKey({ x: 2, y: 1 })]);
    const path = findTilePath({ x: 0, y: 0 }, (t) => t.x === 4 && t.y === 0, blocked, 6, 4);
    expect(path?.at(-1)).toEqual({ x: 4, y: 0 });
    let at = { x: 0, y: 0 };
    for (const t of path ?? []) { expect(adjacent(at, t)).toBe(true); expect(blocked.has(tileKey(t))).toBe(false); at = t; }
  });
});
