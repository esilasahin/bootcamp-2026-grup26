export const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";


export function getToken() {
  return localStorage.getItem("unimate_token") || "";
}


export function clearSession() {
  localStorage.removeItem("unimate_token");
  localStorage.removeItem("unimate_user");
}


export async function apiRequest(
  path,
  {
    method = "GET",
    body,
    isForm = false,
    includeAuth = true,
  } = {},
) {
  const headers = {};

  if (includeAuth) {
    const token = getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  if (!isForm) {
    headers["Content-Type"] = "application/json";
  }

  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: isForm
        ? body
        : body
          ? JSON.stringify(body)
          : undefined,
    });
  } catch {
    throw new Error(
      "Backend sunucusuna bağlanılamadı.",
    );
  }

  const data = await response
    .json()
    .catch(() => ({}));

  if (response.status === 401 && includeAuth) {
    clearSession();
    throw new Error(
      "Oturum süren dolmuş. Lütfen tekrar giriş yap.",
    );
  }

  if (!response.ok) {
    const validationMessage = Array.isArray(data.errors)
      ? data.errors
          .map((error) => error.message)
          .join(" ")
      : "";

    throw new Error(
      validationMessage ||
      data.message ||
      data.detail ||
      `İstek başarısız oldu (HTTP ${response.status}).`,
    );
  }

  return data;
}


export async function registerUser({
  fullName,
  email,
  password,
}) {
  return apiRequest(
    "/api/v1/auth/register",
    {
      method: "POST",
      body: {
        fullName,
        email,
        password,
      },
      includeAuth: false,
    },
  );
}


export async function loginUser({
  email,
  password,
}) {
  const response = await apiRequest(
    "/api/v1/auth/login",
    {
      method: "POST",
      body: {
        email,
        password,
      },
      includeAuth: false,
    },
  );

  localStorage.setItem(
    "unimate_token",
    response.access_token,
  );
  localStorage.setItem(
    "unimate_user",
    JSON.stringify(response.user),
  );

  return response;
}


export function validateFile(
  file,
  {
    allowed,
    maxMB = 10,
  } = {},
) {
  if (!file) {
    return "Dosya seçilmedi.";
  }

  const pattern = new RegExp(
    `\\.(${allowed.join("|")})$`,
    "i",
  );

  if (!pattern.test(file.name)) {
    return (
      `Desteklenmeyen format. ` +
      `${allowed.join(", ").toUpperCase()} yükleyin.`
    );
  }

  if (file.size > maxMB * 1024 * 1024) {
    return (
      `Dosya çok büyük. En fazla ${maxMB} MB olabilir.`
    );
  }

  return null;
}