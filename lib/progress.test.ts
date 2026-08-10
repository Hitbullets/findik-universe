import { describe, expect, it } from "vitest";
import { loadProgressFromStorage, loadProgressV3, persistProgressV3, resetProgressV3 } from "./progress";
import { normalizeProgress } from "./progress-schema";
import { applyCompletion, createBlankProgressV3, reduceProgress } from "./progress-reducer";

function memoryStorage(initial: string | null = null) {
  let value = initial;
  let writes = 0;
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => { value = next; writes += 1; },
    snapshot: () => value,
    writes: () => writes,
  };
}

describe("progress storage", () => {
  it("keeps the server snapshot deterministic", () => {
    expect(loadProgressV3()).toEqual(createBlankProgressV3());
  });

  it("migrates a v2 snapshot once and persists canonical v3", () => {
    const storage = memoryStorage(JSON.stringify({ version: 2, xp: 25, boops: 2, completed: ["tram"], memories: [], wardrobe: [] }));
    const first = loadProgressFromStorage(storage);
    expect(first.version).toBe(3);
    expect(first.completions["adventure:tram:v1"]).toBeDefined();
    expect(storage.writes()).toBe(1);
    expect(loadProgressFromStorage(storage)).toEqual(first);
    expect(storage.writes()).toBe(1);
  });

  it("persists and resets one complete v3 snapshot", () => {
    const storage = memoryStorage();
    const progress = reduceProgress(createBlankProgressV3(), { type: "CHARACTER_BOOPED" });
    expect(persistProgressV3(progress, storage).ok).toBe(true);
    expect(JSON.parse(storage.snapshot()!).boops).toBe(1);
    const reset = resetProgressV3(storage);
    expect(reset.result.ok).toBe(true);
    expect(reset.progress).toEqual(createBlankProgressV3());
    expect(JSON.parse(storage.snapshot()!)).toEqual(createBlankProgressV3());
  });

  it("returns a failure instead of throwing when storage rejects a write", () => {
    const storage = { getItem: () => null, setItem: () => { throw new Error("quota"); } };
    expect(persistProgressV3(createBlankProgressV3(), storage).ok).toBe(false);
  });
});

describe("progress validation and reducer", () => {
  it("normalizes malformed unknown payloads without throwing", () => {
    expect(normalizeProgress({ version: 2, completed: null, memories: "bad", wardrobe: {}, xp: -1 })).toEqual(createBlankProgressV3());
    expect(normalizeProgress({ version: 3, xp: "25", boops: 0 })).toEqual(createBlankProgressV3());
  });

  it("awards a completion once", () => {
    const blank = createBlankProgressV3();
    const input = { content: { type: "story" as const, id: "test", version: 1 }, reward: { id: "test-reward", xp: 35, memoryId: "test-day", memoryCaption: "Test" } };
    const completed = applyCompletion(blank, input);
    expect(completed.xp).toBe(35);
    expect(completed.memories).toHaveLength(1);
    expect(applyCompletion(completed, input)).toBe(completed);
  });

  it("handles boops and reset through the canonical reducer", () => {
    const booped = reduceProgress(createBlankProgressV3(), { type: "CHARACTER_BOOPED" });
    expect(booped.boops).toBe(1);
    expect(reduceProgress(booped, { type: "RESET" })).toEqual(createBlankProgressV3());
  });
});
