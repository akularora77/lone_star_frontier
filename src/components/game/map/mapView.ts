import type { MouseEvent } from "react";
import type { Pt } from "./useWalker";

/** A fixed, non-orbiting camera follows the token inside the world bounds. */
export function followingView(pos: Pt, worldWidth: number, worldHeight: number, width: number, height: number) {
  const x = Math.max(0, Math.min(worldWidth - width, pos.x - width / 2));
  const y = Math.max(0, Math.min(worldHeight - height, pos.y - height * 0.65));
  return `${x} ${y} ${width} ${height}`;
}

export function groundPoint(e: MouseEvent<SVGElement>): Pt | null {
  const svg = e.currentTarget.ownerSVGElement;
  const matrix = svg?.getScreenCTM();
  if (!svg || !matrix) return null;
  const point = svg.createSVGPoint();
  point.x = e.clientX; point.y = e.clientY;
  const local = point.matrixTransform(matrix.inverse());
  return { x: local.x, y: local.y };
}
