"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Star } from "lucide-react";
import { loginWithGoogle, loginWithKakao, loginWithNaver } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";

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

    const redirectUri = `${window.location.origin}/auth/${params.provider}/callback`;
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
