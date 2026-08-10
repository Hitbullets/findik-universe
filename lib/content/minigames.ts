import type { MinigameDefinition } from "./types";
export const minigames: MinigameDefinition[] = [
  { id: "catch-the-tram", title: "Tramvayı Yakala", description: "Doğru durağı seç ve Fındık'ı tramvaya yetiştir.", accessibilityFallback: "Üç durak arasından tramvayın beklediği durağı seç." },
  { id: "paw-memory", title: "Pati Hafızası", description: "Eşleşen pati kartlarını bul.", accessibilityFallback: "Kartları sırayla açıp eşleşen sembolleri seç." },
  { id: "tram-ticket", title: "Tramvay Bileti", description: "Doğru damgayı biletle eşleştir.", accessibilityFallback: "Üç damgadan doğru olanı seç." },
  { id: "treasure-hunt", title: "Hazine Avı", description: "Sahnede üç authored nesneyi bul.", accessibilityFallback: "Nesneleri listeden sırayla işaretle." },
  { id: "catch-the-food", title: "Mama Yakala", description: "Güvenli mama parçalarını yakala.", accessibilityFallback: "Güvenli görünen parçayı seç." },
];
