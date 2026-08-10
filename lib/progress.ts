import type { Adventure, Progress } from "./types";
import { normalizeProgress } from "./progress-schema";
import type { ProgressV3 } from "./types";

const key = "findik-universe-progress-v2";
export const blankProgress: Progress = { version: 2, xp: 0, completed: [], boops: 0, memories: [], wardrobe: [] };

export function loadProgress(): Progress {
  if (typeof window === "undefined") return blankProgress;
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "null");
    if (value?.version === 2) return { ...blankProgress, ...value };
    if (value?.version === 3) {
      const completed = Object.values(value.completions || {}).map((record: any) => record.content?.id).filter((id: string): id is Progress["completed"][number] => ["tram", "bike", "cafe", "park", "night"].includes(id));
      return { ...blankProgress, xp: value.xp || 0, boops: value.boops || 0, completed, memories: (value.memories || []).filter((memory: any) => ["tram", "bike", "cafe", "park", "night"].includes(memory.id)), wardrobe: value.wardrobe?.unlocked || [] };
    }
    return blankProgress;
  } catch { return blankProgress; }
}

export function loadProgressV3(): ProgressV3 {
  if (typeof window === "undefined") return normalizeProgress(null);
  try { return normalizeProgress(JSON.parse(window.localStorage.getItem(key) || "null")); } catch { return normalizeProgress(null); }
}

export function persistProgressV3(progress: ProgressV3) { window.localStorage.setItem(key, JSON.stringify(progress)); }

export function persistProgress(progress: Progress) { window.localStorage.setItem(key, JSON.stringify(progress)); }

export function completeAdventure(progress: Progress, adventure: Adventure): Progress {
  if (progress.completed.includes(adventure.id)) return progress;
  return {
    ...progress,
    xp: progress.xp + adventure.reward.xp,
    completed: [...progress.completed, adventure.id],
    memories: [{ id: adventure.id, completedAt: new Date().toISOString(), caption: adventure.reward.memory }, ...progress.memories],
  };
}

export const levelFor = (xp: number) => Math.floor(xp / 100) + 1;
