import { GameProvider } from "@/game/GameProvider";
import { DialogueHud } from "./DialogueHud";
import { Sidebar } from "./Sidebar";
import { WorldViewport } from "./WorldViewport";

export function GameScreen() {
  return (
    <GameProvider>
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="flex min-w-0 flex-col">
          <div className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">
            <WorldViewport />
          </div>
          <DialogueHud />
        </main>
        <Sidebar />
      </div>
    </GameProvider>
  );
}
