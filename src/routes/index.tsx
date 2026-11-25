import { createFileRoute } from "@tanstack/react-router";
import { GameScreen } from "@/components/game/GameScreen";
import { GAME_TITLE, HUB_CITY_NAME } from "@/game/gameConfig";

const description = `A Wild West mining RPG. Dig ten floors beneath ${HUB_CITY_NAME}, trade with the townsfolk and earn your badge.`;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: GAME_TITLE },
      { name: "description", content: description },
      { property: "og:title", content: GAME_TITLE },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GameScreen,
});
