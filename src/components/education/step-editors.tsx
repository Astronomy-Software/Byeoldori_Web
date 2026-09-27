"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadImage } from "@/lib/api/files";
import type { StellariumControl } from "@/lib/stellarium-control";
import type { EduStep } from "@/types/education";
import { toast } from "sonner";

// 저작(감독모드) 화면의 스텝 편집기 중 상태가 필요한 것들.
// 스타일은 저작 페이지와 같은 토큰을 쓴다.
const INPUT_CLS =
  "border-border-default bg-surface-1 text-text-primary placeholder:text-text-tertiary";
const BTN_CLS =
  "rounded-lg border border-border-default bg-surface-1 px-2 py-1.5 text-xs text-text-primary transition-colors hover:border-interactive-primary disabled:opacity-40";

type Patch = (patch: Partial<EduStep>) => void;

function num(v: string): number | undefined {
  if (v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

// ── 하늘 이미지 ───────────────────────────────────────────
// 엔진 디코더(stb_image)는 JPG/PNG 만 읽는다. WebP/GIF 는 업로드 단계에서 막는다.
const SKY_IMAGE_TYPES = ["image/jpeg", "image/png"];

export function SkyImageEditor({
  step,
  onChange,
  control,
  selectedStar,
}: {
  step: EduStep;
  onChange: Patch;
  control: StellariumControl | null;
  selectedStar: string | null;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!SKY_IMAGE_TYPES.includes(file.type)) {
      toast.error("하늘 이미지는 JPG 또는 PNG만 쓸 수 있어요.");
      return;
    }
    setUploading(true);
    try {
      const res = await uploadImage(file);
      if (!res.url) throw new Error("업로드 응답에 URL이 없습니다");
      onChange({ imageUrl: res.url });
      toast.success("이미지를 올렸어요. 위치와 크기를 조정하세요.");
    } catch (e) {
      console.error("[Author] 하늘 이미지 업로드 실패:", e);
      toast.error("이미지 업로드에 실패했습니다. 로그인 상태를 확인해주세요.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const placeAtCenter = () => {
    const c = control?.getViewCenterRaDec();
    if (!c) {
      toast.error("화면 중심 좌표를 읽지 못했습니다.");
      return;
    }
    onChange({ ra: c.ra, dec: c.dec });
  };

  const placeAtStar = () => {
    if (!selectedStar) return;
    const c = control?.getObjectRaDec(selectedStar);
    if (!c) {
      toast.error(`${selectedStar}의 좌표를 찾지 못했습니다.`);
      return;
    }
    onChange({ ra: c.ra, dec: c.dec });
  };

  const size = step.sizeDeg ?? 10;
  const rotation = step.rotation ?? 0;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-[11px] text-text-secondary">이미지</Label>
        {step.imageUrl && (
          // 썸네일은 일반 <img> 라 다른 출처여도 보인다(엔진 로드는 같은 출처 프록시 경유)
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={step.imageUrl}
            alt="하늘 이미지 미리보기"
            className="max-h-28 rounded-md border border-border-default object-contain"
          />
        )}
        <div className="flex gap-1.5">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className={`${BTN_CLS} shrink-0`}
          >
            {uploading ? "올리는 중..." : "📁 업로드"}
          </button>
          <Input
            value={step.imageUrl ?? ""}
            onChange={(e) => onChange({ imageUrl: e.target.value })}
            placeholder="또는 이미지 URL (JPG/PNG)"
            className={INPUT_CLS}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px] text-text-secondary">하늘 위치 (적경·적위, °)</Label>
        <div className="grid grid-cols-2 gap-1.5">
          <button type="button" onClick={placeAtCenter} className={BTN_CLS}>
            ⌖ 화면 중심에 배치
          </button>
          <button
            type="button"
            onClick={placeAtStar}
            disabled={!selectedStar}
            className={`${BTN_CLS} truncate`}
          >
            ✦ {selectedStar ? `${selectedStar}에 배치` : "선택 별에 배치"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <Input
            type="number"
            aria-label="적경(°)"
            value={step.ra ?? ""}
            onChange={(e) => onChange({ ra: num(e.target.value) })}
            placeholder="적경 0~360"
            className={INPUT_CLS}
          />
          <Input
            type="number"
            aria-label="적위(°)"
            value={step.dec ?? ""}
            onChange={(e) => onChange({ dec: num(e.target.value) })}
            placeholder="적위 -90~90"
            className={INPUT_CLS}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="flex justify-between text-[11px] text-text-secondary">
          <span>크기 (가로폭)</span>
          <span className="font-mono">{size}°</span>
        </Label>
        <input
          type="range"
          min={0.5}
          max={90}
          step={0.5}
          value={size}
          onChange={(e) => onChange({ sizeDeg: Number(e.target.value) })}
          className="w-full accent-[var(--color-interactive-primary,#6366f1)]"
          aria-label="하늘 이미지 크기(度)"
        />
      </div>

      <div className="space-y-1">
        <Label className="flex justify-between text-[11px] text-text-secondary">
          <span>회전</span>
          <span className="font-mono">{rotation}°</span>
        </Label>
        <input
          type="range"
          min={-180}
          max={180}
          step={1}
          value={rotation}
          onChange={(e) => onChange({ rotation: Number(e.target.value) })}
          className="w-full accent-[var(--color-interactive-primary,#6366f1)]"
          aria-label="하늘 이미지 회전(度)"
        />
      </div>

      <p className="text-[11px] leading-relaxed text-text-tertiary">
        편집하는 동안 별지도에 바로 보입니다. 별지도를 돌려도 이미지는 하늘의 그 자리에 고정돼요.
      </p>
    </div>
  );
}

// ── 퀴즈 ──────────────────────────────────────────────────
const MIN_CHOICES = 2;
const MAX_CHOICES = 6; // 서버 검증(QuizSteps)과 같은 범위

export function QuizEditor({ step, onChange }: { step: EduStep; onChange: Patch }) {
  const choices = step.choices ?? ["", ""];
  const answer = step.answerIndex ?? 0;

  const setChoice = (i: number, value: string) =>
    onChange({ choices: choices.map((c, j) => (j === i ? value : c)) });

  const removeChoice = (i: number) => {
    const next = choices.filter((_, j) => j !== i);
    // 정답 번호가 지운 보기 뒤에 있으면 한 칸 당기고, 정답 자체를 지우면 첫 보기로
    const nextAnswer = answer === i ? 0 : answer > i ? answer - 1 : answer;
    onChange({ choices: next, answerIndex: nextAnswer });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-[11px] text-text-secondary">문제</Label>
        <Textarea
          value={step.question ?? ""}
          onChange={(e) => onChange({ question: e.target.value })}
          placeholder="여름철 대삼각형에 속하지 않는 별은?"
          maxLength={300}
          className={`min-h-[60px] ${INPUT_CLS}`}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px] text-text-secondary">보기 (정답을 선택하세요)</Label>
        {choices.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              type="radio"
              name={`quiz-answer-${step.id ?? "new"}`}
              checked={answer === i}
              onChange={() => onChange({ answerIndex: i })}
              aria-label={`${i + 1}번을 정답으로`}
              className="h-4 w-4 shrink-0 accent-green-500"
            />
            <Input
              value={c}
              onChange={(e) => setChoice(i, e.target.value)}
              placeholder={`${i + 1}번 보기`}
              maxLength={120}
              className={INPUT_CLS}
            />
            <button
              type="button"
              onClick={() => removeChoice(i)}
              disabled={choices.length <= MIN_CHOICES}
              aria-label={`${i + 1}번 보기 삭제`}
              className="shrink-0 px-1 text-text-tertiary transition-colors hover:text-error disabled:opacity-25"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange({ choices: [...choices, ""] })}
          disabled={choices.length >= MAX_CHOICES}
          className={`${BTN_CLS} w-full`}
        >
          + 보기 추가
        </button>
      </div>

      <div className="space-y-1">
        <Label className="text-[11px] text-text-secondary">해설 (선택)</Label>
        <Textarea
          value={step.explanation ?? ""}
          onChange={(e) => onChange({ explanation: e.target.value })}
          placeholder="데네브·베가·알타이르가 여름철 대삼각형이에요."
          className={`min-h-[50px] ${INPUT_CLS}`}
        />
      </div>
    </div>
  );
}

/** 저장 전 퀴즈 스텝 점검 — 서버 검증과 같은 규칙을 먼저 알려준다. 문제가 없으면 null. */
export function quizProblem(steps: EduStep[]): string | null {
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    if (s.type !== "quiz") continue;
    const choices = (s.choices ?? []).map((c) => c.trim());
    if (!s.question?.trim()) return `${i + 1}번 퀴즈: 문제를 입력해주세요.`;
    if (choices.length < MIN_CHOICES || choices.some((c) => !c)) {
      return `${i + 1}번 퀴즈: 보기를 ${MIN_CHOICES}개 이상 모두 채워주세요.`;
    }
    if (s.answerIndex === undefined || s.answerIndex < 0 || s.answerIndex >= choices.length) {
      return `${i + 1}번 퀴즈: 정답을 선택해주세요.`;
    }
  }
  return null;
}
