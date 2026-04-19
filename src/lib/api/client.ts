import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "@/lib/auth/token";

// Next.js rewrites를 통해 프록시 (/api/* → 백엔드 서버)
const API_BASE_URL = "/api";

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const json = await res.json();
    // 서버 공통 래퍼 {success,message,data} 안에 토큰이 들어있다
    const tokens = json?.data ?? json;
    if (!tokens?.accessToken || !tokens?.refreshToken) return false;
    setTokens(tokens.accessToken, tokens.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}/${path.replace(/^\//, "")}`;

  const headers = new Headers(options.headers);
  const token = getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let res = await fetch(url, { ...options, headers });

  // 401 → 토큰 갱신 시도
  if (res.status === 401 && token) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    const refreshed = await refreshPromise;
    if (refreshed) {
      const newToken = getAccessToken();
      headers.set("Authorization", `Bearer ${newToken}`);
      res = await fetch(url, { ...options, headers });
    } else {
      clearTokens();
      throw new ApiError(401, "Session expired");
    }
  }

  if (!res.ok) {
    const errorBody = await res.text();
    // 서버 응답에서 message 필드 추출 시도
    let message = errorBody;
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed.message) message = parsed.message;
    } catch {
      // JSON 파싱 실패 시 원문 사용
    }
    throw new ApiError(res.status, message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  // HTML 응답(예: /auth/verify-email) 이나 비-JSON 은 text로 반환
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("json")) {
    return (await res.text()) as T;
  }

  return res.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`API Error ${status}: ${body}`);
    this.name = "ApiError";
  }
}

// Multipart 파일 업로드 헬퍼
export async function apiUpload<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  return apiFetch<T>(path, {
    method: "POST",
    body: formData,
    // Content-Type은 FormData일 때 브라우저가 자동 설정
  });
}
