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
