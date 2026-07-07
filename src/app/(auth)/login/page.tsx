"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { Star } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const socialError =
    searchParams.get("error") === "social_failed"
      ? "소셜 로그인에 실패했습니다. 다시 시도해주세요."
      : null;

  function handleSocialLogin(provider: "google" | "kakao" | "naver") {
    const redirectUri = `${window.location.origin}/auth/${provider}/callback`;
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
      google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email%20profile`,
      kakao: `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`,
      naver: `https://nid.naver.com/oauth2.0/authorize?client_id=${naverClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${crypto.randomUUID()}`,
    };
    window.location.href = urls[provider];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login({ email, password });
      router.replace("/home");
    } catch {
      // error는 store에서 관리
    }
  }

  return (
    <Card className="border-purple-700/30 bg-card/80 backdrop-blur">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/20">
          <Star className="h-8 w-8 text-purple-400" />
        </div>
        <CardTitle className="text-2xl text-foreground">별도리</CardTitle>
        <CardDescription>천체 관측 교육 플랫폼에 로그인하세요</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {(error || socialError) && (
            <p className="text-sm text-error">{error ?? socialError}</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={isLoading}
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </Button>
          <div className="flex w-full justify-between text-sm">
            <Link
              href="/find-email"
              className="text-muted-foreground hover:text-foreground"
            >
              이메일 찾기
            </Link>
            <Link
              href="/reset-password"
              className="text-muted-foreground hover:text-foreground"
            >
              비밀번호 찾기
            </Link>
          </div>
          <div className="mt-2 text-center text-sm text-muted-foreground">
            계정이 없으신가요?{" "}
            <Link href="/signup" className="text-purple-400 hover:text-purple-300">
              회원가입
            </Link>
          </div>

          <div className="relative my-1 w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs text-muted-foreground">
              <span className="bg-card px-2">또는</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleSocialLogin("google")}
          >
            Google로 계속하기
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full bg-[#FEE500] text-black hover:bg-[#FDD800] border-[#FEE500]"
            onClick={() => handleSocialLogin("kakao")}
          >
            카카오로 계속하기
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full bg-[#02A94D] text-white font-semibold hover:bg-[#029044] border-[#02A94D]"
            onClick={() => handleSocialLogin("naver")}
          >
            네이버로 계속하기
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-96 w-full animate-pulse rounded-xl bg-card/50" />}>
      <LoginForm />
    </Suspense>
  );
}
