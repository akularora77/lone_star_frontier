import { Check, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGame } from "@/game/GameProvider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MASTERY_BADGE_NAME } from "@/game/gameConfig";
import { cn } from "@/lib/utils";
import { Bar } from "./Bar";
import { ItemIcon, StarBadge } from "./icons";
import { ItemDetails } from "./ItemDetails";

function StatsPanel() {
  const { player } = useGame();
  if (!player) return null;
  const low = player.stamina / player.max_stamina < 0.3;
  const atMax = player.xp_for_next_level === null;
  const xpInto = player.experience_xp - player.xp_for_current_level;
  const xpSpan = (player.xp_for_next_level ?? player.experience_xp) - player.xp_for_current_level;
  return (
    <section aria-label="Stats" className="space-y-3">
      <h2 className="text-lg font-bold text-dusty-gold">Stats</h2>
      <Bar label="HP" value={player.health_hp} max={player.max_hp} colorClass="bg-hp" />
      <div className="space-y-2">
        <Bar label="Stamina" value={player.stamina} max={player.max_stamina} colorClass={low ? "bg-stamina-low" : "bg-stamina"} />
      </div>
      <div className="flex items-baseline justify-between border-t border-wood pt-3">
        <span className="font-display font-bold">Mining Level</span>
        <span className="font-display text-2xl font-black text-dusty-gold tabular-nums">{player.mining_level}</span>
      </div>
      <Bar
        label="XP"
        value={atMax ? 1 : xpInto}
        max={atMax ? 1 : xpSpan}
        colorClass="bg-xp"
        text={atMax ? `${player.experience_xp} (max)` : `${player.experience_xp} / ${player.xp_for_next_level}`}
      />
    </section>
  );
}

function InventoryGrid() {
  const { player, selectedItemId, select, equip, unequip } = useGame();
  if (!player) return null;
  const slots = Array.from({ length: player.inventory_capacity }, (_, i) => player.inventory[i] ?? null);
  const selected = player.inventory.find((i) => i.id === selectedItemId) ?? null;
  const equipped = (id: string) => player.equipped_pickaxe?.id === id || Object.values(player.equipped_outfit).includes(id);
  return (
    <section aria-label="Inventory" className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-dusty-gold">Inventory</h2>
        <span className="text-xs opacity-80">{player.inventory.length}/{player.inventory_capacity}</span>
      </div>
      <TooltipProvider delayDuration={200}><div className="grid grid-cols-4 gap-1.5">
        {slots.map((row, i) => {
          const cell = (
          <Button
            variant="ghost"
            key={row?.id ?? `empty-${i}`}
            type="button"
            disabled={!row}
            aria-label={row ? `${row.name}${row.type === "ore" ? `, ${row.quantity}` : ""}${equipped(row.id) ? ", equipped" : ""}` : "Empty slot"}
            onClick={() => {
              if (!row) return;
              if (row.type === "clothing") {
                select(row.id);
                void (equipped(row.id) ? unequip(row.id) : equip(row.id));
              } else {
                select(row.id === selectedItemId ? null : row.id);
              }
            }}
            className={cn(
              "relative grid h-auto w-full aspect-square place-items-center rounded-sm border border-wood bg-wood-dark/70 p-0 transition-colors [&>svg]:size-[90%]",
              row && "hover:border-dusty-gold",
              row && equipped(row.id) && "border-dusty-gold/60 bg-wood ring-1 ring-inset ring-dusty-gold/40",
              row?.id === selectedItemId && "border-dusty-gold bg-wood ring-2 ring-dusty-gold",
            )}
          >
            {row && (row.type === "ore" ? <span className="pointer-events-none absolute inset-[20%]"><ItemIcon id={row.id} type={row.type} tier={row.tier} className="block size-full" /></span> : <ItemIcon id={row.id} type={row.type} tier={row.tier} className="size-[90%]" />)}
            {row?.type === "ore" && <span className="absolute left-1 top-0 text-xs font-bold text-dusty-gold tabular-nums">{row.quantity}</span>}
            {row && equipped(row.id) && <Check aria-hidden className="absolute bottom-1 right-1 size-3! text-dusty-gold" />}
          </Button>
          );
          return row ? <Tooltip key={row.id}><TooltipTrigger asChild>{cell}</TooltipTrigger><TooltipContent side="left" className="w-64 max-w-[calc(100vw-2rem)] border border-wood bg-wood-dark p-3 text-parchment"><ItemDetails item={row} /></TooltipContent></Tooltip> : cell;
        })}
      </div></TooltipProvider>
      {selected && (
        <div className="rounded-sm border border-wood bg-wood/60 p-2 text-sm">
          <ItemDetails item={selected} />
          {selected.type !== "ore" && (
            equipped(selected.id)
              ? <div className="mt-2 flex items-center justify-between gap-2"><p className="text-xs text-dusty-gold">Equipped</p>{selected.type === "clothing" && <Button variant="outline" size="sm" onClick={() => void unequip(selected.id)} className="h-7 text-xs">Unequip</Button>}</div>
              : <Button type="button" size="sm" onClick={() => void equip(selected.id)} className="mt-1 h-7 text-xs">Equip</Button>
          )}
        </div>
      )}
    </section>
  );
}

function BadgeGoldBar() {
  const { player, selectedItemId, requestQuote } = useGame();
  if (!player) return null;
  const sel = player.inventory.find((i) => i.id === selectedItemId && i.type === "ore");
  return (
    <section aria-label="Badge and gold" className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-t border-wood pt-3">
      <div className="grid size-14 place-items-center rounded-sm border border-wood bg-wood-dark/70" title={player.mastery_badge_earned ? MASTERY_BADGE_NAME : `${MASTERY_BADGE_NAME}: reach Mining Level 10`}>
        <StarBadge earned={player.mastery_badge_earned} />
        <span className="sr-only">{player.mastery_badge_earned ? `${MASTERY_BADGE_NAME} earned` : "Badge slot empty"}</span>
      </div>
      <div className="min-w-0 space-y-1.5">
        <p className="flex items-center gap-1.5 font-display text-xl font-bold text-dusty-gold">
          <Coins className="size-5 shrink-0" /> <span className="tabular-nums">{player.gold}</span> <span className="text-sm font-normal text-sidebar-foreground">gold</span>
        </p>
        <button
          type="button"
          disabled={!sel}
          onClick={() => sel && void requestQuote(sel.id, "sell", sel.quantity)}
          className="w-full truncate rounded-sm border border-dusty-gold px-2 py-1 text-sm font-semibold text-dusty-gold transition-colors enabled:hover:bg-dusty-gold enabled:hover:text-wood-dark disabled:opacity-40"
        >
          {sel ? `Sell all ${sel.name}` : "Select ore to sell all"}
        </button>
      </div>
    </section>
  );
}

export function Sidebar() {
  return (
    <aside className="wood-frame flex flex-col gap-5 p-4 text-sidebar-foreground lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
      <StatsPanel />
      <InventoryGrid />
      <BadgeGoldBar />
    </aside>
  );
}
