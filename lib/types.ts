export type AdventureId = "tram" | "bike" | "cafe" | "park" | "night";

export type Adventure = {
  id: AdventureId;
  place: string;
  title: string;
  hook: string;
  story: string;
  task: string;
  choices: string[];
  correctChoice: number;
  reward: { xp: number; sticker: string; stickerText: string; memory: string };
  tone: string;
};

export type Memory = { id: AdventureId; completedAt: string; caption: string };

export type Progress = {
  version: 2;
  xp: number;
  completed: AdventureId[];
  boops: number;
  memories: Memory[];
  wardrobe: string[];
};

export type AdventureDraft = { title: string; scenes: string[]; interaction: string; reward: string };

export type ContentType = "story" | "adventure" | "minigame";
export type ContentRef = { type: ContentType; id: string; version?: number };
export type CompletionRecord = { key: string; content: ContentRef; completedAt: string; score?: number };
export type RewardBundle = {
  id: string;
  xp: number;
  stickerId?: string;
  stickerText?: string;
  memoryId?: string;
  memoryCaption?: string;
  achievementId?: string;
  wardrobeItemId?: string;
  passportStampId?: string;
};
export type ProgressV3 = {
  version: 3;
  xp: number;
  boops: number;
  completions: Record<string, CompletionRecord>;
  memories: Memory[];
  unlockedRewards: string[];
  achievements: Record<string, { unlockedAt: string }>;
  wardrobe: { unlocked: string[]; equipped: string[] };
  passport: { visitedPlaceIds: string[]; stamps: string[] };
};
