import type {
  CompletionRecord,
  ContentRef,
  ContentType,
  Memory,
  Progress,
  ProgressV3,
} from "./types";
import { completionKey, createBlankProgressV3 } from "./progress-reducer";

const contentTypes = new Set<ContentType>(["story", "adventure", "minigame"]);
const legacyAdventureIds = new Set(["tram", "bike", "cafe", "park", "night"]);
const epoch = new Date(0).toISOString();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finiteNonNegativeInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : null;
}

function strings(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").map((item) => item.slice(0, 120)).slice(0, limit);
}

function safeDate(value: unknown): string {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return epoch;
  return new Date(value).toISOString();
}

function memory(value: unknown): Memory | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.caption !== "string") return null;
  return { id: value.id.slice(0, 120), completedAt: safeDate(value.completedAt), caption: value.caption.slice(0, 280) };
}

function contentRef(value: unknown): ContentRef | null {
  if (!isRecord(value) || typeof value.type !== "string" || !contentTypes.has(value.type as ContentType) || typeof value.id !== "string" || !value.id) return null;
  const version = value.version === undefined ? undefined : finiteNonNegativeInteger(value.version);
  if (version === null || version === 0) return null;
  return { type: value.type as ContentType, id: value.id.slice(0, 120), ...(version === undefined ? {} : { version }) };
}

function completion(value: unknown): CompletionRecord | null {
  if (!isRecord(value)) return null;
  const content = contentRef(value.content);
  if (!content) return null;
  const key = completionKey(content);
  const score = value.score === undefined ? undefined : finiteNonNegativeInteger(value.score);
  if (score === null) return null;
  return { key, content, completedAt: safeDate(value.completedAt), ...(score === undefined ? {} : { score }) };
}

function normalizeV2(value: Record<string, unknown>): ProgressV3 | null {
  const xp = finiteNonNegativeInteger(value.xp);
  const boops = finiteNonNegativeInteger(value.boops);
  if (xp === null || boops === null || !Array.isArray(value.completed) || !Array.isArray(value.memories) || !Array.isArray(value.wardrobe)) return null;
  const completed = strings(value.completed, 100).filter((id) => legacyAdventureIds.has(id));
  const memories = value.memories.map(memory).filter((item): item is Memory => item !== null).slice(0, 500);
  const progress: Progress = {
    version: 2,
    xp,
    boops,
    completed: completed as Progress["completed"],
    memories,
    wardrobe: strings(value.wardrobe, 100),
  };
  return migrateV2ToV3(progress);
}

export function migrateV2ToV3(value: Progress): ProgressV3 {
  const memories = value.memories.map((item) => memory(item)).filter((item): item is Memory => item !== null).slice(0, 500);
  const completions = Object.fromEntries(value.completed.map((id) => {
    const content = { type: "adventure" as const, id, version: 1 };
    const key = completionKey(content);
    return [key, { key, content, completedAt: memories.find((item) => item.id === id)?.completedAt ?? epoch }];
  }));
  return {
    ...createBlankProgressV3(),
    xp: finiteNonNegativeInteger(value.xp) ?? 0,
    boops: finiteNonNegativeInteger(value.boops) ?? 0,
    completions,
    memories,
    wardrobe: { unlocked: strings(value.wardrobe, 100), equipped: [] },
  };
}

export function progressVersion(value: unknown): 2 | 3 | null {
  if (!isRecord(value)) return null;
  return value.version === 2 || value.version === 3 ? value.version : null;
}

export function normalizeProgress(value: unknown): ProgressV3 {
  if (!isRecord(value)) return createBlankProgressV3();
  if (value.version === 2) return normalizeV2(value) ?? createBlankProgressV3();
  if (value.version !== 3) return createBlankProgressV3();

  const xp = finiteNonNegativeInteger(value.xp);
  const boops = finiteNonNegativeInteger(value.boops);
  if (xp === null || boops === null) return createBlankProgressV3();

  const completionEntries = isRecord(value.completions)
    ? Object.values(value.completions).map(completion).filter((item): item is CompletionRecord => item !== null).slice(0, 500)
    : [];
  const memories = Array.isArray(value.memories) ? value.memories.map(memory).filter((item): item is Memory => item !== null).slice(0, 500) : [];
  const achievements = isRecord(value.achievements)
    ? Object.fromEntries(Object.entries(value.achievements).flatMap(([id, item]) => isRecord(item) ? [[id.slice(0, 120), { unlockedAt: safeDate(item.unlockedAt) }]] : []).slice(0, 500))
    : {};
  const wardrobe = isRecord(value.wardrobe) ? value.wardrobe : {};
  const passport = isRecord(value.passport) ? value.passport : {};

  return {
    version: 3,
    xp,
    boops,
    completions: Object.fromEntries(completionEntries.map((item) => [item.key, item])),
    memories,
    unlockedRewards: strings(value.unlockedRewards, 500),
    achievements,
    wardrobe: { unlocked: strings(wardrobe.unlocked, 100), equipped: strings(wardrobe.equipped, 100) },
    passport: { visitedPlaceIds: strings(passport.visitedPlaceIds, 500), stamps: strings(passport.stamps, 500) },
  };
}
