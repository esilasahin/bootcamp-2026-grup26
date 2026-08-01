import { apiRequest } from "./api";

export async function generateQuiz(params = {}) {
  // buraya quiz üretimi backend endpoint'i bağlanacak
  if (params.dosya) {
    const form = new FormData();
    form.append("file", params.dosya);
    if (params.konu) form.append("konu", params.konu);
    form.append("soruSayisi", String(params.soruSayisi ?? 3));
    return apiRequest("/api/quiz/generate", { method: "POST", body: form, isForm: true });
  }
  return apiRequest("/api/quiz/generate", { method: "POST", body: params });
}

export async function submitQuiz(quizId, answers) {
  // buraya quiz sonucu kaydı backend endpoint'i bağlanacak
  return apiRequest("/api/quiz/submit", { method: "POST", body: { quizId, answers } });
}
