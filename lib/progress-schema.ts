import type { AdventureId, Memory, Progress, ProgressV3 } from "./types";
import { blankProgressV3 } from "./progress-reducer";
export function migrateV2ToV3(value: Progress): ProgressV3 {
  const completions = Object.fromEntries(value.completed.map((id) => [`adventure:${id}`, { key: `adventure:${id}`, content: { type: "adventure" as const, id }, completedAt: value.memories.find((m) => m.id === id)?.completedAt || new Date(0).toISOString() }]));
  return { ...blankProgressV3, xp: value.xp, boops: value.boops, completions, memories: value.memories, wardrobe: { unlocked: value.wardrobe, equipped: [] } };
}
export function normalizeProgress(value: unknown): ProgressV3 {
  if (value && typeof value === "object" && (value as { version?: number }).version === 3) {
    const candidate = value as Partial<ProgressV3>;
    if (!Number.isFinite(candidate.xp) || !Number.isFinite(candidate.boops) || candidate.xp! < 0 || candidate.boops! < 0) return blankProgressV3;
    return {
      ...blankProgressV3,
      ...candidate,
      xp: Math.floor(candidate.xp!),
      boops: Math.floor(candidate.boops!),
      completions: candidate.completions && typeof candidate.completions === "object" ? candidate.completions : {},
      memories: Array.isArray(candidate.memories) ? candidate.memories.slice(0, 500) : [],
      unlockedRewards: Array.isArray(candidate.unlockedRewards) ? candidate.unlockedRewards.filter((id): id is string => typeof id === "string").slice(0, 500) : [],
      achievements: candidate.achievements && typeof candidate.achievements === "object" ? candidate.achievements : {},
      wardrobe: candidate.wardrobe && typeof candidate.wardrobe === "object" ? { unlocked: Array.isArray(candidate.wardrobe.unlocked) ? candidate.wardrobe.unlocked.filter((id): id is string => typeof id === "string") : [], equipped: Array.isArray(candidate.wardrobe.equipped) ? candidate.wardrobe.equipped.filter((id): id is string => typeof id === "string") : [] } : { unlocked: [], equipped: [] },
      passport: candidate.passport && typeof candidate.passport === "object" ? { visitedPlaceIds: Array.isArray(candidate.passport.visitedPlaceIds) ? candidate.passport.visitedPlaceIds.filter((id): id is string => typeof id === "string") : [], stamps: Array.isArray(candidate.passport.stamps) ? candidate.passport.stamps.filter((id): id is string => typeof id === "string") : [] } : { visitedPlaceIds: [], stamps: [] },
    };
  }
  if (value && typeof value === "object" && (value as { version?: number }).version === 2) return migrateV2ToV3(value as Progress);
  return blankProgressV3;
}
export const legacyAdventureIds: AdventureId[] = ["tram", "bike", "cafe", "park", "night"];
