"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getProgram,
  getQuizStats,
  type QuizStats,
} from "@/lib/api/education-program";
import { ApiError } from "@/lib/api/client";

function pct(n: number, d: number): string {
  return d > 0 ? `${Math.round((n / d) * 100)}%` : "-";
}

// 교육 프로그램 퀴즈 통계 — 작성자·관리자 전용(권한은 서버가 판정해 403).
function QuizStatsInner() {
  const router = useRouter();
  const id = useSearchParams().get("id");
  const [title, setTitle] = useState<string>("");
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const error = id ? loadError : "프로그램이 지정되지 않았습니다.";

  useEffect(() => {
    if (!id) return;
    getProgram(id)
      .then((d) => setTitle(d.title))
      .catch(() => {});
    getQuizStats(id)
      .then(setStats)
      .catch((e) => {
        setLoadError(
          e instanceof ApiError && e.status === 403
            ? "작성자 또는 관리자만 볼 수 있습니다."
            : e instanceof ApiError && e.status === 404
              ? "프로그램을 찾을 수 없습니다."
              : "통계를 불러오지 못했습니다.",
        );
      });
  }, [id]);

  return (
    <div className="starfield min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-1 text-sm text-text-tertiary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> 돌아가기
        </button>
        <h1 className="text-2xl font-bold text-text-primary">퀴즈 통계</h1>
        {title && <p className="mt-1 text-sm text-text-tertiary">{title}</p>}

        {error && (
          <p role="alert" className="mt-6 text-sm text-error">
            {error}
          </p>
        )}

        {stats && (
          <>
            <div className="mt-6 grid grid-cols-3 gap-2">
              {[
                ["응시", String(stats.attempts)],
                ["응시자", String(stats.uniqueUsers)],
                [
                  "평균 정답률",
                  stats.averageRate === null ? "-" : `${Math.round(stats.averageRate * 100)}%`,
                ],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-border-default bg-surface-1 p-4">
                  <p className="text-xs text-text-tertiary">{label}</p>
                  <p className="font-mono text-2xl font-bold text-aurora">{value}</p>
                </div>
              ))}
            </div>
            {stats.sampled < stats.attempts && (
              <p className="mt-2 text-xs text-text-tertiary">
                문항 통계는 최근 {stats.sampled}회 응시 기준입니다.
              </p>
            )}

            <ol className="mt-6 space-y-3">
              {stats.questions.map((q, qi) => (
                <li key={q.quizId} className="rounded-2xl border border-border-default bg-surface-1 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-text-primary">
                      <span className="mr-1.5 font-mono text-text-tertiary">Q{qi + 1}.</span>
                      {q.question}
                    </p>
                    <p className="shrink-0 font-mono text-sm text-aurora">
                      {pct(q.correct, q.answered)}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs text-text-tertiary">
                    응답 {q.answered}명 · 정답 {q.correct}명
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {q.choices.map((c, ci) => {
                      const count = q.choiceCounts[ci] ?? 0;
                      const width = q.answered > 0 ? (count / q.answered) * 100 : 0;
                      const isAnswer = ci === q.answerIndex;
                      return (
                        <li key={ci} className="text-xs">
                          <div className="flex justify-between gap-2">
                            <span className={isAnswer ? "font-medium text-green-400" : "text-text-secondary"}>
                              {ci + 1}. {c} {isAnswer && "✓"}
                            </span>
                            <span className="shrink-0 font-mono text-text-tertiary">
                              {count} ({pct(count, q.answered)})
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                            <div
                              className={`h-full rounded-full ${isAnswer ? "bg-green-500" : "bg-text-tertiary/50"}`}
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ol>
            {stats.questions.length === 0 && (
              <p className="mt-6 text-sm text-text-tertiary">이 프로그램에는 퀴즈가 없습니다.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function QuizStatsPage() {
  return (
    <Suspense>
      <QuizStatsInner />
    </Suspense>
  );
}
