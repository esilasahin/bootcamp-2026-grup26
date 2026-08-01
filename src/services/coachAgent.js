import { apiRequest } from "./api";

export async function getCoachRecommendation(context = {}) {
  // buraya coach öneri backend endpoint'i bağlanacak
  return apiRequest("/api/coach/recommend", { method: "POST", body: context });
}
