"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function LikesPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-3xl p-4">
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 돌아가기
      </button>
      <h1 className="mb-4 text-xl font-bold text-foreground">좋아요한 글</h1>
      <p className="text-sm text-muted-foreground">
        좋아요한 게시글 목록이 표시됩니다. (서버 API 연동 필요)
      </p>
    </div>
  );
}
