"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { clientErrorMessage } from "@/lib/api/error-message";
import {
  listPrograms,
  publishProgram,
  rejectProgram,
  getAdminConfig,
  setAdminConfig,
  MODERATION_KEY,
  type ProgramSummary,
} from "@/lib/api/education-program";
import { collectPages } from "@/lib/api/paginate";
import { createLatestRequest } from "@/lib/latest-request";

type Tab = "pending" | "published";

// 서버 상한(EducationProgramController size ≤ 50)
const PAGE_SIZE = 50;

const DIFF_LABEL: Record<string, string> = {
  BEGINNER: "입문",
  INTERMEDIATE: "중급",
  ADVANCED: "고급",
};

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

// 교육 프로그램 검수(관리자 전용). 권한은 서버가 최종 판정하고, 화면은 ADMIN 이 아니면 안내만 한다.
export default function AdminProgramsPage() {
  const router = useRouter();
  const { user, loadUser } = useAuthStore();
  const [tab, setTab] = useState<Tab>("pending");
  const [items, setItems] = useState<ProgramSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedPages, setLoadedPages] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  // 탭을 빠르게 바꾸거나 '더 보기'를 누른 뒤 늦게 온 이전 응답이 목록을 덮어쓰지 않게 한다.
  const [latestLoad] = useState(createLatestRequest);
  const [moderation, setModeration] = useState<boolean | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  // 반려 사유 입력 중인 프로그램
  const [rejecting, setRejecting] = useState<{ id: string; reason: string } | null>(null);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const isAdmin = !!user?.roles?.includes("ADMIN");

  // 서버는 한 번에 최대 50개만 준다. '더 보기'는 0페이지부터 다시 받아 이어붙인다.
  // 승인·반려로 목록에서 빠진 만큼 뒤 페이지가 당겨지므로, 다음 페이지만 받으면 그 사이 항목을 건너뛴다.
  const load = useCallback(async (t: Tab, pageCount: number) => {
    const isLatest = latestLoad.begin();
    setLoading(true);
    try {
      let lastTotalPages = 0;
      const { items: loaded } = await collectPages(
        async (page) => {
          const res = await listPrograms({ page, size: PAGE_SIZE, pending: t === "pending" });
          lastTotalPages = res.totalPages;
          return res;
        },
        { maxPages: pageCount },
      );
      if (!isLatest()) return;
      // 받는 사이 새 항목이 맨 앞에 끼면 같은 항목이 두 페이지에 걸쳐 올 수 있다.
      const unique = new Map(loaded.map((p) => [p.id, p] as const));
      setItems([...unique.values()]);
      setLoadedPages(pageCount);
      setTotalPages(lastTotalPages);
    } catch (e) {
      if (!isLatest()) return;
      toast.error(clientErrorMessage(e, "목록을 불러오지 못했습니다."));
      if (pageCount === 1) setItems([]);
    } finally {
      if (isLatest()) setLoading(false);
    }
  }, [latestLoad]);

  useEffect(() => {
    if (!isAdmin) return;
    load(tab, 1);
  }, [isAdmin, tab, load]);

  useEffect(() => {
    if (!isAdmin) return;
    getAdminConfig()
      .then((cfg) => setModeration((cfg[MODERATION_KEY] ?? "true") !== "false"))
      .catch(() => setModeration(null));
  }, [isAdmin]);

  const toggleModeration = async () => {
    if (moderation === null) return;
    const next = !moderation;
    try {
      await setAdminConfig(MODERATION_KEY, String(next));
      setModeration(next);
      toast.success(next ? "발행 전 검수를 켰습니다." : "검수 없이 작성자가 바로 발행할 수 있습니다.");
    } catch (e) {
      toast.error(clientErrorMessage(e, "설정을 바꾸지 못했습니다."));
    }
  };

  const handlePublish = async (p: ProgramSummary) => {
    setBusyId(p.id);
    try {
      await publishProgram(p.id);
      setItems((prev) => prev.filter((x) => x.id !== p.id));
      toast.success(`"${p.title}"을(를) 발행했습니다.`);
    } catch (e) {
      toast.error(clientErrorMessage(e, "발행에 실패했습니다."));
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async () => {
    if (!rejecting) return;
    setBusyId(rejecting.id);
    try {
      await rejectProgram(rejecting.id, rejecting.reason);
      setItems((prev) => prev.filter((x) => x.id !== rejecting.id));
      setRejecting(null);
      toast.success("반려했습니다. 작성자에게 사유가 표시됩니다.");
    } catch (e) {
      toast.error(clientErrorMessage(e, "반려에 실패했습니다."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="starfield min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-1 text-sm text-text-tertiary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> 돌아가기
        </button>
        <h1 className="text-2xl font-bold text-text-primary">교육 프로그램 검수</h1>

        {user && !isAdmin && (
          <p role="alert" className="mt-6 text-sm text-error">
            관리자만 이용할 수 있습니다.
          </p>
        )}

        {isAdmin && (
          <>
            {/* 모더레이션 토글 */}
            <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-border-default bg-surface-1 p-4">
              <div>
                <p className="text-sm font-medium text-text-primary">발행 전 검수</p>
                <p className="mt-0.5 text-xs text-text-tertiary">
                  {moderation === null
                    ? "설정을 불러오는 중..."
                    : moderation
                      ? "켜짐 — 관리자가 승인해야 발행됩니다."
                      : "꺼짐 — 작성자가 검수 요청 후 직접 발행할 수 있습니다."}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={!!moderation}
                aria-label="발행 전 검수"
                disabled={moderation === null}
                onClick={toggleModeration}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40 ${
                  moderation ? "bg-interactive-primary" : "bg-surface-2"
                }`}
              >
                <span
                  className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    moderation ? "translate-x-[22px]" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {/* 탭 */}
            <div role="tablist" className="mt-6 flex gap-1 border-b border-border-default">
              {(
                [
                  ["pending", "검수 대기"],
                  ["published", "발행됨"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => {
                    setRejecting(null);
                    setTab(key);
                  }}
                  className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
                    tab === key
                      ? "border-interactive-primary text-text-primary"
                      : "border-transparent text-text-tertiary hover:text-text-primary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {loading && <p className="mt-6 text-sm text-text-tertiary">불러오는 중...</p>}
            {!loading && items.length === 0 && (
              <p className="mt-6 text-sm text-text-tertiary">
                {tab === "pending" ? "검수를 기다리는 프로그램이 없습니다." : "발행된 프로그램이 없습니다."}
              </p>
            )}

            <ul className="mt-4 space-y-2">
              {items.map((p) => (
                <li key={p.id} className="rounded-2xl border border-border-default bg-surface-1 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text-primary">{p.title}</p>
                      <p className="mt-0.5 text-xs text-text-tertiary">
                        {p.authorName ?? "알 수 없음"}
                        {p.difficulty ? ` · ${DIFF_LABEL[p.difficulty]}` : ""}
                        {p.updatedAt ? ` · ${formatDate(p.updatedAt)}` : ""}
                        {tab === "published" ? ` · 조회 ${p.viewCount}` : ""}
                      </p>
                    </div>
                    <a
                      href={`/starmap?programId=${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex shrink-0 items-center gap-1 text-xs text-interactive-link transition-colors hover:text-aurora"
                    >
                      미리보기 <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  </div>

                  {tab === "pending" && rejecting?.id !== p.id && (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handlePublish(p)}
                        disabled={busyId === p.id}
                        className="flex-1 rounded-lg bg-interactive-primary py-2 text-sm text-white transition-colors hover:bg-interactive-primary/90 disabled:opacity-40"
                      >
                        승인·발행
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejecting({ id: p.id, reason: "" })}
                        disabled={busyId === p.id}
                        className="flex-1 rounded-lg border border-border-default py-2 text-sm text-text-primary transition-colors hover:border-error hover:text-error disabled:opacity-40"
                      >
                        반려
                      </button>
                    </div>
                  )}

                  {tab === "pending" && rejecting?.id === p.id && (
                    <div className="mt-3 space-y-2">
                      <label htmlFor={`reason-${p.id}`} className="text-xs text-text-secondary">
                        반려 사유 (작성자에게 보여요)
                      </label>
                      <textarea
                        id={`reason-${p.id}`}
                        value={rejecting.reason}
                        onChange={(e) => setRejecting({ id: p.id, reason: e.target.value })}
                        maxLength={500}
                        rows={3}
                        placeholder="예: 3번 스텝의 별 이름이 틀렸어요(Vegaa → Vega)."
                        className="w-full rounded-md border border-border-default bg-surface-2 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleReject}
                          disabled={busyId === p.id}
                          className="flex-1 rounded-lg bg-error/90 py-2 text-sm text-white transition-colors hover:bg-error disabled:opacity-40"
                        >
                          반려하기
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejecting(null)}
                          className="flex-1 rounded-lg border border-border-default py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  )}

                  {tab === "published" && (
                    <Link
                      href={`/community/program/stats?id=${p.id}`}
                      className="mt-3 inline-block text-xs text-text-secondary transition-colors hover:text-text-primary hover:underline"
                    >
                      📊 퀴즈 통계
                    </Link>
                  )}
                </li>
              ))}
            </ul>

            {loadedPages < totalPages && (
              <button
                type="button"
                onClick={() => load(tab, loadedPages + 1)}
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
