import type { Adventure, Progress } from "./types";

const key = "findik-universe-progress-v2";
export const blankProgress: Progress = { version: 2, xp: 0, completed: [], boops: 0, memories: [], wardrobe: [] };

export function loadProgress(): Progress {
  if (typeof window === "undefined") return blankProgress;
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "null");
    return value && value.version === 2 ? { ...blankProgress, ...value } : blankProgress;
  } catch { return blankProgress; }
}

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
