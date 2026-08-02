import { apiRequest } from "./api";

export async function getCoachRecommendation(context = {}) {
  const targetRole = context.careerResult?.recommended_role;
  const response = await apiRequest("/api/v1/coach/recommendations", {
    method: "POST",
    body: {
      targetRole: targetRole || undefined,
    },
  });
  const result = response.data;
  const academicGoals = (result.learningPath || []).slice(0, 2).map((item) => ({
    tip: "academic",
    metin: item,
  }));
  const careerGoals = (result.priorityActions || []).slice(0, 2).map((item) => ({
    tip: "career",
    metin: item,
  }));
  return {
    id: result.id,
    mesaj: result.summary,
    haftalikIlerleme: 0,
    hedefler: [...academicGoals, ...careerGoals],
    recommendations: result.recommendations || [],
  };
}
