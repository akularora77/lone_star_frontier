import { useCallback, useEffect, useRef, useState } from "react";

export interface Pt { x: number; y: number }

/** Animates a token toward a target at a given speed (map units per second). Visual only. */
export function useWalker(initial: Pt) {
  const [pos, setPos] = useState<Pt>(initial);
  const posRef = useRef(initial);
  const raf = useRef<number | null>(null);
  const [moving, setMoving] = useState(false);
  const [facing, setFacing] = useState<1 | -1>(1);

  const stop = useCallback(() => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
    setMoving(false);
  }, []);

  const place = useCallback((p: Pt) => { stop(); posRef.current = p; setPos(p); }, [stop]);

  const walkTo = useCallback((target: Pt, speed: number, onArrive?: () => void, via: Pt[] = []) => {
    stop();
    const start = { ...posRef.current };
    const points = [start, ...via, target];
    const lengths = points.slice(1).map((point, i) => {
      const previous = points[i] ?? start;
      return Math.hypot(point.x - previous.x, point.y - previous.y);
    });
    const dist = lengths.reduce((sum, length) => sum + length, 0);
    if (target.x !== start.x) setFacing(target.x > start.x ? 1 : -1);
    if (dist < 2) { onArrive?.(); return; }
    const dur = (dist / speed) * 1000;
    const t0 = performance.now();
    setMoving(true);
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      let remaining = dist * k;
      let p = target;
      for (let i = 0; i < lengths.length; i++) {
        const length = lengths[i] ?? 0;
        const from = points[i]; const to = points[i + 1];
        if (!from || !to) continue;
        if (remaining <= length && length > 0) {
          const fraction = remaining / length;
          p = { x: from.x + (to.x - from.x) * fraction, y: from.y + (to.y - from.y) * fraction };
          if (to.x !== from.x) setFacing(to.x > from.x ? 1 : -1);
          break;
        }
        remaining -= length;
      }
      posRef.current = p;
      setPos(p);
      if (k < 1) raf.current = requestAnimationFrame(step);
      else { raf.current = null; setMoving(false); onArrive?.(); }
    };
    raf.current = requestAnimationFrame(step);
  }, [stop]);

  useEffect(() => stop, [stop]);
  const current = useCallback(() => posRef.current, []);
  return { pos, moving, facing, walkTo, place, face: setFacing, current };
}
