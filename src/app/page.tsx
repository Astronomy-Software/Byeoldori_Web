"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star, MapPin, BookOpen, Sparkles } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

const features = [
  { icon: Star, title: "별지도", desc: "실시간 천체 지도" },
  { icon: MapPin, title: "관측지", desc: "날씨·적합도 정보" },
  { icon: BookOpen, title: "교육", desc: "단계별 학습 프로그램" },
] as const;

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
    <div className="starfield relative flex min-h-screen flex-col overflow-hidden">
      {/* 오로라 발광 */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-interactive-primary/20 blur-3xl"
      />

      {/* 헤더 */}
      <header className="relative flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-interactive-primary/15">
            <Sparkles className="h-4 w-4 text-aurora" />
          </span>
          <span className="text-lg font-bold text-text-primary">별도리</span>
        </div>
        <Link
          href="/login"
          className="rounded-xl bg-interactive-primary px-4 py-2 text-sm font-semibold text-text-on-primary transition hover:brightness-110"
        >
          시작하기
        </Link>
      </header>

      {/* 히어로 */}
      <main className="relative flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="glow-primary mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-interactive-primary/15">
          <Sparkles className="h-10 w-10 text-aurora" />
        </div>
        <h1 className="mb-4 text-4xl font-bold text-text-primary sm:text-5xl">
          오늘 밤, 별 보러 갈까요?
        </h1>
        <p className="mb-10 max-w-md text-sm text-text-secondary sm:text-base">
          별지도로 오늘 밤 하늘을 탐색하고, 가까운 관측지를 찾고, 커뮤니티에서
          관측 경험을 나눠보세요.
        </p>

        {/* 기능 소개 */}
        <div className="mb-12 grid w-full max-w-xl grid-cols-1 gap-4 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass rounded-2xl p-5 text-center">
              <Icon className="mx-auto mb-2 h-6 w-6 text-aurora" />
              <p className="text-sm font-semibold text-text-primary">{title}</p>
              <p className="mt-1 text-xs text-text-tertiary">{desc}</p>
            </div>
          ))}
        </div>

        <Link
          href="/login"
          className="glow-primary rounded-xl bg-interactive-primary px-8 py-3 text-base font-semibold text-text-on-primary transition hover:brightness-110"
        >
          무료로 시작하기
        </Link>
        <p className="mt-3 text-xs text-text-tertiary">
          소셜 계정으로 3초 만에 시작
        </p>
      </main>

      {/* 푸터 — Google OAuth 검수 요건: 개인정보처리방침 링크 필수 */}
      <footer className="relative flex justify-center gap-6 py-4 text-xs text-text-tertiary">
        <Link href="/privacy" className="transition hover:text-text-primary">
          개인정보처리방침
        </Link>
        <Link href="/terms" className="transition hover:text-text-primary">
          서비스 이용약관
        </Link>
      </footer>
    </div>
  );
}
