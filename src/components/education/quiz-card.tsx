"use client";

import type { EduStep } from "@/types/education";

// 교육 프로그램 재생 중 quiz 스텝이 오면 별지도 위에 띄우는 문제 카드.
// 고른 보기는 되돌릴 수 없다(첫 응답이 기록된다). 정오답과 해설은 고른 즉시 보여준다.
export function QuizCard({
  step,
  chosen,
  onChoose,
  className = "",
}: {
  step: EduStep;
  chosen: number | undefined;
  onChoose: (choice: number) => void;
  className?: string;
}) {
  const choices = step.choices ?? [];
  const answered = chosen !== undefined;
  const correct = answered && chosen === step.answerIndex;

  return (
    <div
      role="group"
      aria-labelledby="quiz-question"
      className={`w-[min(360px,calc(100%-2rem))] rounded-2xl border border-white/20 bg-gray-950/90 p-4 shadow-2xl backdrop-blur-sm ${className}`}
    >
      <p className="text-[11px] font-medium tracking-wide text-indigo-300">QUIZ</p>
      <p id="quiz-question" className="mt-1 text-sm font-medium leading-relaxed text-white">
        {step.question}
      </p>

      <div className="mt-3 space-y-1.5">
        {choices.map((choice, i) => {
          const isAnswer = i === step.answerIndex;
          const isChosen = i === chosen;
          const tone = !answered
            ? "border-white/15 bg-white/5 text-white hover:border-indigo-400 hover:bg-white/10"
            : isAnswer
              ? "border-green-400/70 bg-green-500/15 text-green-100"
              : isChosen
                ? "border-red-400/70 bg-red-500/15 text-red-100"
                : "border-white/10 bg-white/5 text-white/40";
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => onChoose(i)}
              aria-pressed={isChosen}
              className={`flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-default ${tone}`}
            >
              <span className="shrink-0 font-mono text-xs opacity-60">{i + 1}</span>
              <span className="min-w-0 flex-1">{choice}</span>
              {answered && isAnswer && <span aria-label="정답">✓</span>}
              {answered && isChosen && !isAnswer && <span aria-label="오답">✕</span>}
            </button>
          );
        })}
      </div>

      {answered && (
        <div role="status" aria-live="polite" className="mt-3 text-xs leading-relaxed">
          <p className={correct ? "font-medium text-green-300" : "font-medium text-red-300"}>
            {correct ? "정답이야! 🌟" : `아쉬워! 정답은 ${(step.answerIndex ?? 0) + 1}번이야.`}
          </p>
          {step.explanation && <p className="mt-1 text-white/70">{step.explanation}</p>}
          <p className="mt-2 text-white/40">아래 &ldquo;다음&rdquo;을 눌러 계속해요.</p>
        </div>
      )}
    </div>
  );
}
