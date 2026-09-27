"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";
import {
  listMyQuizAttempts,
  type MyQuizAttempt,
} from "@/lib/api/education-program";

const PAGE_SIZE = 20;

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

// 교육 프로그램 퀴즈 응시 이력. 같은 프로그램을 여러 번 풀면 매번 한 줄씩 남는다.
export default function LearningHistoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<MyQuizAttempt[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(false);
    try {
      const res = await listMyQuizAttempts(p, PAGE_SIZE);
      setItems((prev) => (p === 0 ? res.content : [...prev, ...res.content]));
      setPage(res.page);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0);
  }, [load]);

  // 만점 수는 지금까지 불러온 기록 기준이다(더 보기로 늘어난다)
  const perfect = items.filter((a) => a.total > 0 && a.score === a.total).length;

  return (
    <div className="starfield min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-1 text-sm text-text-tertiary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> 돌아가기
        </button>
        <h1 className="mb-2 text-2xl font-bold text-text-primary">학습 기록</h1>
        <p className="mb-6 text-sm text-text-tertiary">
          별지도 교육 프로그램에서 푼 퀴즈 결과예요.
        </p>

        {error && (
          <p role="alert" className="mb-4 text-sm text-error">
            학습 기록을 불러오지 못했습니다.
          </p>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border-default bg-surface-1 px-6 py-16 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-interactive-link">
              <GraduationCap className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="text-sm font-medium text-text-secondary">아직 푼 퀴즈가 없어요</p>
            <p className="mt-1.5 text-xs text-text-tertiary">
              별지도의 교육 모드에서 프로그램을 끝까지 들어보세요.
            </p>
            <Link
              href="/starmap"
              className="mt-4 rounded-lg bg-interactive-primary px-4 py-2 text-sm text-white transition-colors hover:bg-interactive-primary/90"
            >
              별지도로 가기
            </Link>
          </div>
        )}

        {items.length > 0 && (
          <>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-border-default bg-surface-1 p-4">
                <p className="text-xs text-text-tertiary">전체 응시</p>
                <p className="font-mono text-2xl font-bold text-aurora">{totalElements}</p>
              </div>
              <div className="rounded-2xl border border-border-default bg-surface-1 p-4">
                <p className="text-xs text-text-tertiary">
                  만점{items.length < totalElements ? ` (최근 ${items.length}회 중)` : ""}
                </p>
                <p className="font-mono text-2xl font-bold text-aurora">{perfect}</p>
              </div>
            </div>
            <ul className="space-y-2">
              {items.map((a) => (
                <li
                  key={a.attemptId ?? `${a.programId}-${a.createdAt}`}
                  className="flex items-center gap-3 rounded-2xl border border-border-default bg-surface-1 p-4"
                >
                  <div className="min-w-0 flex-1">
                    {a.programTitle ? (
                      <Link
                        href={`/starmap?programId=${a.programId}`}
                        className="block truncate text-sm font-medium text-text-primary hover:underline"
                      >
                        {a.programTitle}
                      </Link>
                    ) : (
                      <p className="truncate text-sm text-text-tertiary">삭제된 프로그램</p>
                    )}
                    <p className="mt-0.5 text-xs text-text-tertiary">{formatDate(a.createdAt)}</p>
                  </div>
                  <p className="shrink-0 font-mono text-sm text-text-primary">
                    {a.score}
                    <span className="text-text-tertiary"> / {a.total}</span>
                  </p>
                </li>
              ))}
            </ul>
            {page + 1 < totalPages && (
              <button
                onClick={() => load(page + 1)}
                disabled={loading}
                className="mt-4 w-full rounded-lg border border-border-default bg-surface-1 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary disabled:opacity-40"
              >
                {loading ? "불러오는 중..." : "더 보기"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
