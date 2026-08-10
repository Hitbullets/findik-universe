import { authoredAdventures } from "./adventures";
import { minigames } from "./minigames";
import { stories } from "./stories";
import type { Catalog } from "./types";
export const catalog: Catalog = { stories, adventures: authoredAdventures, minigames };
export function validateCatalog(value: Catalog = catalog) {
  const ids = [...value.stories, ...value.adventures, ...value.minigames].map((item) => item.id);
  return new Set(ids).size === ids.length && value.adventures.every((a) => a.beats.every((b) => !b.minigameId || value.minigames.some((m) => m.id === b.minigameId)));
}
