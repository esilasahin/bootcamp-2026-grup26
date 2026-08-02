import { apiRequest } from "./api";

export async function generateQuiz(params = {}) {
  let documentId = params.documentId;

  if (params.dosya) {
    const form = new FormData();
    form.append("file", params.dosya);
    const uploadResponse = await apiRequest("/api/v1/ocr/upload", {
      method: "POST",
      body: form,
      isForm: true,
    });
    documentId = uploadResponse.data?.documentId;
  }

  const response = await apiRequest("/api/v1/study/quizzes/generate", {
    method: "POST",
    body: {
      topic: params.konu || undefined,
      documentId: documentId || undefined,
      questionCount: params.soruSayisi ?? 3,
    },
  });
  return response.data;
}

export async function submitQuiz(quizId, answers) {
  const response = await apiRequest("/api/v1/study/quizzes/submit", {
    method: "POST",
    body: { quizId, answers },
  });
  return response.data;
}
