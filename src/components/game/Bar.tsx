import { cn } from "@/lib/utils";

export function Bar({ label, value, max, colorClass, text }: { label: string; value: number; max: number; colorClass: string; text?: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 100;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-display font-bold tracking-wide">{label}</span>
        <span className="tabular-nums opacity-90">{text ?? `${value} / ${max}`}</span>
      </div>
      <div className="mt-1 h-3 overflow-hidden rounded-sm border border-wood-dark bg-wood-dark/60" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
        <div className={cn("h-full transition-[width] duration-500", colorClass)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
