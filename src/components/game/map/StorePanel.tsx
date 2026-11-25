import { X } from "lucide-react";
import { useGame } from "@/game/GameProvider";
import { GENERAL_STORE_NAME, MINING_NPC_NAME } from "@/game/gameConfig";
import { PORTRAITS } from "@/game/portraits";
import { ItemIcon, OreGem } from "../icons";

export function StorePanel({ onClose }: { onClose: () => void }) {
  const { store, player, openNpc, requestQuote } = useGame();
  const rapport = player?.rapport.find((r) => r.npc_id === "store_manager")?.rapport_score ?? 50;
  const gear = store.filter((s) => s.mode === "sells");
  const ores = store.filter((s) => s.mode === "buys");
  return (
    <section className="parchment-panel max-h-full space-y-3 overflow-y-auto p-4" aria-label={GENERAL_STORE_NAME}>
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <img src={PORTRAITS["portrait_store_manager"]} alt={MINING_NPC_NAME} width={80} height={80} className="size-16 rounded-sm border-4 border-wood object-cover" />
        <div className="min-w-0">
          <h2 className="truncate text-xl font-bold">{GENERAL_STORE_NAME}</h2>
          <p className="text-sm text-muted-foreground">{MINING_NPC_NAME} · Rapport {rapport}</p>
          <button type="button" onClick={() => openNpc("store_manager")} className="mt-1 rounded-sm bg-primary px-2 py-0.5 text-sm font-semibold text-primary-foreground hover:brightness-110">Talk</button>
        </div>
        <button type="button" onClick={onClose} aria-label="Leave the store" className="self-start rounded-sm p-1 hover:bg-parchment-deep"><X className="size-5" /></button>
      </div>
      <ul className="divide-y divide-wood/30">
        {gear.map((g) => (
          <li key={g.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 py-1.5">
            <ItemIcon id={g.id} type={g.type} tier={g.tier} className="size-6" />
            <div className="min-w-0">
              <p className="truncate font-semibold">{g.name}</p>
              <p className="truncate text-xs text-muted-foreground">{g.description}</p>
            </div>
            {g.owned ? (
              <span className="rounded-sm bg-parchment-deep px-2 py-0.5 text-xs font-semibold">Owned</span>
            ) : (
              <button type="button" onClick={() => void requestQuote(g.id, "buy", 1)} className="rounded-sm border border-wood px-2 py-0.5 text-sm hover:bg-parchment-deep">~{g.base_value}g · Quote</button>
            )}
          </li>
        ))}
      </ul>
      <div>
        <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-saddle">Buying ore</h3>
        <div className="flex flex-wrap gap-3 text-sm">
          {ores.map((o) => <span key={o.id} className="inline-flex items-center gap-1.5"><OreGem oreId={o.id} className="size-3.5" /> {o.name} ~{o.base_value}g</span>)}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Select ore in your pack, then use Sell all. Prices shift with rapport.</p>
      </div>
    </section>
  );
}
