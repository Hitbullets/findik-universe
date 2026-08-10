import { createBlankProgressV3 } from "./progress-reducer";
import { normalizeProgress, progressVersion } from "./progress-schema";
import type { ProgressV3 } from "./types";

export const PROGRESS_STORAGE_KEY = "findik-universe-progress-v2";

type ProgressStorage = Pick<Storage, "getItem" | "setItem">;

export type PersistenceResult = { ok: true } | { ok: false; error: unknown };

/** A deterministic server snapshot. Browser state must be loaded in an effect. */
export function loadProgressV3(): ProgressV3 {
  return createBlankProgressV3();
}

/** Reads browser state and rewrites a legacy v2 snapshot as canonical v3 once. */
export function loadProgressFromStorage(storage: ProgressStorage = window.localStorage): ProgressV3 {
  let raw: unknown;
  try {
    raw = JSON.parse(storage.getItem(PROGRESS_STORAGE_KEY) ?? "null");
  } catch {
    return createBlankProgressV3();
  }
  const progress = normalizeProgress(raw);
  if (progressVersion(raw) === 2) persistProgressV3(progress, storage);
  return progress;
}

/** Persists exactly one validated canonical snapshot with a single atomic setItem. */
export function persistProgressV3(progress: ProgressV3, storage: ProgressStorage = window.localStorage): PersistenceResult {
  try {
    storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(normalizeProgress(progress)));
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

export function resetProgressV3(storage: ProgressStorage = window.localStorage): { progress: ProgressV3; result: PersistenceResult } {
  const progress = createBlankProgressV3();
  return { progress, result: persistProgressV3(progress, storage) };
}

export const levelFor = (xp: number) => Math.floor(Math.max(0, xp) / 100) + 1;
