"use client";

/**
 * OAuth redirect_uri 생성 (로그인 요청 · 콜백 토큰교환이 반드시 같은 값을 써야 함).
 *
 * window.location.origin을 그대로 쓰면 www 서브도메인이나 프리뷰 배포 URL에서
 * 프로바이더 콘솔에 등록되지 않은 redirect_uri가 만들어져 로그인이 깨진다.
 * 따라서 배포 환경에서는 canonical 도메인(NEXT_PUBLIC_SITE_URL)으로 고정한다.
 * 단, 로컬 개발에서는 실제 origin을 써야 localhost로 되돌아올 수 있다.
 */
export function getOAuthRedirectUri(provider: string): string {
  return `${getOAuthOrigin()}/auth/${provider}/callback`;
}

function getOAuthOrigin(): string {
  const canonical = (process.env.NEXT_PUBLIC_SITE_URL ?? "")
    .trim()
    .replace(/\/+$/, "");

  if (!canonical) return window.location.origin;

  const host = window.location.hostname;
  const isLocal =
    host === "localhost" || host === "127.0.0.1" || host === "[::1]";

  return isLocal ? window.location.origin : canonical;
}
