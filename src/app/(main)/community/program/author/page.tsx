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
  publishProgram,
  type ProgramDifficulty,
  type ProgramStatus,
} from "@/lib/api/education-program";
import { ApiError } from "@/lib/api/client";
import type {
  CharacterMotion,
  CharacterPosition,
  EduStep,
} from "@/types/education";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Play,
  Square,
} from "lucide-react";

const MOTIONS: CharacterMotion[] = [
  "Idle",
  "Happy",
  "Angry",
  "Crying",
  "Her",
  "Appearance",
  "Exit",
];

// 스텝 편집기의 "별도리 위치" 4지선다 + 미지정(직전 위치 유지)
const CHAR_POS_LABEL: Record<CharacterPosition, string> = {
  "bottom-left": "왼쪽",
  "bottom-center": "가운데",
  "bottom-right": "오른쪽",
  hidden: "숨김",
};

const CHAR_POS_OPTIONS: { value: CharacterPosition | ""; label: string }[] = [
  { value: "", label: "유지" },
  { value: "bottom-left", label: "왼쪽" },
  { value: "bottom-center", label: "가운데" },
  { value: "bottom-right", label: "오른쪽" },
  { value: "hidden", label: "숨김" },
];

// 저작 화면의 캐릭터는 우측 패널을 침범하면 안 되므로 좌측 별지도 영역 안에 absolute로 둔다
const AUTHOR_CHAR_BASE =
  "pointer-events-none absolute bottom-0 z-30 h-44 w-32 md:h-64 md:w-48";
const AUTHOR_CHAR_POS: Record<Exclude<CharacterPosition, "hidden">, string> = {
  "bottom-right": "right-0",
  "bottom-left": "left-0",
  "bottom-center": "left-1/2 -translate-x-1/2",
};

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

// 서버가 준 실패 사유를 그대로 보여준다. 401만 로그인 안내로 치환하고,
// 나머지는 body(JSON이면 message, 아니면 원문)를 노출해야 원인을 알 수 있다.
function apiMessage(e: unknown, fallback: string): string {
  if (!(e instanceof ApiError)) return fallback;
  if (e.status === 401) return "로그인이 필요합니다. 로그인 상태를 확인해주세요.";
  const raw = e.body?.trim();
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as { message?: unknown };
    if (typeof parsed?.message === "string" && parsed.message.trim()) {
      return parsed.message;
    }
  } catch {
    // JSON이 아니면 원문을 그대로 쓴다
  }
  return raw;
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
  // 미리보기 중 예약한 자막 숨김 타이머 — 정지·재시작·언마운트 시 모두 걷어낸다
  const playTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

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
  // 미리보기 중 별도리가 어디에 서 있는지 — 스텝의 characterPosition을 그대로 반영한다
  const [charPos, setCharPos] = useState<CharacterPosition>("bottom-right");

  // 상단 메타(제목/부제/난이도) 접기 — 스텝 작업 중 세로 공간 확보용
  const [metaOpen, setMetaOpen] = useState(true);
  // 하단 "+ 스텝 추가" 팝오버
  const [addMenuOpen, setAddMenuOpen] = useState(false);

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
    setAddMenuOpen(false);
  }, []);

  const updateStep = useCallback((idx: number, patch: Partial<EduStep>) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    );
  }, []);

  const removeStep = useCallback((idx: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== idx));
    setEditIndex((cur) =>
      cur === idx ? null : cur !== null && cur > idx ? cur - 1 : cur,
    );
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
    setAddMenuOpen(false);
    const view = controlRef.current?.getCurrentView();
    if (!view) {
      toast.error("현재 시점을 읽지 못했습니다. 별지도 로딩을 기다려주세요.");
      return;
    }
    addStep({ type: "look-at", az: view.az, alt: view.alt, fov: view.fov });
    toast.success(
      `시점 캡처: az ${view.az}° / alt ${view.alt}° / fov ${view.fov}°`,
    );
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
  const clearPlayTimers = useCallback(() => {
    playTimersRef.current.forEach(clearTimeout);
    playTimersRef.current = [];
  }, []);

  const stopPlay = useCallback(() => {
    playTokenRef.current += 1;
    clearPlayTimers();
    cancelNarration();
    setPlaying(false);
    setPlayIndex(null);
    setCharText(null);
    setCharPos("bottom-right");
  }, [clearPlayTimers]);

  // 화면을 떠나도 타이머·나레이션이 살아남지 않도록 정리
  useEffect(
    () => () => {
      playTokenRef.current += 1;
      playTimersRef.current.forEach(clearTimeout);
      playTimersRef.current = [];
      cancelNarration();
    },
    [],
  );

  const playFrom = useCallback(
    async (start: number) => {
      const ctrl = controlRef.current;
      if (!ctrl) return;
      playTokenRef.current += 1;
      const token = playTokenRef.current;
      clearPlayTimers();
      cancelNarration();
      warmupVoices();
      setPlaying(true);
      setCharPos("bottom-right");

      // 별 카탈로그가 아직 로드 중이면 getObj가 null이라 카메라 이동·별 강조·선 긋기가
      // 조용히 무시된다. starmap과 동일하게 조회 가능해질 때까지 기다린다.
      const ok = await ctrl.waitForCatalog();
      if (playTokenRef.current !== token) return;
      if (!ok) {
        toast.error(
          "별 데이터 로딩이 끝나지 않았습니다. 잠시 후 다시 재생해주세요.",
        );
        setPlaying(false);
        setPlayIndex(null);
        return;
      }

      const alive = () => playTokenRef.current === token;

      const snapshot = steps;
      for (let i = start; i < snapshot.length; i++) {
        if (!alive()) return;
        setPlayIndex(i);
        await executeStep(snapshot[i], ctrl, {
          onText: (text, motion, duration) => {
            if (!alive()) return;
            setCharText(text);
            speak(text);
            if (motion) characterManager.playMotion(motion);
            if (duration && duration > 0) {
              playTimersRef.current.push(
                setTimeout(() => {
                  if (alive()) setCharText(null);
                }, duration),
              );
            }
          },
          onImage: () => {
            // 저작 화면에서는 이미지 스텝을 추가하지 않으므로 미리보기 생략
          },
          onClearOverlays: () => {
            if (alive()) ctrl.clearOverlays();
          },
          onDrawLine: (from, to, color) =>
            alive() ? ctrl.drawLine(from, to, color) : false,
          onCharacterPosition: (pos) => {
            if (alive()) setCharPos(pos);
          },
          // 별 이름 오타를 저작자가 즉시 알 수 있어야 한다
          onStepWarning: (message) => {
            if (alive()) toast.warning(message);
          },
        });
      }
      if (alive()) {
        setPlaying(false);
        setPlayIndex(null);
      }
    },
    [steps, clearPlayTimers],
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
    } catch (e) {
      toast.error(apiMessage(e, "저장에 실패했습니다."));
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
    } catch (e) {
      toast.error(apiMessage(e, "검수 요청에 실패했습니다."));
    } finally {
      setSaving(false);
    }
  }, [programId]);

  // PREVIEW → PUBLISHED. moderation이 켜져 있으면 ADMIN만 통과하고,
  // 권한이 없으면 서버가 403을 주므로 그 메시지를 그대로 보여준다.
  const handlePublish = useCallback(async () => {
    if (!programId) {
      toast.error("먼저 임시저장을 해주세요.");
      return;
    }
    setSaving(true);
    try {
      const res = await publishProgram(programId);
      setStatus(res.status);
      toast.success("발행되었습니다.");
    } catch (e) {
      toast.error(apiMessage(e, "발행에 실패했습니다."));
    } finally {
      setSaving(false);
    }
  }, [programId]);

  // 상태에 따라 하나의 진행 버튼이 다음 단계를 안내한다:
  // DRAFT → 검수 요청, PREVIEW → 발행, PUBLISHED → 비활성("발행됨")
  const published = status === "PUBLISHED";
  const stageAction: { label: string; onClick: () => void; disabled: boolean } =
    published
      ? { label: "발행됨", onClick: () => {}, disabled: true }
      : status === "PREVIEW"
        ? { label: "발행", onClick: handlePublish, disabled: false }
        : { label: "검수 요청", onClick: handleSubmit, disabled: false };

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
          <div className="absolute left-4 top-16 z-50 max-w-[280px] rounded-2xl border border-white/20 bg-black/85 p-3 shadow-2xl backdrop-blur-sm">
            <p className="text-sm leading-relaxed text-white">{charText}</p>
          </div>
        )}

        {/* 별도리는 별지도 영역 안에만 머문다 — 우측 저작 패널을 가리지 않도록 absolute 배치 */}
        {charPos !== "hidden" && (
          <Live2DCharacter
            className={`${AUTHOR_CHAR_BASE} ${AUTHOR_CHAR_POS[charPos]}`}
          />
        )}
      </div>

      {/* 우: 저작 패널 */}
      <div className="flex w-full flex-col border-t border-border-default md:h-full md:w-[400px] md:shrink-0 md:border-l md:border-t-0">
        {/* ① 상단(고정): 헤더 + 접히는 메타 정보 */}
        <div className="shrink-0 border-b border-border-default p-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              aria-label="돌아가기"
              className="text-text-tertiary transition-colors hover:text-text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="min-w-0 flex-1 truncate text-base font-bold tracking-tight text-text-primary">
              {metaOpen
                ? "교육 프로그램 제작"
                : title.trim() || "제목 없는 프로그램"}
            </h1>
            <button
              type="button"
              onClick={() => setMetaOpen((v) => !v)}
              aria-expanded={metaOpen}
              className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-text-tertiary transition-colors hover:text-text-primary"
            >
              {metaOpen ? (
                <>
                  접기 <ChevronUp className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  정보 <ChevronDown className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>

          {metaOpen && (
            <div className="mt-3 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-title" className="text-text-secondary">
                  제목
                </Label>
                <Input
                  id="p-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="여름철 대삼각형 찾기"
                  className={INPUT_CLS}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-subtitle" className="text-text-secondary">
                  부제
                </Label>
                <Input
                  id="p-subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="선택 입력"
                  className={INPUT_CLS}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-difficulty" className="text-text-secondary">
                  난이도
                </Label>
                <select
                  id="p-difficulty"
                  value={difficulty}
                  onChange={(e) =>
                    setDifficulty(e.target.value as ProgramDifficulty)
                  }
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
          )}
        </div>

        {/* ② 중앙(flex-1, 스크롤): 스텝 목록 — 저작의 주인공 */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-border-default px-3 py-2">
            <p className="text-xs font-medium text-text-secondary">
              스텝 <span className="font-mono text-aurora">{steps.length}</span>
            </p>
            <button
              type="button"
              onClick={() => (playing ? stopPlay() : playFrom(0))}
              disabled={!stelReady || steps.length === 0}
              className="flex items-center gap-1 text-xs text-text-secondary transition-colors hover:text-text-primary disabled:opacity-30"
            >
              {playing ? (
                <>
                  <Square className="h-3 w-3 text-error" /> 정지
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" /> 처음부터 재생
                </>
              )}
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {steps.length === 0 && (
              <p className="py-8 text-center text-xs leading-relaxed text-text-tertiary">
                아직 스텝이 없습니다.
                <br />
                아래 <span className="text-text-secondary">＋ 스텝 추가</span>로
                시작하세요.
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
                      onClick={() =>
                        setEditIndex(idx === editIndex ? null : idx)
                      }
                      className="min-w-0 flex-1 truncate text-left text-xs text-text-primary"
                    >
                      <span className="mr-1.5 font-mono text-text-tertiary">
                        {idx + 1}.
                      </span>
                      {stepLabel(step)}
                      {step.characterPosition && (
                        <span className="ml-1.5 text-[10px] text-text-tertiary">
                          🙋{CHAR_POS_LABEL[step.characterPosition]}
                        </span>
                      )}
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
                      {/* 캐릭터 위치는 모든 스텝 타입에서 지정할 수 있다 */}
                      <div className="space-y-1 pt-1">
                        <Label className="text-[11px] text-text-secondary">
                          별도리 위치
                        </Label>
                        <div className="grid grid-cols-5 gap-1">
                          {CHAR_POS_OPTIONS.map((opt) => {
                            const active =
                              (editing.characterPosition ?? "") === opt.value;
                            return (
                              <button
                                key={opt.value || "keep"}
                                type="button"
                                onClick={() =>
                                  updateStep(idx, {
                                    characterPosition: opt.value || undefined,
                                  })
                                }
                                className={`rounded-md border px-1 py-1.5 text-[10px] transition-colors ${
                                  active
                                    ? "border-interactive-primary bg-surface-2 text-text-primary"
                                    : "border-border-default bg-surface-1 text-text-tertiary hover:border-interactive-primary"
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ③ 하단(고정): 캡처 · 스텝 추가 팝오버 · 액션 바 */}
        <div className="shrink-0 space-y-2 border-t border-border-default p-3">
          {/* 가장 자주 쓰는 동작 — 항상 노출 */}
          <button
            type="button"
            onClick={captureView}
            disabled={!stelReady}
            className="glow-primary w-full rounded-lg bg-interactive-primary px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-interactive-primary/90 disabled:opacity-40"
          >
            📷 현재 장면 캡처
          </button>

          <div className="relative">
            {addMenuOpen && (
              <>
                {/* 바깥 클릭 시 닫힘 */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setAddMenuOpen(false)}
                />
                <div className="absolute bottom-full left-0 z-50 mb-2 w-full overflow-hidden rounded-xl border border-border-default bg-surface-1 shadow-2xl">
                  <AddMenuItem onClick={captureView} disabled={!stelReady}>
                    📷 현재 장면 캡처
                  </AddMenuItem>
                  <AddMenuItem
                    onClick={() =>
                      addStep({ type: "show-text", text: "", motion: "Idle" })
                    }
                  >
                    💬 나레이션
                  </AddMenuItem>
                  <AddMenuItem
                    onClick={() =>
                      addStep({
                        type: "highlight-stars",
                        stars: selectedStar ? [selectedStar] : [],
                      })
                    }
                  >
                    ✦ 별 강조
                  </AddMenuItem>
                  <AddMenuItem
                    onClick={() =>
                      addStep({
                        type: "draw-line",
                        from: selectedStar ?? "",
                        to: "",
                      })
                    }
                  >
                    — 선 긋기
                  </AddMenuItem>
                  <AddMenuItem
                    onClick={() => addStep({ type: "set-time", timeSpeed: 0 })}
                  >
                    🕐 시간 설정
                  </AddMenuItem>
                  <AddMenuItem
                    onClick={() =>
                      addStep({
                        type: "toggle-constellation",
                        constellationLines: true,
                      })
                    }
                  >
                    ✨ 별자리 토글
                  </AddMenuItem>
                  <AddMenuItem
                    onClick={() => addStep({ type: "wait", waitMs: 1000 })}
                  >
                    ⏸ 대기
                  </AddMenuItem>
                  <AddMenuItem
                    onClick={() => addStep({ type: "clear-overlays" })}
                  >
                    ○ 오버레이 초기화
                  </AddMenuItem>
                </div>
              </>
            )}
            <button
              type="button"
              onClick={() => setAddMenuOpen((v) => !v)}
              aria-expanded={addMenuOpen}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border-default bg-surface-1 px-3 py-2 text-sm text-text-primary transition-colors hover:border-interactive-primary"
            >
              <Plus className="h-4 w-4" /> 스텝 추가
            </button>
          </div>

          <div className="flex gap-1.5">
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className="glow-primary flex-1 bg-interactive-primary text-xs text-white hover:bg-interactive-primary/90"
            >
              {saving ? "저장 중..." : "임시저장"}
            </Button>
            <Button
              type="button"
              onClick={stageAction.onClick}
              variant="outline"
              size="sm"
              disabled={!programId || saving || stageAction.disabled}
              title={
                published
                  ? "이미 발행된 프로그램입니다"
                  : status === "PREVIEW"
                    ? "발행하면 모두가 볼 수 있습니다"
                    : "검수를 요청합니다"
              }
              className="flex-1 border-border-default text-xs text-text-primary"
            >
              {stageAction.label}
            </Button>
            <Button
              type="button"
              onClick={() =>
                router.push(`/community/program/new?programId=${programId}`)
              }
              variant="outline"
              size="sm"
              // 미발행 프로그램은 백엔드가 글 연결을 400으로 거부한다 — UI에서 먼저 막는다
              disabled={!programId || !published}
              title={
                published ? "이 프로그램으로 글쓰기" : "발행 후 글을 쓸 수 있습니다"
              }
              className="flex-1 border-border-default text-xs text-text-primary"
            >
              글쓰기
            </Button>
          </div>

          {programId && !published && (
            <p className="text-center text-[11px] leading-relaxed text-text-tertiary">
              {status === "PREVIEW"
                ? "검수 대기 중입니다. 발행 후 글을 쓸 수 있습니다."
                : "검수 요청 → 발행을 마쳐야 다른 사람이 볼 수 있고, 글을 쓸 수 있습니다."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function AddMenuItem({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="block w-full border-b border-border-default px-3 py-2.5 text-left text-sm text-text-primary transition-colors last:border-b-0 hover:bg-surface-2 disabled:opacity-40"
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
                    [k]:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
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
            <Label className="text-[11px] text-text-secondary">
              나레이션 텍스트
            </Label>
            <Textarea
              value={step.text ?? ""}
              onChange={(e) => onChange(index, { text: e.target.value })}
              placeholder="여기 보이는 밝은 별이 직녀성이야!"
              className={`min-h-[70px] ${INPUT_CLS}`}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px] text-text-secondary">
                캐릭터 모션
              </Label>
              <select
                value={step.motion ?? "Idle"}
                onChange={(e) =>
                  onChange(index, { motion: e.target.value as CharacterMotion })
                }
                className={SELECT_CLS}
              >
                {MOTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-text-secondary">
                표시 시간(ms)
              </Label>
              <Input
                type="number"
                value={step.textDuration ?? ""}
                onChange={(e) =>
                  onChange(index, {
                    textDuration:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
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
              selectedStar &&
              onChange(index, { stars: [...stars, selectedStar] })
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
                  onClick={() =>
                    selectedStar && onChange(index, { [k]: selectedStar })
                  }
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
                  timeSpeed:
                    e.target.value === "" ? undefined : Number(e.target.value),
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
                onChange={(e) =>
                  onChange(index, { [key]: triParse(e.target.value) })
                }
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
          <Label className="text-[11px] text-text-secondary">
            대기 시간(ms)
          </Label>
          <Input
            type="number"
            value={step.waitMs ?? ""}
            onChange={(e) =>
              onChange(index, {
                waitMs:
                  e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
            className={INPUT_CLS}
          />
        </div>
      );

    default:
      // 이 타입은 타입별 설정이 없다 — 아래 "별도리 위치"만 지정할 수 있다
      return null;
  }
}
