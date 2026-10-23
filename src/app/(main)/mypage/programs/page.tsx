"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clapperboard } from "lucide-react";
import { goBack } from "@/lib/navigation/in-app-history";
import {
  listPrograms,
  type ProgramSummary,
} from "@/lib/api/education-program";
import {
  programAuthorHref,
  programStatusLabel,
} from "@/lib/education-program-status";

const PAGE_SIZE = 20;

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

const STATUS_BADGE_CLS: Record<string, string> = {
  발행됨: "bg-aurora/15 text-aurora",
  "검수 대기": "bg-surface-2 text-text-secondary",
  반려됨: "bg-error/15 text-error",
  임시저장: "bg-surface-2 text-text-tertiary",
};

// 내가 만든 교육 프로그램(임시저장·검수 대기·반려·발행) 목록. 항목을 누르면 저작 화면에서 다시 연다.
export default function MyProgramsPage() {
  const router = useRouter();
  const [items, setItems] = useState<ProgramSummary[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(false);
    try {
      const res = await listPrograms({ mine: true, page: p, size: PAGE_SIZE });
      setItems((prev) => (p === 0 ? res.content : [...prev, ...res.content]));
      setPage(res.page);
      setTotalPages(res.totalPages);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0);
  }, [load]);

  return (
    <div className="starfield min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <button
          onClick={() => goBack(router, "/mypage")}
          className="mb-4 flex items-center gap-1 text-sm text-text-tertiary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> 돌아가기
        </button>
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="mb-2 text-2xl font-bold text-text-primary">내 교육 프로그램</h1>
            <p className="text-sm text-text-tertiary">
              만든 프로그램을 다시 열어 고치거나, 검수 결과를 확인해요.
            </p>
          </div>
          <Link
            href="/community/program/author"
            className="shrink-0 rounded-lg bg-interactive-primary px-3 py-2 text-sm text-white transition-colors hover:bg-interactive-primary/90"
          >
            새로 만들기
          </Link>
        </div>

        {error && (
          <p role="alert" className="mb-4 text-sm text-error">
            프로그램 목록을 불러오지 못했습니다.
          </p>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border-default bg-surface-1 px-6 py-16 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-interactive-link">
              <Clapperboard className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="text-sm font-medium text-text-secondary">아직 만든 프로그램이 없어요</p>
          </div>
        )}

        {items.length > 0 && (
          <ul className="space-y-2">
            {items.map((p) => {
              const label = programStatusLabel(p.status, p.rejectReason);
              return (
                <li key={p.id}>
                  <Link
                    href={programAuthorHref(p.id)}
                    className="block rounded-2xl border border-border-default bg-surface-1 p-4 transition-colors hover:border-border-strong hover:bg-surface-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE_CLS[label] ?? ""}`}
                      >
                        {label}
                      </span>
                      <p className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
                        {p.title || "제목 없는 프로그램"}
                      </p>
                    </div>
                    {label === "반려됨" && p.rejectReason && (
                      <p className="mt-1.5 line-clamp-2 whitespace-pre-wrap text-xs text-text-secondary">
                        반려 사유: {p.rejectReason}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-text-tertiary">{formatDate(p.updatedAt)}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {page + 1 < totalPages && (
          <button
            onClick={() => load(page + 1)}
            disabled={loading}
            className="mt-4 w-full rounded-lg border border-border-default bg-surface-1 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary disabled:opacity-40"
          >
            {loading ? "불러오는 중..." : "더 보기"}
          </button>
        )}
      </div>
    </div>
  );
}
