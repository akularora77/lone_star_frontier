import { useEffect, useRef, useState, type FormEvent } from "react";
import { Handshake, Send, X } from "lucide-react";
import { useGame } from "@/game/GameProvider";
import { PORTRAITS } from "@/game/portraits";
import { CATALOG, NPCS } from "@/game/seed";
import { cn } from "@/lib/utils";
import { Bar } from "./Bar";

function QuotePanel() {
  const { quote, confirmTrade, dismissQuote } = useGame();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);
  if (!quote) return null;
  const item = CATALOG.find((i) => i.id === quote.item_id);
  const left = Math.max(0, Math.ceil((quote.expires_at - now) / 1000));
  return (
    <div className="rounded-sm border-2 border-dusty-gold bg-wood-dark/80 p-3 text-parchment" role="region" aria-label="Quote">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-display font-bold text-dusty-gold">{quote.action_type === "buy" ? "Buy" : "Sell"} {item?.name}</p>
        <p className={cn("tabular-nums text-sm", left <= 10 && "font-bold text-stamina-low")}>0:{String(left).padStart(2, "0")}</p>
      </div>
      <p className="tabular-nums">
        {quote.unit_price}g × {quote.quantity} = <strong className="text-dusty-gold">{quote.total_price} gold</strong>
      </p>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={() => void confirmTrade()} className="rounded-sm bg-dusty-gold px-3 py-1 text-sm font-bold text-wood-dark hover:brightness-110">Confirm</button>
        <button type="button" onClick={dismissQuote} className="rounded-sm border border-parchment/50 px-3 py-1 text-sm hover:bg-wood">Not now</button>
      </div>
    </div>
  );
}

export function DialogueHud() {
  const { dialogue, player, closeDialogue, say, busy, selectedItemId, requestQuote } = useGame();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const lineCount = dialogue?.lines.length ?? 0;
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lineCount]);
  if (!dialogue || !player) return null;
  const npc = NPCS.find((n) => n.id === dialogue.npcId)!;
  const rapport = player.rapport.find((r) => r.npc_id === npc.id)?.rapport_score ?? 50;
  const isStore = npc.id === "store_manager";
  const sel = player.inventory.find((i) => i.id === selectedItemId && i.type === "ore");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText("");
    void say(t);
  };

  return (
    <section aria-label={`Talking with ${npc.name}`} className="wood-frame sticky bottom-0 z-20 grid gap-3 p-3 text-sidebar-foreground sm:grid-cols-[auto_minmax(0,1fr)] sm:p-4">
      <div className="flex gap-3 sm:flex-col sm:items-center">
        <img src={PORTRAITS[npc.portrait_key]} alt={npc.name} width={160} height={160} className="size-20 shrink-0 rounded-sm border-4 border-dusty-gold object-cover sm:size-36" />
        <div className="min-w-0 flex-1 sm:w-36 sm:flex-none">
          <p className="truncate font-display font-bold text-dusty-gold">{npc.name}</p>
          <Bar label="Rapport" value={rapport} max={100} colorClass="bg-dusty-gold" text={`${rapport}${dialogue.lastDelta ? ` (${dialogue.lastDelta > 0 ? "+" : ""}${dialogue.lastDelta})` : ""}`} />
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div ref={scrollRef} className="max-h-36 min-h-20 flex-1 space-y-1.5 overflow-y-auto rounded-sm bg-parchment p-2 text-ink" aria-live="polite">
            {dialogue.lines.map((l, i) => (
              <p key={i} className={cn(l.from === "player" && "text-right italic text-saddle")}>
                {l.from === "npc" ? <><strong className="font-display">{npc.name}:</strong> {l.text}</> : l.text}
              </p>
            ))}
            {busy && <p className="text-muted-foreground">…</p>}
          </div>
          <button type="button" onClick={closeDialogue} aria-label="Close conversation" className="rounded-sm p-1 hover:bg-wood"><X className="size-5" /></button>
        </div>
        <form onSubmit={submit} className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Say something to the ${npc.name}…`}
            aria-label="Your message"
            className="min-w-0 flex-1 rounded-sm border border-wood bg-parchment px-2 py-1.5 text-ink placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-dusty-gold"
          />
          <button type="submit" disabled={busy || !text.trim()} className="inline-flex items-center gap-1 rounded-sm bg-dusty-gold px-3 font-semibold text-wood-dark enabled:hover:brightness-110 disabled:opacity-50">
            <Send className="size-4" /> Talk
          </button>
        </form>
        {isStore && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 opacity-90"><Handshake className="size-4" /> Trade: quote gear from the shelf, or</span>
            <button type="button" disabled={!sel} onClick={() => sel && void requestQuote(sel.id, "sell", sel.quantity)} className="rounded-sm border border-dusty-gold px-2 py-0.5 text-dusty-gold enabled:hover:bg-dusty-gold enabled:hover:text-wood-dark disabled:opacity-40">
              {sel ? `Sell all ${sel.name} (${sel.quantity})` : "Select ore to sell all"}
            </button>
          </div>
        )}
        <QuotePanel />
      </div>
    </section>
  );
}
