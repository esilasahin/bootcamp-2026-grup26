import { apiRequest } from "./api";

export async function analyzeCV(file) {
  // buraya CV analizi backend endpoint'i bağlanacak
  const form = new FormData();
  form.append("file", file);
  return apiRequest("/api/career/analyze", { method: "POST", body: form, isForm: true });
}

export async function matchJobs(analysisId) {
  // buraya iş ilanı eşleştirme backend endpoint'i bağlanacak
  return apiRequest(`/api/career/match-jobs?analysis_id=${analysisId}`);
}

export async function getCVHistory() {
  // buraya analiz geçmişi backend endpoint'i bağlanacak
  return apiRequest("/api/career/history");
}
