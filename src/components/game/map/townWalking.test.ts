import { describe, expect, it } from "vitest";
import { BUILDINGS, crossesBuilding, insideBuilding, openGround, townPath } from "./townWalking";

describe("free town walking", () => {
  it("walks directly to open ground in both axes, not a fixed street line", () => {
    expect(townPath({ x: 230, y: 375 }, { x: 430, y: 550 })).toEqual([{ x: 430, y: 550 }]);
    expect(townPath({ x: 430, y: 550 }, { x: 480, y: 160 })).toEqual([{ x: 480, y: 160 }]);
  });
  it("routes around both building footprints without entering them", () => {
    for (const [start, end] of [
      [{ x: 30, y: 200 }, { x: 450, y: 200 }],
      [{ x: 480, y: 180 }, { x: 850, y: 180 }],
    ]) {
      if (!start || !end) throw new Error("Missing test point");
      const path = townPath(start, end);
      expect(path.at(-1)).toEqual(end);
      expect(path.length).toBeGreaterThan(1);
      let from = start;
      for (const to of path) {
        expect(crossesBuilding(from, to)).toBe(false);
        for (let i = 0; i <= 100; i++) {
          const sample = { x: from.x + (to.x - from.x) * i / 100, y: from.y + (to.y - from.y) * i / 100 };
          expect(BUILDINGS.some((b) => insideBuilding(sample, b))).toBe(false);
        }
        from = to;
      }
    }
  });
  it("keeps targets inside the map and moves building targets to open edges", () => {
    expect(openGround({ x: -100, y: 999 })).toEqual({ x: 30, y: 600 });
    for (const point of [{ x: 200, y: 250 }, { x: 650, y: 250 }]) {
      expect(BUILDINGS.some((b) => insideBuilding(openGround(point), b))).toBe(false);
    }
  });
});