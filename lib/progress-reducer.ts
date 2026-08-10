import type { CompletionInput } from "./content/types";
import type { ContentRef } from "./types";
import type { ProgressV3 } from "./types";
export const blankProgressV3: ProgressV3 = { version: 3, xp: 0, boops: 0, completions: {}, memories: [], unlockedRewards: [], achievements: {}, wardrobe: { unlocked: [], equipped: [] }, passport: { visitedPlaceIds: [], stamps: [] } };
export function completionKey(content: ContentRef) { return `${content.type}:${content.id}:v${content.version || 1}`; }
export function applyCompletion(progress: ProgressV3, input: CompletionInput): ProgressV3 {
  const key = completionKey(input.content);
  if (progress.completions[key]) return progress;
  const now = new Date().toISOString();
  const next = { ...progress, completions: { ...progress.completions, [key]: { key, content: input.content, completedAt: now, score: input.score } }, xp: progress.xp + input.reward.xp, unlockedRewards: input.reward.id && !progress.unlockedRewards.includes(input.reward.id) ? [...progress.unlockedRewards, input.reward.id] : progress.unlockedRewards };
  if (input.reward.memoryId && !next.memories.some((m) => m.id === input.reward.memoryId)) next.memories = [{ id: input.reward.memoryId as never, completedAt: now, caption: input.reward.memoryCaption || "Yeni bir Fındık anısı." }, ...next.memories];
  if (input.reward.achievementId && !next.achievements[input.reward.achievementId]) next.achievements = { ...next.achievements, [input.reward.achievementId]: { unlockedAt: now } };
  return next;
}
export type ProgressEvent = { type: "CONTENT_COMPLETED"; input: CompletionInput } | { type: "CHARACTER_BOOPED" };
export function reduceProgress(progress: ProgressV3, event: ProgressEvent) { return event.type === "CONTENT_COMPLETED" ? applyCompletion(progress, event.input) : { ...progress, boops: progress.boops + 1 }; }
