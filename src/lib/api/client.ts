import { getAccessToken, setAccessToken, clearTokens } from "@/lib/auth/token";

// Next.js rewrites를 통해 프록시 (/api/* → 백엔드 서버)
const API_BASE_URL = "/api";

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  try {
    // refresh 토큰은 httpOnly 쿠키(refreshToken)로 자동 전송되므로 body를 보내지 않는다.
    // 쿠키가 없으면 백엔드가 401을 반환하고, 아래에서 false로 처리된다.
    const res = await fetch(`${API_BASE_URL}/auth/token`, {
      method: "POST",
      credentials: "include",
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
    // 새 refresh는 응답 쿠키로 재세팅되므로 body의 refreshToken은 무시하고 access만 저장한다.
    if (typeof accessToken !== "string") {
      return false;
    }
    setAccessToken(accessToken);
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

  // credentials:'include' → refreshToken 등 httpOnly 쿠키를 same-origin 프록시로 송수신
  let res = await fetch(url, { ...options, headers, credentials: "include" });

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
      res = await fetch(url, { ...options, headers, credentials: "include" });
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

  // 서버 공통 봉투 { success, message, data, code } 자동 unwrap
  // 모든 REST 엔드포인트가 이 구조로 통일됐으므로 caller는 항상 실제 데이터 타입 T(res.data)를 받는다.
  if (json !== null && typeof json === "object" && "success" in json) {
    const envelope = json as {
      success: boolean;
      message?: string;
      data?: unknown;
      code?: string | null;
    };
    // 성공 판별은 HTTP 상태 + success:true. 2xx인데 success:false 인 비정상 응답도 에러로 throw.
    if (envelope.success === false) {
      throw new ApiError(res.status, envelope.message ?? "Request failed");
    }
    return envelope.data as T;
  }

  // 봉투로 감싸지 않는 예외 응답(예: /auth/verify-email 평문 문자열)은 그대로 반환
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
