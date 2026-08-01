export const API_BASE = import.meta.env.VITE_API_URL || "";

export function getToken() {
  return localStorage.getItem("unimate_token") || "";
}

export async function apiRequest(path, { method = "GET", body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isForm) headers["Content-Type"] = "application/json";

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Sunucuya bağlanılamadı. İnternet bağlantını veya sunucunun çalıştığını kontrol et.");
  }

  if (response.status === 401) {
    throw new Error("Oturum süren dolmuş görünüyor. Lütfen tekrar giriş yap.");
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const detail = data.detail || data.message || "";
    throw new Error(detail || `İstek başarısız oldu (HTTP ${response.status}).`);
  }

  return response.json();
}

export function validateFile(file, { allowed, maxMB = 5 } = {}) {
  if (!file) return "Dosya seçilmedi.";
  const pattern = new RegExp(`\\.(${allowed.join("|")})$`, "i");
  if (!pattern.test(file.name)) {
    return `Desteklenmeyen format! Lütfen ${allowed.join(", ").toUpperCase()} yükleyin.`;
  }
  if (file.size > maxMB * 1024 * 1024) {
    return `Dosya çok büyük! Lütfen ${maxMB}MB'den küçük bir dosya seç.`;
  }
  return null;
}
