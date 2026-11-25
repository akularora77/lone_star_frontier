import bartender from "@/assets/portraits/bartender.jpg";
import prospector from "@/assets/portraits/prospector.jpg";
import storeManager from "@/assets/portraits/store_manager.jpg";

/** portrait_key (SCHEMA.md npcs table) -> image */
export const PORTRAITS: Record<string, string> = {
  portrait_store_manager: storeManager,
  portrait_bartender: bartender,
  portrait_prospector: prospector,
};
