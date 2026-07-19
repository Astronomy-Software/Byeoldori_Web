"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StellariumControl } from "@/lib/stellarium-control";
import { executeStep } from "@/lib/education-engine";
import { Live2DCharacter } from "@/components/live2d-character";
import { characterManager } from "@/lib/character-manager";
import { speak, cancelNarration, warmupVoices } from "@/lib/narration";
import {
  createProgram,
  updateProgram,
  submitProgram,
  type ProgramDifficulty,
  type ProgramStatus,
} from "@/lib/api/education-program";
import type { CharacterMotion, EduStep } from "@/types/education";
import { toast } from "sonner";
import { ArrowLeft, ArrowUp, ArrowDown, Trash2, Play, Square } from "lucide-react";

const MOTIONS: CharacterMotion[] = [
  "Idle",
  "Happy",
  "Angry",
  "Crying",
  "Her",
  "Appearance",
  "Exit",
];

// starmap의 stepLabel과 동일한 규칙 + 저작 전용 타입(look-at/set-time/toggle-constellation) 추가
function stepLabel(step: EduStep): string {
  switch (step.type) {
    case "camera-move":
      return `📷 ${step.target ?? "이동"}`;
    case "look-at":
      return `📷 시점 (az ${step.az ?? 0}° / alt ${step.alt ?? 0}° / fov ${step.fov ?? "-"}°)`;
    case "highlight-stars":
      return `✦ 별 강조 (${step.stars?.length ?? 0}개)`;
    case "draw-line":
      return `— ${step.from ?? "?"} → ${step.to ?? "?"}`;
    case "show-text":
      return `💬 ${step.text ? step.text.slice(0, 22) + "…" : "텍스트"}`;
    case "show-image":
      return `🖼 이미지`;
    case "set-time":
      return `🕐 ${step.time ? new Date(step.time).toLocaleString("ko-KR") : "시간"}`;
    case "toggle-constellation":
      return `✨ 별자리 토글`;
    case "clear-overlays":
      return `○ 오버레이 초기화`;
    case "wait":
      return `⏸ 대기 ${step.waitMs ?? 0}ms`;
    case "composite":
      return `◈ 복합 (${step.steps?.length ?? 0}개)`;
    default:
      return step.type;
  }
}

// ISO 문자열 ↔ <input type="datetime-local"> 값 변환 (로컬 시간대 기준)
function isoToLocalInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function localInputToIso(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

// 체크박스 3상태(미설정/켜기/끄기)를 select 값으로 표현
function triValue(v: boolean | undefined): string {
  return v === undefined ? "" : v ? "on" : "off";
}
function triParse(v: string): boolean | undefined {
  return v === "" ? undefined : v === "on";
}

const INPUT_CLS =
  "border-border-default bg-surface-1 text-text-primary placeholder:text-text-tertiary";
const SELECT_CLS =
  "w-full rounded-md border border-border-default bg-surface-1 px-3 py-2 text-sm text-text-primary";

export default function ProgramAuthorPage() {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const controlRef = useRef<StellariumControl | null>(null);
  // 재생 세션 토큰 — 정지/재시작 시 이전 루프를 무효화한다
  const playTokenRef = useRef(0);

  const [stelReady, setStelReady] = useState(false);
  const [selectedStar, setSelectedStar] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [difficulty, setDifficulty] = useState<ProgramDifficulty>("BEGINNER");
  const [steps, setSteps] = useState<EduStep[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const [programId, setProgramId] = useState<string | null>(null);
  const [status, setStatus] = useState<ProgramStatus | null>(null);
  const [saving, setSaving] = useState(false);

  const [playing, setPlaying] = useState(false);
  const [playIndex, setPlayIndex] = useState<number | null>(null);
  const [charText, setCharText] = useState<string | null>(null);

  // Stellarium 컨트롤 초기화 (starmap과 동일 패턴)
  useEffect(() => {
    if (!iframeRef.current) return;
    const ctrl = new StellariumControl(iframeRef.current);
    controlRef.current = ctrl;

    ctrl.waitForReady(60000).then((ready) => {
      if (!ready) {
        console.warn("[Author] Stellarium 준비 타임아웃");
        return;
      }
      setStelReady(true);
      ctrl.onStarSelected((name) => setSelectedStar(name));
    });
  }, []);

  // iframe→parent postMessage 리스너 (별 선택)
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "BYEOLDORI_STAR_SELECTED") {
        setSelectedStar(e.data.name || null);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const addStep = useCallback((step: EduStep) => {
    setSteps((prev) => {
      setEditIndex(prev.length);
      return [...prev, step];
    });
  }, []);

  const updateStep = useCallback((idx: number, patch: Partial<EduStep>) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    );
  }, []);

  const removeStep = useCallback((idx: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== idx));
    setEditIndex((cur) => (cur === idx ? null : cur !== null && cur > idx ? cur - 1 : cur));
  }, []);

  const moveStep = useCallback((idx: number, dir: -1 | 1) => {
    setSteps((prev) => {
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
    setEditIndex((cur) => (cur === idx ? idx + dir : cur));
  }, []);

  // 현재 화면 시점을 look-at 스텝으로 캡처 — 감독모드의 핵심
  const captureView = useCallback(() => {
    const view = controlRef.current?.getCurrentView();
    if (!view) {
      toast.error("현재 시점을 읽지 못했습니다. 별지도 로딩을 기다려주세요.");
      return;
    }
    addStep({ type: "look-at", az: view.az, alt: view.alt, fov: view.fov });
    toast.success(`시점 캡처: az ${view.az}° / alt ${view.alt}° / fov ${view.fov}°`);
  }, [addStep]);

  const captureTime = useCallback(
    (idx: number) => {
      const view = controlRef.current?.getCurrentView();
      if (!view) {
        toast.error("현재 시각을 읽지 못했습니다.");
        return;
      }
      updateStep(idx, { time: view.time });
      toast.success("현재 별지도 시각을 담았습니다.");
    },
    [updateStep],
  );

  // ── 미리보기 재생 ──────────────────────────────────────────
  const stopPlay = useCallback(() => {
    playTokenRef.current += 1;
    cancelNarration();
    setPlaying(false);
    setPlayIndex(null);
    setCharText(null);
  }, []);

  const playFrom = useCallback(
    async (start: number) => {
      const ctrl = controlRef.current;
      if (!ctrl) return;
      playTokenRef.current += 1;
      const token = playTokenRef.current;
      warmupVoices();
      setPlaying(true);

      const snapshot = steps;
      for (let i = start; i < snapshot.length; i++) {
        if (playTokenRef.current !== token) return;
        setPlayIndex(i);
        await executeStep(snapshot[i], ctrl, {
          onText: (text, motion, duration) => {
            setCharText(text);
            speak(text);
            if (motion) characterManager.playMotion(motion);
            if (duration && duration > 0) {
              setTimeout(() => setCharText(null), duration);
            }
          },
          onImage: () => {
            // 저작 화면에서는 이미지 스텝을 추가하지 않으므로 미리보기 생략
          },
          onClearOverlays: () => ctrl.clearOverlays(),
          onDrawLine: (from, to, color) => ctrl.drawLine(from, to, color),
        });
      }
      if (playTokenRef.current === token) {
        setPlaying(false);
        setPlayIndex(null);
      }
    },
    [steps],
  );

  // ── 저장 ───────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        difficulty,
        steps,
      };
      const res = programId
        ? await updateProgram(programId, payload)
        : await createProgram(payload);
      setProgramId(res.id);
      setStatus(res.status);
      toast.success("임시저장되었습니다.");
    } catch {
      toast.error("저장에 실패했습니다. 로그인 상태를 확인해주세요.");
    } finally {
      setSaving(false);
    }
  }, [title, subtitle, difficulty, steps, programId]);

  const handleSubmit = useCallback(async () => {
    if (!programId) {
      toast.error("먼저 임시저장을 해주세요.");
      return;
    }
    setSaving(true);
    try {
      const res = await submitProgram(programId);
      setStatus(res.status);
      toast.success("검수를 요청했습니다.");
    } catch {
      toast.error("검수 요청에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }, [programId]);

  const editing = editIndex !== null ? steps[editIndex] : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-bg-page md:h-screen md:flex-row md:overflow-hidden">
      {/* 좌: Stellarium 미리보기 */}
      <div className="relative h-[45vh] w-full shrink-0 bg-black md:h-full md:flex-1">
        <iframe
          ref={iframeRef}
          src="/stellarium/index.html"
          className="h-full w-full border-0"
          allow="gyroscope; accelerometer"
          title="Stellarium 별지도"
        />

        {!stelReady && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-sm text-white/40">별지도 초기화 중...</span>
          </div>
        )}

        {selectedStar && (
          <div className="absolute left-1/2 top-4 z-40 -translate-x-1/2 rounded-full border border-white/20 bg-black/70 px-4 py-1.5 text-sm text-white backdrop-blur-sm">
            ✦ 선택된 별: {selectedStar}
          </div>
        )}

        {charText && (
          <div className="absolute bottom-4 left-4 z-50 max-w-[280px] rounded-2xl border border-white/20 bg-black/85 p-3 shadow-2xl backdrop-blur-sm">
            <p className="text-sm leading-relaxed text-white">{charText}</p>
          </div>
        )}

        <Live2DCharacter />
      </div>

      {/* 우: 저작 패널 */}
      <div className="flex w-full flex-col border-t border-border-default md:h-full md:w-[400px] md:shrink-0 md:border-l md:border-t-0">
        {/* 헤더 + 메타 정보 */}
        <div className="space-y-3 border-b border-border-default p-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-text-tertiary transition-colors hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> 돌아가기
          </button>

          <h1 className="text-lg font-bold tracking-tight text-text-primary">
            교육 프로그램 제작
          </h1>

          <div className="space-y-1.5">
            <Label htmlFor="p-title" className="text-text-secondary">제목</Label>
            <Input
              id="p-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="여름철 대삼각형 찾기"
              className={INPUT_CLS}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-subtitle" className="text-text-secondary">부제</Label>
            <Input
              id="p-subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="선택 입력"
              className={INPUT_CLS}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-difficulty" className="text-text-secondary">난이도</Label>
            <select
              id="p-difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as ProgramDifficulty)}
              className={SELECT_CLS}
            >
              <option value="BEGINNER">입문</option>
              <option value="INTERMEDIATE">중급</option>
              <option value="ADVANCED">고급</option>
            </select>
          </div>

          {programId && (
            <p className="font-mono text-xs text-text-tertiary">
              프로그램 ID: {programId}
              {status ? ` · ${status}` : ""}
            </p>
          )}
        </div>

        {/* 스텝 추가 버튼 */}
        <div className="border-b border-border-default p-3">
          <p className="mb-2 text-xs font-medium text-text-secondary">스텝 추가</p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={captureView}
              disabled={!stelReady}
              className="glow-primary col-span-2 rounded-lg bg-interactive-primary px-3 py-2 text-sm text-white transition-colors hover:bg-interactive-primary/90 disabled:opacity-40"
            >
              📷 현재 장면 캡처
            </button>
            <AddButton onClick={() => addStep({ type: "show-text", text: "", motion: "Idle" })}>
              💬 나레이션
            </AddButton>
            <AddButton
              onClick={() =>
                addStep({
                  type: "highlight-stars",
                  stars: selectedStar ? [selectedStar] : [],
                })
              }
            >
              ✦ 별 강조
            </AddButton>
            <AddButton
              onClick={() =>
                addStep({ type: "draw-line", from: selectedStar ?? "", to: "" })
              }
            >
              — 선 긋기
            </AddButton>
            <AddButton onClick={() => addStep({ type: "set-time", timeSpeed: 0 })}>
              🕐 시간 설정
            </AddButton>
            <AddButton
              onClick={() => addStep({ type: "toggle-constellation", constellationLines: true })}
            >
              ✨ 별자리 토글
            </AddButton>
            <AddButton onClick={() => addStep({ type: "wait", waitMs: 1000 })}>
              ⏸ 대기
            </AddButton>
            <AddButton onClick={() => addStep({ type: "clear-overlays" })}>
              ○ 오버레이 초기화
            </AddButton>
          </div>
        </div>

        {/* 스텝 목록 + 인라인 편집 */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-text-secondary">
              스텝 <span className="font-mono text-aurora">{steps.length}</span>
            </p>
            {playing && (
              <button
                onClick={stopPlay}
                className="flex items-center gap-1 text-xs text-error hover:opacity-80"
              >
                <Square className="h-3 w-3" /> 정지
              </button>
            )}
          </div>

          {steps.length === 0 && (
            <p className="py-8 text-center text-xs text-text-tertiary">
              위 버튼으로 스텝을 추가하세요.
            </p>
          )}

          <div className="space-y-1.5">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={`rounded-xl border transition-colors ${
                  idx === playIndex
                    ? "border-aurora bg-surface-2"
                    : idx === editIndex
                      ? "border-interactive-primary bg-surface-1"
                      : "border-border-default bg-surface-1"
                }`}
              >
                <div className="flex items-center gap-1 p-2">
                  <button
                    type="button"
                    onClick={() => setEditIndex(idx === editIndex ? null : idx)}
                    className="min-w-0 flex-1 truncate text-left text-xs text-text-primary"
                  >
                    <span className="mr-1.5 font-mono text-text-tertiary">{idx + 1}.</span>
                    {stepLabel(step)}
                  </button>
                  <button
                    type="button"
                    onClick={() => playFrom(idx)}
                    aria-label="여기부터 재생"
                    title="여기부터 재생"
                    className="p-1 text-text-tertiary transition-colors hover:text-aurora"
                  >
                    <Play className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStep(idx, -1)}
                    disabled={idx === 0}
                    aria-label="위로"
                    className="p-1 text-text-tertiary transition-colors hover:text-text-primary disabled:opacity-25"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStep(idx, 1)}
                    disabled={idx === steps.length - 1}
                    aria-label="아래로"
                    className="p-1 text-text-tertiary transition-colors hover:text-text-primary disabled:opacity-25"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeStep(idx)}
                    aria-label="삭제"
                    className="p-1 text-text-tertiary transition-colors hover:text-error"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {idx === editIndex && editing && (
                  <div className="space-y-2 border-t border-border-default p-3">
                    <StepEditor
                      step={editing}
                      index={idx}
                      selectedStar={selectedStar}
                      onChange={updateStep}
                      onCaptureTime={captureTime}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 저장 액션 */}
        <div className="space-y-2 border-t border-border-default p-3">
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => (playing ? stopPlay() : playFrom(0))}
              variant="outline"
              className="flex-1 border-border-default text-text-primary"
              disabled={!stelReady || steps.length === 0}
            >
              {playing ? "■ 정지" : "▶ 처음부터 재생"}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="glow-primary flex-1 bg-interactive-primary text-white hover:bg-interactive-primary/90"
            >
              {saving ? "저장 중..." : "임시저장"}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleSubmit}
              variant="outline"
              disabled={!programId || saving}
              className="flex-1 border-border-default text-text-primary"
            >
              검수 요청
            </Button>
            <Button
              type="button"
              onClick={() => router.push(`/community/program/new?programId=${programId}`)}
              variant="outline"
              disabled={!programId}
              className="flex-1 border-border-default text-text-primary"
            >
              이 프로그램으로 글쓰기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-border-default bg-surface-1 px-2 py-2 text-xs text-text-primary transition-colors hover:border-interactive-primary"
    >
      {children}
    </button>
  );
}

function StepEditor({
  step,
  index,
  selectedStar,
  onChange,
  onCaptureTime,
}: {
  step: EduStep;
  index: number;
  selectedStar: string | null;
  onChange: (idx: number, patch: Partial<EduStep>) => void;
  onCaptureTime: (idx: number) => void;
}) {
  switch (step.type) {
    case "look-at":
      return (
        <div className="grid grid-cols-3 gap-2">
          {(["az", "alt", "fov"] as const).map((k) => (
            <div key={k} className="space-y-1">
              <Label className="text-[11px] text-text-secondary">{k} (°)</Label>
              <Input
                type="number"
                value={step[k] ?? ""}
                onChange={(e) =>
                  onChange(index, {
                    [k]: e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
                className={INPUT_CLS}
              />
            </div>
          ))}
        </div>
      );

    case "show-text":
      return (
        <>
          <div className="space-y-1">
            <Label className="text-[11px] text-text-secondary">나레이션 텍스트</Label>
            <Textarea
              value={step.text ?? ""}
              onChange={(e) => onChange(index, { text: e.target.value })}
              placeholder="여기 보이는 밝은 별이 직녀성이야!"
              className={`min-h-[70px] ${INPUT_CLS}`}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px] text-text-secondary">캐릭터 모션</Label>
              <select
                value={step.motion ?? "Idle"}
                onChange={(e) =>
                  onChange(index, { motion: e.target.value as CharacterMotion })
                }
                className={SELECT_CLS}
              >
                {MOTIONS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-text-secondary">표시 시간(ms)</Label>
              <Input
                type="number"
                value={step.textDuration ?? ""}
                onChange={(e) =>
                  onChange(index, {
                    textDuration:
                      e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
                placeholder="4000"
                className={INPUT_CLS}
              />
            </div>
          </div>
        </>
      );

    case "highlight-stars": {
      const stars = step.stars ?? [];
      return (
        <>
          <Label className="text-[11px] text-text-secondary">강조할 별</Label>
          <div className="flex flex-wrap gap-1.5">
            {stars.map((s, i) => (
              <span
                key={`${s}-${i}`}
                className="flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-text-secondary"
              >
                {s}
                <button
                  type="button"
                  aria-label={`${s} 제거`}
                  onClick={() =>
                    onChange(index, { stars: stars.filter((_, j) => j !== i) })
                  }
                  className="text-text-tertiary hover:text-error"
                >
                  ×
                </button>
              </span>
            ))}
            {stars.length === 0 && (
              <span className="text-xs text-text-tertiary">
                별지도에서 별을 클릭한 뒤 아래 버튼을 누르세요.
              </span>
            )}
          </div>
          <button
            type="button"
            disabled={!selectedStar}
            onClick={() =>
              selectedStar && onChange(index, { stars: [...stars, selectedStar] })
            }
            className="w-full rounded-lg border border-border-default bg-surface-1 px-2 py-1.5 text-xs text-text-primary transition-colors hover:border-interactive-primary disabled:opacity-40"
          >
            + 선택된 별 추가 {selectedStar ? `(${selectedStar})` : ""}
          </button>
        </>
      );
    }

    case "draw-line":
      return (
        <div className="space-y-2">
          {(["from", "to"] as const).map((k) => (
            <div key={k} className="space-y-1">
              <Label className="text-[11px] text-text-secondary">
                {k === "from" ? "시작 별" : "끝 별"}
              </Label>
              <div className="flex gap-1.5">
                <Input
                  value={step[k] ?? ""}
                  onChange={(e) => onChange(index, { [k]: e.target.value })}
                  placeholder="Vega"
                  className={INPUT_CLS}
                />
                <button
                  type="button"
                  disabled={!selectedStar}
                  onClick={() => selectedStar && onChange(index, { [k]: selectedStar })}
                  className="shrink-0 rounded-lg border border-border-default px-2 text-xs text-text-secondary transition-colors hover:border-interactive-primary disabled:opacity-40"
                >
                  선택 별
                </button>
              </div>
            </div>
          ))}
        </div>
      );

    case "set-time":
      return (
        <>
          <div className="space-y-1">
            <Label className="text-[11px] text-text-secondary">관측 시각</Label>
            <Input
              type="datetime-local"
              value={isoToLocalInput(step.time)}
              onChange={(e) =>
                onChange(index, { time: localInputToIso(e.target.value) })
              }
              className={INPUT_CLS}
            />
          </div>
          <button
            type="button"
            onClick={() => onCaptureTime(index)}
            className="w-full rounded-lg border border-border-default bg-surface-1 px-2 py-1.5 text-xs text-text-primary transition-colors hover:border-interactive-primary"
          >
            🕐 현재 별지도 시각 캡처
          </button>
          <div className="space-y-1">
            <Label className="text-[11px] text-text-secondary">
              시간 배속 (0=정지, 1=실시간, 3600=1초에 1시간)
            </Label>
            <Input
              type="number"
              value={step.timeSpeed ?? ""}
              onChange={(e) =>
                onChange(index, {
                  timeSpeed: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
              className={INPUT_CLS}
            />
          </div>
        </>
      );

    case "toggle-constellation":
      return (
        <div className="space-y-2">
          {(
            [
              ["constellationLines", "별자리 선"],
              ["constellationLabels", "별자리 이름"],
              ["constellationImages", "별자리 그림"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-1">
              <Label className="text-[11px] text-text-secondary">{label}</Label>
              <select
                value={triValue(step[key])}
                onChange={(e) => onChange(index, { [key]: triParse(e.target.value) })}
                className={SELECT_CLS}
              >
                <option value="">변경 안 함</option>
                <option value="on">켜기</option>
                <option value="off">끄기</option>
              </select>
            </div>
          ))}
        </div>
      );

    case "wait":
      return (
        <div className="space-y-1">
          <Label className="text-[11px] text-text-secondary">대기 시간(ms)</Label>
          <Input
            type="number"
            value={step.waitMs ?? ""}
            onChange={(e) =>
              onChange(index, {
                waitMs: e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
            className={INPUT_CLS}
          />
        </div>
      );

    default:
      return (
        <p className="text-xs text-text-tertiary">
          이 스텝은 별도 설정이 없습니다.
        </p>
      );
  }
}
