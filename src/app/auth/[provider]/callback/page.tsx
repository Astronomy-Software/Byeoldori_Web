"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Star } from "lucide-react";
import { loginWithGoogle, loginWithKakao, loginWithNaver } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";
import { getOAuthRedirectUri } from "@/lib/auth/oauth-redirect";

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
      .then((tokens) => {
        loginWithSocial(tokens);
        router.replace(tokens.onboardingRequired ? "/onboarding" : "/home");
      })
      .catch(() => {
        router.replace("/login?error=social_failed");
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
