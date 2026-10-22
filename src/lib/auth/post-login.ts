// 로그인 전후 이동 규칙.
// - 복귀 경로: 비로그인 상태로 보호 페이지(공유받은 글 링크 등)에 들어오면 그 경로를 기억해 두고,
//   로그인이 끝나면 /home 대신 그 경로로 보낸다. 같은 출처의 내부 경로만 허용한다(오픈 리다이렉트 방지).
// - 온보딩: 소셜 로그인 응답에는 온보딩 여부가 없으므로 /users/me의 닉네임으로 판단한다.
//   (/users/me의 onboardingRequired는 phone이 빈 소셜 사용자에게 항상 true라 쓰지 않는다)
// - 소셜 로그인 409: 다른 방식으로 가입된 이메일이라는 서버 안내를 로그인 화면에 전달한다.

export const RETURN_PATH_KEY = "post_login_return_path";
export const SOCIAL_LOGIN_ERROR_KEY = "social_login_error";
export const DEFAULT_AFTER_LOGIN = "/home";

const MAX_RETURN_PATH_LENGTH = 2048;
const MAX_ERROR_MESSAGE_LENGTH = 200;
// 로그인·온보딩 흐름 자체로는 되돌아가지 않는다(무한 루프 방지).
const BLOCKED_PATHS = ["/login", "/signup", "/onboarding", "/auth"];

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function sessionStore(storage?: StorageLike): StorageLike | null {
  if (storage) return storage;
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    // 저장소 접근이 막힌 환경(사생활 보호 모드 등)
    return null;
  }
}

/**
 * 같은 출처의 내부 경로("/..."로 시작)만 통과시킨다.
 * "//evil.com", "/\\evil.com", "https://..." 같은 외부 이동, 제어 문자, 로그인 흐름 경로는 null.
 */
export function sanitizeReturnPath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  if (raw.length === 0 || raw.length > MAX_RETURN_PATH_LENGTH) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  if (raw.includes("\\")) return null;
  if (/[\u0000-\u001f\u007f]/.test(raw)) return null;

  const base = "https://return-path.invalid";
  let url: URL;
  try {
    url = new URL(raw, base);
  } catch {
    return null;
  }
  if (url.origin !== base) return null;

  const path = url.pathname;
  if (
    BLOCKED_PATHS.some((p) => path === p || path.startsWith(`${p}/`))
  ) {
    return null;
  }
  return `${path}${url.search}${url.hash}`;
}

export function rememberReturnPath(path: string, storage?: StorageLike): void {
  const safe = sanitizeReturnPath(path);
  const s = sessionStore(storage);
  if (!safe || !s) return;
  try {
    s.setItem(RETURN_PATH_KEY, safe);
  } catch {
    // 저장 실패 시 복귀 없이 기본 경로로 간다.
  }
}

export function clearReturnPath(storage?: StorageLike): void {
  const s = sessionStore(storage);
  try {
    s?.removeItem(RETURN_PATH_KEY);
  } catch {
    // ignore
  }
}

/** 기억해 둔 복귀 경로를 꺼내고 지운다. 없거나 안전하지 않으면 /home. */
export function consumeReturnPath(storage?: StorageLike): string {
  const s = sessionStore(storage);
  let raw: string | null = null;
  try {
    raw = s?.getItem(RETURN_PATH_KEY) ?? null;
    s?.removeItem(RETURN_PATH_KEY);
  } catch {
    raw = null;
  }
  return sanitizeReturnPath(raw) ?? DEFAULT_AFTER_LOGIN;
}

/** 프로필을 받았고 닉네임이 비어 있을 때만 온보딩이 필요하다. 프로필 조회 실패(null)면 보내지 않는다. */
export function needsOnboarding(
  profile: { nickname?: string | null } | null | undefined,
): boolean {
  if (!profile) return false;
  return !profile.nickname?.trim();
}

/** 소셜 로그인 실패를 로그인 화면의 error 쿼리 값으로 바꾼다. 409(다른 방식으로 가입된 이메일)만 구분한다. */
export function socialLoginErrorCode(e: unknown): "account_conflict" | "social_failed" {
  if (
    typeof e === "object" &&
    e !== null &&
    (e as { status?: unknown }).status === 409
  ) {
    return "account_conflict";
  }
  return "social_failed";
}

/** 409 응답의 서버 안내 문구(ApiError.body). 화면에는 React 텍스트로만 출력한다. */
export function socialLoginErrorMessage(e: unknown): string | null {
  if (socialLoginErrorCode(e) !== "account_conflict") return null;
  const body = (e as { body?: unknown }).body;
  if (typeof body !== "string") return null;
  const msg = body.trim();
  if (!msg || msg.length > MAX_ERROR_MESSAGE_LENGTH || msg.startsWith("{") || msg.startsWith("<")) {
    return null;
  }
  return msg;
}

export function rememberSocialLoginError(message: string | null, storage?: StorageLike): void {
  const s = sessionStore(storage);
  try {
    if (message) s?.setItem(SOCIAL_LOGIN_ERROR_KEY, message);
    else s?.removeItem(SOCIAL_LOGIN_ERROR_KEY);
  } catch {
    // ignore
  }
}

export function consumeSocialLoginError(storage?: StorageLike): string | null {
  const s = sessionStore(storage);
  try {
    const msg = s?.getItem(SOCIAL_LOGIN_ERROR_KEY) ?? null;
    s?.removeItem(SOCIAL_LOGIN_ERROR_KEY);
    return msg;
  } catch {
    return null;
  }
}
