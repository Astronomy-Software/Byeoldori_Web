"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Heart } from "lucide-react";
import { goBack } from "@/lib/navigation/in-app-history";

export default function LikesPage() {
  const router = useRouter();

  return (
    <div className="starfield min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <button
          onClick={() => goBack(router, "/mypage")}
          className="mb-4 flex items-center gap-1 text-sm text-text-tertiary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> 돌아가기
        </button>
        <h1 className="mb-6 text-2xl font-bold text-text-primary">좋아요한 글</h1>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-border-default bg-surface-1 px-6 py-16 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-interactive-link">
            <Heart className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="text-sm font-medium text-text-secondary">
            준비 중인 기능입니다
          </p>
          <p className="mt-1.5 text-xs text-text-tertiary">
            좋아요한 글 모아보기는 곧 제공될 예정이에요.
          </p>
        </div>
      </div>
    </div>
  );
}
