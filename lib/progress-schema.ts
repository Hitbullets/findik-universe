import type { AdventureId, Memory, Progress, ProgressV3, CompletionRecord } from "./types";
import { blankProgressV3, createBlankProgressV3 } from "./progress-reducer";
export function migrateV2ToV3(value: Progress): ProgressV3 {
  const completions = Object.fromEntries(value.completed.map((id) => [`adventure:${id}`, { key: `adventure:${id}`, content: { type: "adventure" as const, id }, completedAt: value.memories.find((m) => m.id === id)?.completedAt || new Date(0).toISOString() }]));
  return { ...createBlankProgressV3(), xp: Math.max(0, Math.floor(value.xp)), boops: Math.max(0, Math.floor(value.boops)), completions, memories: value.memories.map((m) => ({ id: String(m.id), completedAt: m.completedAt, caption: String(m.caption).slice(0, 280) })).slice(0, 500), wardrobe: { unlocked: value.wardrobe.filter((id) => typeof id === "string").slice(0, 100), equipped: [] } };
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
      completions: candidate.completions && typeof candidate.completions === "object" ? Object.fromEntries(Object.entries(candidate.completions).filter(([, record]) => record && typeof record === "object" && typeof (record as CompletionRecord).key === "string" && (record as CompletionRecord).content && typeof (record as CompletionRecord).content.id === "string").slice(0, 500)) as ProgressV3["completions"] : {},
      memories: Array.isArray(candidate.memories) ? candidate.memories.filter((m): m is Memory => !!m && typeof m === "object" && typeof m.id === "string" && typeof m.completedAt === "string" && typeof m.caption === "string").map((m) => ({ id: m.id.slice(0, 120), completedAt: m.completedAt, caption: m.caption.slice(0, 280) })).slice(0, 500) : [],
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
