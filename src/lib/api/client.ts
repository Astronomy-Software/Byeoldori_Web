import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "@/lib/auth/token";

// Next.js rewrites를 통해 프록시 (/api/* → 백엔드 서버)
const API_BASE_URL = "/api";

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()?.trim();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    // JSON 파싱 실패 방어 (백엔드가 비정상 응답을 줄 수 있음)
    let json: unknown;
    try {
      json = await res.json();
    } catch {
      return false;
    }
    // 서버 공통 래퍼 {success,message,data} 안에 토큰이 들어있다
    const tokens = (json as { data?: unknown })?.data ?? json;
    const accessToken = (tokens as { accessToken?: unknown })?.accessToken;
    const newRefreshToken = (tokens as { refreshToken?: unknown })?.refreshToken;
    if (typeof accessToken !== "string" || typeof newRefreshToken !== "string") {
      return false;
    }
    setTokens(accessToken, newRefreshToken);
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
  const token = getAccessToken()?.trim();
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

    // refreshPromise가 null이 된 경우(완료 직후 레이스 컨디션)는 false로 처리
    const refreshed = await (refreshPromise ?? Promise.resolve(false));
    if (refreshed) {
      const newToken = getAccessToken()?.trim();
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

  // 본문이 비어있으면(Content-Type이 json이어도) void로 처리
  const rawBody = await res.text();
  if (rawBody.trim() === "") return undefined as T;

  // JSON 파싱 실패 방어
  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    throw new ApiError(res.status, `Invalid JSON response: ${rawBody}`);
  }

  // 서버 공통 래퍼 { success, message, data } 자동 unwrap
  // 모든 엔드포인트가 이 구조를 쓰므로 caller는 항상 실제 데이터 타입 T를 받는다
  if (
    json !== null &&
    typeof json === "object" &&
    "success" in json &&
    "data" in json
  ) {
    return json.data as T;
  }

  return json as T;
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
