import { cn } from "@/lib/utils";
import type { ItemType } from "@/game/types";

const ORE_CLASS: Record<string, string> = {
  ore_copper: "bg-ore-copper", ore_iron: "bg-ore-iron", ore_silver: "bg-ore-silver",
  ore_gold: "bg-ore-gold", ore_mithril: "bg-ore-mithril",
};

export function OreGem({ oreId, className }: { oreId: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block rotate-45 rounded-[3px] border-2 border-wood-dark shadow-[inset_-3px_-3px_0_rgb(0_0_0/0.25),inset_3px_3px_0_rgb(255_255_255/0.35)]", ORE_CLASS[oreId] ?? "bg-rock", className ?? "size-5")}
    />
  );
}

export function PickaxeIcon({ tier, className }: { tier: number; className?: string }) {
  const head = ["var(--ore-copper)", "var(--ore-iron)", "var(--ore-silver)", "var(--ore-gold)", "var(--ore-mithril)"][tier - 1] ?? "var(--ore-iron)";
  return (
    <svg viewBox="5 3 25 26" aria-hidden className={cn("size-7", className)}>
      <path d="M8 26 L22 12" stroke="var(--saddle)" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M12 6 Q22 4 28 12 Q22 9 17 10 Z" fill={head} stroke="var(--wood-dark)" strokeWidth="1.5" />
    </svg>
  );
}

export function ClothingIcon({ tier, id, className }: { tier: number; id?: string; className?: string }) {
  const fill = ["var(--stamina-low)", "var(--saddle)", "var(--wood)"][tier - 1] ?? "var(--character-shirt)";
  return (
    <svg viewBox={id === "basic_hat" ? "1 6 30 20" : id === "basic_bottom" ? "6 4 20 24" : "3 4 26 24"} aria-hidden className={cn("size-7", className)}>
      {id === "basic_bottom" ? <path d="M9 5 H23 L25 27 H18 L16 14 L14 27 H7 Z" fill="var(--character-trousers)" stroke="var(--wood-dark)" strokeWidth="1.5" />
        : id === "basic_hat" ? <><path d="M9 19 L11 8 H21 L23 19 Z" fill="var(--wood)" stroke="var(--wood-dark)" strokeWidth="1.5" /><ellipse cx="16" cy="21" rx="14" ry="4" fill="var(--wood-dark)" /><path d="M10 16 H22" stroke="var(--dusty-gold)" strokeWidth="2" /></>
        : <path d="M10 5 L16 9 L22 5 L28 10 L24 14 L24 27 L8 27 L8 14 L4 10 Z" fill={fill} stroke="var(--wood-dark)" strokeWidth="1.5" strokeLinejoin="round" />}
    </svg>
  );
}

export function StarBadge({ className, earned = true }: { className?: string; earned?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-10", className)}>
      <polygon
        points="16,2 20,12 31,12 22,19 25,30 16,23 7,30 10,19 1,12 12,12"
        fill={earned ? "var(--dusty-gold)" : "transparent"}
        stroke={earned ? "var(--wood-dark)" : "var(--wood)"}
        strokeWidth="1.5"
        strokeDasharray={earned ? undefined : "3 2"}
      />
      {earned && <circle cx="16" cy="16.5" r="3.5" fill="var(--saddle)" />}
    </svg>
  );
}

export function ItemIcon({ id, type, tier, className }: { id: string; type: ItemType; tier: number; className?: string }) {
  if (type === "ore") return <OreGem oreId={id} {...(className ? { className } : {})} />;
  if (type === "pickaxe") return <PickaxeIcon tier={tier} {...(className ? { className } : {})} />;
  return <ClothingIcon id={id} tier={tier} {...(className ? { className } : {})} />;
}
