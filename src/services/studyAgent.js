import { apiRequest } from "./api";

export async function summarizeStudyMaterial(file) {
  // buraya ders materyali özetleme backend endpoint'i bağlanacak
  const form = new FormData();
  form.append("file", file);
  return apiRequest("/api/study/summarize", { method: "POST", body: form, isForm: true });
}
