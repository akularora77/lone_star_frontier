import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { getGameService, type GameService } from "./api";
import { NPCS } from "./seed";
import { MASTERY_BADGE_NAME } from "./gameConfig";
import { mineRockToCompletion } from "./miningAction";
import { isGameError, type Location, type MineLevelInfo, type MineResult, type NpcId, type PlayerState, type Quote, type StoreItem } from "./types";

export interface DialogueLine { from: "npc" | "player"; text: string }
export interface DialogueState { npcId: NpcId; lines: DialogueLine[]; lastDelta: number }

interface GameContextValue {
  player: PlayerState | null;
  levels: MineLevelInfo[];
  store: StoreItem[];
  dialogue: DialogueState | null;
  quote: Quote | null;
  selectedItemId: string | null;
  busy: boolean;
  move(loc: Location): Promise<void>;
  swing(floor: number, spot: number): Promise<MineResult | null>;
  equip(itemId: string): Promise<void>;
  unequip(itemId: string): Promise<void>;
  select(itemId: string | null): void;
  openNpc(npcId: NpcId): void;
  closeDialogue(): void;
  say(text: string): Promise<void>;
  requestQuote(itemId: string, action: "buy" | "sell", quantity: number): Promise<void>;
  confirmTrade(): Promise<void>;
  dismissQuote(): void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}

const GREETINGS: Record<NpcId, string> = {
  store_manager: "Afternoon, partner. Buyin', sellin', or just jawin'?",
  saloon_bartender: "Pull up a stool. What'll it be?",
  saloon_prospector: "Heh. Another fresh face headed for the mine, I reckon.",
};

export function GameProvider({ children }: { children: ReactNode }) {
  const svcRef = useRef<GameService | null>(null);
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [levels, setLevels] = useState<MineLevelInfo[]>([]);
  const [store, setStore] = useState<StoreItem[]>([]);
  const [dialogue, setDialogue] = useState<DialogueState | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [selectedItemId, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshLists = useCallback(async () => {
    const s = svcRef.current;
    if (!s) return;
    const [l, st] = await Promise.all([s.list_mine_levels(), s.list_store_items()]);
    setLevels(l);
    setStore(st);
  }, []);

  const run = useCallback(async <T,>(fn: (s: GameService) => Promise<T>): Promise<T | null> => {
    const s = svcRef.current;
    if (!s) return null;
    try {
      return await fn(s);
    } catch (e) {
      toast.error(isGameError(e) ? e.message : "Something went wrong.");
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getGameService().then(async (s) => {
      if (cancelled) return;
      svcRef.current = s;
      setPlayer(await s.get_player_state());
      await refreshLists();
    });
    return () => { cancelled = true; };
  }, [refreshLists]);

  // Stamina only changes through tick (SCHEMA.md).
  useEffect(() => {
    let last = Date.now();
    const id = window.setInterval(() => {
      const s = svcRef.current;
      if (!s) return;
      const t = Date.now();
      const elapsed = t - last;
      last = t;
      void s.tick(elapsed).then(setPlayer);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const value: GameContextValue = {
    player, levels, store, dialogue, quote, selectedItemId, busy,
    async move(loc) {
      const st = await run((s) => s.move(loc));
      if (st) {
        setPlayer(st);
        if (dialogue && NPCS.find((n) => n.id === dialogue.npcId)?.location !== loc) setDialogue(null);
      }
    },
    async swing(floor, spot) {
      const r = await run((s) => mineRockToCompletion(s, floor, spot, setPlayer));
      if (r) {
        const st = await run((s) => s.get_player_state());
        if (st) {
          if (st.mining_level > (player?.mining_level ?? 1)) toast.success(`Mining Level ${st.mining_level}!`);
          if (st.mastery_badge_earned && !player?.mastery_badge_earned) toast.success(`You earned the ${MASTERY_BADGE_NAME}!`);
          setPlayer(st);
        }
        await refreshLists();
      }
      return r;
    },
    async equip(itemId) {
      const st = await run((s) => s.equip_item(itemId));
      if (st) { setPlayer(st); await refreshLists(); }
    },
    async unequip(itemId) {
      const st = await run((s) => s.unequip_item(itemId));
      if (st) { setPlayer(st); await refreshLists(); }
    },
    select(itemId) { setSelected(itemId); },
    openNpc(npcId) {
      setDialogue((d) => (d?.npcId === npcId ? d : { npcId, lines: [{ from: "npc", text: GREETINGS[npcId] }], lastDelta: 0 }));
    },
    closeDialogue() { setDialogue(null); setQuote(null); },
    async say(text) {
      if (!dialogue || !text.trim()) return;
      const npcId = dialogue.npcId;
      setDialogue((d) => d && { ...d, lines: [...d.lines, { from: "player", text }] });
      setBusy(true);
      const r = await run((s) => s.talk_to_npc(npcId, text));
      setBusy(false);
      if (r) {
        setDialogue((d) => d && { ...d, lines: [...d.lines, { from: "npc", text: r.reply }], lastDelta: r.rapport_delta });
        const st = await run((s) => s.get_player_state());
        if (st) setPlayer(st);
      }
    },
    async requestQuote(itemId, action, quantity) {
      const q = await run((s) => s.get_store_quote(itemId, action, quantity));
      if (q) {
        setQuote(q);
        setDialogue((d) => d ?? { npcId: "store_manager", lines: [{ from: "npc", text: GREETINGS.store_manager }], lastDelta: 0 });
      }
    },
    async confirmTrade() {
      if (!quote) return;
      const st = await run((s) => s.execute_trade(quote.quote_id));
      if (st) {
        toast.success(quote.action_type === "buy" ? "Pleasure doin' business." : `Sold for ${quote.total_price} gold.`);
        setPlayer(st);
        setQuote(null);
        if (!st.inventory.some((i) => i.id === selectedItemId)) setSelected(null);
        await refreshLists();
      } else {
        setQuote(null);
      }
    },
    dismissQuote() { setQuote(null); },
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
