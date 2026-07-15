"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Live2DCharacter } from "@/components/live2d-character";
import { getOAuthRedirectUri } from "@/lib/auth/oauth-redirect";

function handleSocialLogin(provider: "google" | "kakao" | "naver") {
  // canonical 도메인 고정 — 콜백의 토큰교환과 동일한 값을 써야 한다.
  const redirectUri = getOAuthRedirectUri(provider);
  // CSRF 방지: state 생성 후 sessionStorage 저장 → 콜백에서 검증(3 provider 공통)
  const state = crypto.randomUUID();
  sessionStorage.setItem("oauth_state_" + provider, state);
  const s = encodeURIComponent(state);
  const googleClientId = encodeURIComponent(
    (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "").trim(),
  );
  const kakaoClientId = encodeURIComponent(
    (process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID ?? "").trim(),
  );
  const naverClientId = encodeURIComponent(
    (process.env.NEXT_PUBLIC_NAVER_OAUTH_CLIENT_ID ?? "").trim(),
  );
  const urls: Record<string, string> = {
    google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email%20profile&state=${s}`,
    kakao: `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${s}`,
    naver: `https://nid.naver.com/oauth2.0/authorize?client_id=${naverClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${s}`,
  };
  window.location.href = urls[provider];
}

function LoginForm() {
  const searchParams = useSearchParams();
  const socialError =
    searchParams.get("error") === "social_failed"
      ? "소셜 로그인에 실패했습니다. 다시 시도해주세요."
      : null;

  return (
    <div className="flex flex-col items-center">
      {/* 별도리 마스코트 환영 */}
      <div className="relative">
        <div className="glass mb-4 rounded-2xl px-5 py-3 text-center text-sm font-medium text-text-primary">
          안녕하세요! 저는 별도리예요 <span className="text-aurora">✦</span>
          <br />
          함께 별 보러 가요
        </div>
        <Live2DCharacter
          className="pointer-events-none mx-auto h-72 w-72"
          scale={1.3}
        />
      </div>

      {/* 로그인 카드 */}
      <div className="glass w-full rounded-2xl p-6 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-text-primary">별도리</h1>
          <p className="mt-1 text-sm text-text-secondary">
            소셜 계정으로 간편하게 시작하세요
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => handleSocialLogin("google")}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-white text-[15px] font-semibold text-black transition hover:brightness-95"
          >
            <GoogleIcon />
            Google로 계속하기
          </button>
          <button
            type="button"
            onClick={() => handleSocialLogin("kakao")}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] text-[15px] font-semibold text-black transition hover:brightness-95"
          >
            <KakaoIcon />
            카카오로 계속하기
          </button>
          <button
            type="button"
            onClick={() => handleSocialLogin("naver")}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#03C75A] text-[15px] font-semibold text-white transition hover:brightness-95"
          >
            <NaverIcon />
            네이버로 계속하기
          </button>
        </div>

        {socialError && (
          <p className="mt-4 text-center text-sm text-error">{socialError}</p>
        )}

        <p className="mt-6 text-center text-xs text-text-tertiary">
          로그인 시 서비스 이용약관과 개인정보처리방침에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#000"
        d="M9 1.5C4.86 1.5 1.5 4.1 1.5 7.3c0 2.06 1.4 3.87 3.5 4.9-.15.53-.56 1.98-.64 2.29-.1.38.14.38.3.27.12-.08 1.9-1.29 2.67-1.82.4.06.8.09 1.17.09 4.14 0 7.5-2.6 7.5-5.8S13.14 1.5 9 1.5z"
      />
    </svg>
  );
}

function NaverIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path
        fill="#fff"
        d="M10.64 8.56 5.1 1H1v14h4.36V7.44L10.9 15H15V1h-4.36v7.56z"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="glass h-96 w-full animate-pulse rounded-2xl" />
      }
    >
      <LoginForm />
    </Suspense>
  );
}
