const ACCESS_TOKEN_KEY = "byeoldori_access_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

// refresh 토큰은 httpOnly 쿠키(refreshToken)로 관리되므로 localStorage에는 access만 저장한다.
export function setAccessToken(accessToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

// refresh까지 실패해 세션이 끝났음을 앱 상태(auth-store)에 알리는 이벤트.
// client.ts → auth-store 직접 import는 순환 참조라 window 이벤트로 전달한다.
export const SESSION_EXPIRED_EVENT = "byeoldori:session-expired";

export function notifySessionExpired() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
