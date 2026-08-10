export const isInternalBeta = process.env.NEXT_PUBLIC_FINDIK_INTERNAL_BETA === "1";

export const productionAdventureIds = ["tram"] as const;
export const productionPanels = ["home", "adventures", "album", "vault"] as const;

export type ProductionPanel = (typeof productionPanels)[number];
export type UniversePanel = ProductionPanel | "stories" | "world";

export function isProductionAdventure(id: string) {
  return productionAdventureIds.some((allowed) => allowed === id);
}
