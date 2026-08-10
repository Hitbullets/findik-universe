import type { AdventureDraft } from "./types";

const forbidden = ["doğum tarihi", "adres", "telefon", "şiddet", "korku", "satın al"];

export function draftAdventure(idea: string): AdventureDraft | null {
  const clean = idea.trim();
  if (clean.length < 3 || forbidden.some((word) => clean.toLocaleLowerCase("tr-TR").includes(word))) return null;
  return {
    title: `Fındık'ın ${clean} görevi`,
    scenes: ["Fındık görevin haritasını inceler.", `Minik kaşif ${clean} için yola çıkar.`, "Görev bir anı kartı ve gururlu bir pozla biter."],
    interaction: "Üç güvenli seçenek arasından Fındık'a en neşeli yolu seçtir.",
    reward: "Bir taslak anı fikri ve gelecekte açılabilecek bir sticker.",
  };
}
