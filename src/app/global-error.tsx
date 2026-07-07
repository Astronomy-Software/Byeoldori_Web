"use client";

import { useEffect } from "react";

// 전역 에러 바운더리 — 루트 레이아웃에서 발생한 에러를 처리.
// global-error는 자체 <html>/<body>를 렌더링해야 한다.
export default function GlobalError({
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
    <html lang="ko">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          background: "#0b0b12",
          color: "#f4f4f5",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
          문제가 발생했습니다
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#a1a1aa", margin: 0 }}>
          예기치 못한 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
        </p>
        <button
          onClick={() => unstable_retry()}
          style={{
            marginTop: "0.5rem",
            borderRadius: "0.75rem",
            border: "none",
            background: "#7c3aed",
            color: "#ffffff",
            padding: "0.625rem 1.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
