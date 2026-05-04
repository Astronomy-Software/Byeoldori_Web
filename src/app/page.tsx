"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star, MapPin, BookOpen } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

export default function LandingPage() {
  const router = useRouter();
  const { isSignedIn, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (isSignedIn) {
      router.replace("/home");
    }
  }, [isSignedIn, router]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Star className="h-6 w-6 text-purple-400" />
          <span className="text-lg font-bold text-foreground">별도리</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 transition-colors"
          >
            시작하기
          </Link>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-purple-500/20">
          <Star className="h-10 w-10 text-purple-400" />
        </div>
        <h1 className="mb-4 text-4xl font-bold text-foreground">별도리</h1>
        <p className="mb-2 text-lg text-muted-foreground">천체 관측 교육 플랫폼</p>
        <p className="mb-10 max-w-md text-sm text-muted-foreground">
          별지도로 오늘 밤 하늘을 탐색하고, 가까운 관측지를 찾고,
          커뮤니티에서 관측 경험을 나눠보세요.
        </p>

        {/* 기능 소개 */}
        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3 w-full max-w-xl">
          <div className="rounded-xl bg-card/50 p-4 text-center">
            <Star className="mx-auto mb-2 h-6 w-6 text-purple-400" />
            <p className="text-sm font-medium text-foreground">별지도</p>
            <p className="mt-1 text-xs text-muted-foreground">실시간 천체 지도</p>
          </div>
          <div className="rounded-xl bg-card/50 p-4 text-center">
            <MapPin className="mx-auto mb-2 h-6 w-6 text-purple-400" />
            <p className="text-sm font-medium text-foreground">관측지</p>
            <p className="mt-1 text-xs text-muted-foreground">날씨·적합도 정보</p>
          </div>
          <div className="rounded-xl bg-card/50 p-4 text-center">
            <BookOpen className="mx-auto mb-2 h-6 w-6 text-purple-400" />
            <p className="text-sm font-medium text-foreground">교육</p>
            <p className="mt-1 text-xs text-muted-foreground">단계별 학습 프로그램</p>
          </div>
        </div>

        <Link
          href="/signup"
          className="rounded-xl bg-purple-600 px-8 py-3 text-base font-semibold text-white hover:bg-purple-500 transition-colors"
        >
          무료로 시작하기
        </Link>
        <p className="mt-3 text-xs text-muted-foreground">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-purple-400 hover:text-purple-300">
            로그인
          </Link>
        </p>
      </main>

      {/* 푸터 — Google OAuth 검수 요건: 개인정보처리방침 링크 필수 */}
      <footer className="flex justify-center gap-6 py-4 text-xs text-muted-foreground">
        <Link href="/privacy" className="hover:text-foreground transition-colors">
          개인정보처리방침
        </Link>
        <Link href="/terms" className="hover:text-foreground transition-colors">
          서비스 이용약관
        </Link>
      </footer>
    </div>
  );
}
