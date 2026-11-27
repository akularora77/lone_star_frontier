import type { InventoryRow } from "@/game/types";

export function ItemDetails({ item }: { item: InventoryRow }) {
  const stats: [string, string][] = [["Base value", `${item.base_value} gold`]];
  if (item.type === "clothing") {
    stats.push(["Stamina savings", `${item.stamina_modifier ?? 0}%`], ["Bonus ore chance", `${item.yield_modifier ?? 0}%`]);
  }
  if (item.type === "pickaxe") stats.push(["Tool tier", `${item.tier}`]);
  if (item.type === "ore") {
    if (item.xp_per_mine !== undefined) stats.push(["XP per ore", `${item.xp_per_mine}`]);
    if (item.required_mining_level !== undefined) stats.push(["Mining level", `${item.required_mining_level}`]);
    if (item.required_pickaxe_tier !== undefined) stats.push(["Pickaxe tier", `${item.required_pickaxe_tier}`]);
    if (item.base_stamina !== undefined) stats.push(["Base stamina / swing", `${item.base_stamina}`]);
    if (item.swing_seconds !== undefined) stats.push(["Swing duration", `${item.swing_seconds}s`]);
  }
  return <div className="space-y-2">
    <p className="font-display text-base font-bold">{item.name}</p>
    <p className="text-sm opacity-80">{item.description}</p>
    <dl className="space-y-1 text-sm tabular-nums">
      {stats.map(([label, value]) => <div key={label} className="flex justify-between gap-3"><dt>{label}</dt><dd className="font-semibold">{value}</dd></div>)}
    </dl>
  </div>;
}