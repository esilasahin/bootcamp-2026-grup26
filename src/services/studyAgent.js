import { apiRequest } from "./api";

export async function summarizeStudyMaterial(file) {
  const form = new FormData();
  form.append("file", file);

  const uploadResponse = await apiRequest(
    "/api/v1/ocr/upload",
    {
      method: "POST",
      body: form,
      isForm: true,
    },
  );

  const uploadedDocument = uploadResponse.data;
  const documentId = uploadedDocument?.documentId;

  if (!documentId) {
    throw new Error(
      "Yüklenen belge için documentId alınamadı.",
    );
  }

  const summaryResponse = await apiRequest(
    "/api/v1/study/summary",
    {
      method: "POST",
      body: {
        documentId,
      },
    },
  );

  const summaryResult = summaryResponse.data;
  const points =
    summaryResult?.keyPoints?.points || [];

  return {
    documentId,
    baslik:
      file.name.replace(/\.[^/.]+$/, "") ||
      "Ders Özeti",
    anaTemalar: summaryResult?.summary || "",
    onemliNoktalar: points.map(
      (point) =>
        `${point.title}: ${point.description}`,
    ),
    summary: summaryResult?.summary || "",
    keyPoints: points,
  };
}