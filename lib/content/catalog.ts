import { authoredAdventures } from "./adventures";
import { minigames } from "./minigames";
import { stories } from "./stories";
import type { Catalog } from "./types";
export const catalog: Catalog = { stories, adventures: authoredAdventures, minigames };
export type CatalogIssue = { code: string; path: string; message: string };
export type CatalogValidation = { valid: boolean; issues: CatalogIssue[] };

export function inspectCatalog(value: Catalog = catalog): CatalogValidation {
  const issues: CatalogIssue[] = [];
  const add = (code: string, path: string, message: string) => issues.push({ code, path, message });
  const rewardIds = new Map<string, string>();
  const memoryIds = new Map<string, string>();
  const allContent = [...value.stories.map((item) => ({ kind: "stories", item })), ...value.adventures.map((item) => ({ kind: "adventures", item }))];

  for (const { kind, item } of allContent) {
    const path = `${kind}.${item.id}`;
    const rewardOwner = rewardIds.get(item.reward.id);
    if (rewardOwner) add("duplicate_reward_id", `${path}.reward.id`, `Ödül kimliği ${rewardOwner} tarafından da kullanılıyor.`);
    else rewardIds.set(item.reward.id, path);
    if (item.reward.memoryId) {
      const memoryOwner = memoryIds.get(item.reward.memoryId);
      if (memoryOwner) add("duplicate_memory_id", `${path}.reward.memoryId`, `Anı kimliği ${memoryOwner} tarafından da kullanılıyor.`);
      else memoryIds.set(item.reward.memoryId, path);
    }
  }

  const contentIds = allContent.map(({ item }) => item.id);
  for (const id of new Set(contentIds.filter((candidate, index) => contentIds.indexOf(candidate) !== index))) add("duplicate_content_id", id, "İçerik kimliği benzersiz olmalı.");

  for (const adventure of value.adventures) {
    adventure.beats.forEach((beat, index) => {
      if (beat.minigameId && !value.minigames.some((game) => game.id === beat.minigameId)) add("missing_minigame", `adventures.${adventure.id}.beats.${index}`, `Minigame bulunamadı: ${beat.minigameId}`);
    });
  }

  for (const story of value.stories) {
    const path = `stories.${story.id}`;
    const nodeIds = story.nodes.map((node) => node.id);
    const nodes = new Map(story.nodes.map((node) => [node.id, node]));
    if (new Set(nodeIds).size !== nodeIds.length) add("duplicate_story_node", `${path}.nodes`, "Story node kimlikleri benzersiz olmalı.");
    if (!nodes.has(story.startNodeId)) add("missing_story_start", `${path}.startNodeId`, "Başlangıç node'u bulunamadı.");
    story.nodes.forEach((node) => node.choices?.forEach((choice, index) => {
      if (!nodes.has(choice.next)) add("missing_story_target", `${path}.nodes.${node.id}.choices.${index}`, `Hedef node bulunamadı: ${choice.next}`);
    }));
    if (nodes.has(story.startNodeId)) {
      const visited = new Set<string>();
      const queue = [story.startNodeId];
      while (queue.length) {
        const id = queue.shift()!;
        if (visited.has(id)) continue;
        visited.add(id);
        nodes.get(id)?.choices?.forEach((choice) => { if (nodes.has(choice.next)) queue.push(choice.next); });
      }
      if (![...visited].some((id) => nodes.get(id)?.ending)) add("unreachable_story_ending", path, "Başlangıçtan erişilebilen bir bitiş node'u yok.");
      story.nodes.forEach((node) => {
        if (!visited.has(node.id)) add("orphan_story_node", `${path}.nodes.${node.id}`, "Node başlangıçtan erişilemiyor.");
        if (!node.ending && !node.choices?.length) add("story_dead_end", `${path}.nodes.${node.id}`, "Bitiş olmayan node ilerleme seçeneği içermeli.");
      });
    }
  }
  return { valid: issues.length === 0, issues };
}

export function validateCatalog(value: Catalog = catalog) {
  return inspectCatalog(value).valid;
}
