"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Star } from "lucide-react";
import { loginWithGoogle, loginWithKakao, loginWithNaver } from "@/lib/api/auth";
import { getMyProfile } from "@/lib/api/user";
import { useAuthStore } from "@/stores/auth-store";
import { getOAuthRedirectUri } from "@/lib/auth/oauth-redirect";
import {
  consumeReturnPath,
  needsOnboarding,
  rememberSocialLoginError,
  socialLoginErrorCode,
  socialLoginErrorMessage,
} from "@/lib/auth/post-login";
import type { UserProfile } from "@/types/api";

function OAuthCallbackInner() {
  const router = useRouter();
  const params = useParams<{ provider: string }>();
  const searchParams = useSearchParams();
  const loginWithSocial = useAuthStore((s) => s.loginWithSocial);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      router.replace("/login?error=social_failed");
      return;
    }

    const returnedState = searchParams.get("state");
    const storedState = sessionStorage.getItem("oauth_state_" + params.provider);
    if (!returnedState || !storedState || returnedState !== storedState) {
      router.replace("/login?error=social_failed");
      return;
    }
    sessionStorage.removeItem("oauth_state_" + params.provider);

    // 로그인 요청 때와 반드시 동일한 redirect_uri여야 토큰교환이 성공한다.
    const redirectUri = getOAuthRedirectUri(params.provider);
    const apiFn =
      params.provider === "google"
        ? loginWithGoogle
        : params.provider === "kakao"
          ? loginWithKakao
          : loginWithNaver;

    apiFn({ code, redirectUri })
      .then(async (tokens) => {
        loginWithSocial(tokens);
        // 소셜 로그인 응답에는 온보딩 여부가 없다 — 프로필의 닉네임으로 판단한다.
        let me: UserProfile | null = null;
        try {
          me = await getMyProfile();
          useAuthStore.setState({ user: me });
        } catch {
          // 프로필 조회 실패 시 온보딩 판단 없이 진행(AuthGuard가 다시 불러온다)
        }
        // 복귀 경로는 온보딩이 끝난 뒤 온보딩 화면에서 꺼낸다.
        router.replace(needsOnboarding(me) ? "/onboarding" : consumeReturnPath());
      })
      .catch((e: unknown) => {
        // 409(다른 방식으로 가입된 이메일)는 서버 안내 문구를 로그인 화면에 보여준다.
        rememberSocialLoginError(socialLoginErrorMessage(e));
        router.replace(`/login?error=${socialLoginErrorCode(e)}`);
      });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Star className="h-8 w-8 animate-spin text-purple-400" />
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Star className="h-8 w-8 animate-spin text-purple-400" />
        </div>
      }
    >
      <OAuthCallbackInner />
    </Suspense>
  );
}
