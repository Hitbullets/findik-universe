import type { ContentRef, RewardBundle } from "../types";

export type StoryNode = { id: string; text: string; choices?: Array<{ label: string; next: string }> ; ending?: boolean };
export type StoryDefinition = { id: string; title: string; entryPlaceId: string; version: number; startNodeId: string; nodes: StoryNode[]; reward: RewardBundle };
export type AdventureBeat = { id: string; kind: "narrative" | "choice" | "minigame" | "result"; text: string; choices?: string[]; minigameId?: string };
export type AdventureDefinition = { id: string; title: string; placeId: string; version: number; beats: AdventureBeat[]; reward: RewardBundle; presentation?: { hook: string; task: string; choices: string[]; correctChoice: number; tone: string } };
export type MinigameResult = { status: "completed" | "skipped" | "exited"; score?: number; attempts: number };
export type MinigameDefinition = { id: string; title: string; description: string; accessibilityFallback: string };
export type Catalog = { stories: StoryDefinition[]; adventures: AdventureDefinition[]; minigames: MinigameDefinition[] };
export type CompletionInput = { content: ContentRef; reward: RewardBundle; score?: number };
