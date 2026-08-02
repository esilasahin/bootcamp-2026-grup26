import { apiRequest } from "./api";

export async function analyzeCV(file) {
  const form = new FormData();
  form.append("file", file);
  const response = await apiRequest("/api/v1/cv/analyze", {
    method: "POST",
    body: form,
    isForm: true,
  });
  const result = response.data;
  return {
    id: result.id,
    documentId: result.documentId,
    score: result.overallScore,
    summary: result.summary,
    technical_skills: result.skills || [],
    strengths: result.strengths || [],
    missing_areas: result.weaknesses || [],
    recommendations: result.recommendations || [],
    experience_level: result.experienceLevel,
    education: [],
    experience: [],
    soft_skills: [],
  };
}

export async function matchJobs({ analysisId, jobTitle, jobDescription }) {
  const response = await apiRequest("/api/v1/jobs/match", {
    method: "POST",
    body: {
      cvAnalysisId: analysisId,
      jobTitle,
      jobDescription,
    },
  });
  return response.data;
}

export async function getCVHistory() {
  const response = await apiRequest("/api/v1/users/me/analysis-history");
  return response.data;
}
