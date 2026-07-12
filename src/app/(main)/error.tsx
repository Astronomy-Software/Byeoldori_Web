"use client";

import { useEffect } from "react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="text-xl font-bold text-text-primary">
        문제가 발생했습니다
      </h2>
      <p className="text-sm text-text-secondary">
        콘텐츠를 불러오는 중 오류가 발생했습니다. 다시 시도해 주세요.
      </p>
      <button
        onClick={() => unstable_retry()}
        className="glow-primary mt-2 rounded-xl bg-interactive-primary px-6 py-3 text-sm font-semibold text-text-on-primary transition hover:brightness-110"
      >
        다시 시도
      </button>
    </div>
  );
}
