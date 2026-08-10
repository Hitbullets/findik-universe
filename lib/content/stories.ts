import type { StoryDefinition } from "./types";

export const stories: StoryDefinition[] = [
  { id: "lost-red-balloon", title: "Kayıp Kırmızı Balon", entryPlaceId: "park", version: 1, startNodeId: "start", reward: { id: "red-balloon", xp: 35, stickerId: "red-balloon", stickerText: "Balon peşindeyim!", memoryId: "red-balloon-day", memoryCaption: "Kırmızı balonun peşindeki küçük macera." }, nodes: [
    { id: "start", text: "Parkta kırmızı bir balon bir dala takılmış. Fındık hemen yardım planını kuruyor.", choices: [{ label: "Tramvay durağına bak", next: "tram" }, { label: "Köprü tarafını keşfet", next: "bridge" }] },
    { id: "tram", text: "Durakta balonun ipinden minicik bir iz buldun. Rüzgâr tepeyi gösteriyor.", choices: [{ label: "Tepeye çık", next: "finish" }] },
    { id: "bridge", text: "Köprünün yanında balonun gölgesi suya vuruyor. Fındık doğru yolu buldu.", choices: [{ label: "Tepeye çık", next: "finish" }] },
    { id: "finish", text: "Balon sahibine kavuştu. Fındık'ın pati planı başarıyla tamamlandı.", ending: true },
  ] },
  { id: "rainy-day", title: "Fındık'ın Yağmurlu Günü", entryPlaceId: "cafe", version: 1, startNodeId: "start", reward: { id: "rainy-day", xp: 30, stickerText: "Yağmur macerası!", memoryId: "rainy-day", memoryCaption: "Plan değişti, macera iptal olmadı." }, nodes: [{ id: "start", text: "Yağmur başladı. Fındık botlarını bulup sıcak kafeye doğru yola çıkıyor.", ending: true }] },
  { id: "night-letter", title: "Gece Gelen Mektup", entryPlaceId: "night", version: 1, startNodeId: "start", reward: { id: "night-letter", xp: 30, achievementId: "night-explorer", memoryId: "night-letter", memoryCaption: "Pati işaretli mektubun sırrı çözüldü." }, nodes: [{ id: "start", text: "Kapının altındaki pati işareti Fındık'ı ışıklı gece bahçesine çağırıyor.", ending: true }] },
  { id: "birthday-surprise", title: "Fındık'ın Doğum Günü Sürprizi", entryPlaceId: "home", version: 1, startNodeId: "start", reward: { id: "birthday-surprise", xp: 30, stickerText: "Sürpriz!", memoryId: "birthday-surprise", memoryCaption: "Pati izleri büyük bir sürprize çıktı." }, nodes: [{ id: "start", text: "Kurdeleler ve pati izleri Fındık'ı küçük bir ev sürprizine götürüyor.", ending: true }] },
  { id: "little-star", title: "Küçük Yıldız", entryPlaceId: "night", version: 1, startNodeId: "start", reward: { id: "little-star", xp: 30, stickerText: "Küçük ama parlak.", memoryId: "little-star", memoryCaption: "Gece bahçesinde küçük bir ışık bulundu." }, nodes: [{ id: "start", text: "Gece bahçesinde küçük bir yıldızın ışığı titriyor. Fındık onu sakin bir keşifle buluyor.", ending: true }] },
];
