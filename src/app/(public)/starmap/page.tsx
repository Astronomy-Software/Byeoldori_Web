"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { StellariumControl } from "@/lib/stellarium-control";
import { executeStep } from "@/lib/education-engine";
import { loadProgramById } from "@/lib/education-program-loader";
import {
  listPrograms,
  incrementProgramView,
  type ProgramSummary,
} from "@/lib/api/education-program";
import { ApiError } from "@/lib/api/client";
import { Live2DCharacter } from "@/components/live2d-character";
import { characterManager } from "@/lib/character-manager";
import { speak, cancelNarration, warmupVoices } from "@/lib/narration";
import { toast } from "sonner";
import type {
  CharacterPosition,
  EducationProgram,
  EduStep,
  ImagePosition,
} from "@/types/education";

// 별도리 캐릭터 위치. "hidden"은 렌더 자체를 생략하므로 맵에 없다.
// bottom-right 값은 Live2DCharacter의 기본 className과 동일해야 하위호환이 유지된다.
const CHARACTER_BASE = "pointer-events-none fixed z-40 h-64 w-48 md:h-80 md:w-64";
const CHARACTER_POS: Record<Exclude<CharacterPosition, "hidden">, string> = {
  "bottom-right": "bottom-16 right-0 md:bottom-0",
  "bottom-left": "bottom-16 left-0 md:bottom-0",
  "bottom-center": "bottom-16 left-1/2 -translate-x-1/2 md:bottom-0",
};

// 말풍선은 캐릭터 머리 위에 붙어야 하므로 같은 축을 따라간다.
const BUBBLE_POS: Record<CharacterPosition, string> = {
  "bottom-right": "bottom-[280px] right-[16px] md:bottom-[340px] md:right-[20px]",
  "bottom-left": "bottom-[280px] left-[16px] md:bottom-[340px] md:left-[20px]",
  "bottom-center":
    "bottom-[280px] left-1/2 -translate-x-1/2 md:bottom-[340px]",
  // 캐릭터가 숨겨져도 자막은 읽혀야 한다 — 화면 하단 중앙에 남긴다.
  hidden: "bottom-6 left-1/2 -translate-x-1/2",
};

const IMAGE_POS: Record<ImagePosition, string> = {
  "top-left": "top-4 left-4",
  "top-center": "top-4 left-1/2 -translate-x-1/2",
  "top-right": "top-4 right-4",
  "bottom-left": "bottom-36 left-4",
  "bottom-center": "bottom-36 left-1/2 -translate-x-1/2",
  "bottom-right": "bottom-36 right-4",
  "center-left": "top-1/2 -translate-y-1/2 left-4",
  "center-right": "top-1/2 -translate-y-1/2 right-4",
};

const DIFF_LABEL: Record<string, string> = {
  BEGINNER: "입문",
  INTERMEDIATE: "중급",
  ADVANCED: "고급",
};

const DIFF_COLOR: Record<string, string> = {
  BEGINNER: "text-green-400",
  INTERMEDIATE: "text-yellow-400",
  ADVANCED: "text-red-400",
};

function stepLabel(step: EduStep): string {
  switch (step.type) {
    case "camera-move": return `📷 ${step.target ?? "이동"}`;
    case "highlight-stars": return `✦ 별 강조 (${step.stars?.length ?? 0}개)`;
    case "draw-line": return `— ${step.from} → ${step.to}`;
    case "show-text": return `💬 ${step.text ? step.text.slice(0, 22) + "…" : "텍스트"}`;
    case "show-image": return `🖼 이미지`;
    case "clear-overlays": return `○ 오버레이 초기화`;
    case "wait": return `⏸ 대기 ${step.waitMs ?? 0}ms`;
    case "composite": return `◈ 복합 (${step.steps?.length ?? 0}개)`;
    default: return step.type;
  }
}

type ImageOverlay = { url: string; position: ImagePosition; width: string };

// 프로그램 로드 실패를 사용자에게 설명 가능한 문구로 바꾼다.
// 403은 아직 PUBLISHED 가 아닌 프로그램(작성자 외 접근 불가)이 대부분이다.
function programErrorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 403) return "아직 발행되지 않은 프로그램입니다.";
    if (e.status === 404) return "프로그램을 찾을 수 없습니다.";
  }
  return "프로그램을 불러오지 못했습니다.";
}

function StarMapInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const controlRef = useRef<StellariumControl | null>(null);
  const closingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [stelReady, setStelReady] = useState(false);
  const [eduMode, setEduMode] = useState(false);
  const [programs, setPrograms] = useState<ProgramSummary[]>([]);
  const [activeProgram, setActiveProgram] = useState<EducationProgram | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [charText, setCharText] = useState<string | null>(null);
  const [imageOverlay, setImageOverlay] = useState<ImageOverlay | null>(null);
  const [selectedStar, setSelectedStar] = useState<string | null>(null);
  const [loadingProgram, setLoadingProgram] = useState(false);
  const [programError, setProgramError] = useState<string | null>(null);
  const [characterPosition, setCharacterPosition] =
    useState<CharacterPosition>("bottom-right");

  // 교육 프로그램(MongoDB) 공개 목록 로드
  useEffect(() => {
    listPrograms({ size: 20 })
      .then((r) => setPrograms(r.content))
      .catch(console.error);
  }, []);

  // Stellarium 컨트롤 초기화
  useEffect(() => {
    if (!iframeRef.current) return;
    const ctrl = new StellariumControl(iframeRef.current);
    controlRef.current = ctrl;

    ctrl.waitForReady(60000).then((ready) => {
      if (!ready) { console.warn("[StarMap] Stellarium 준비 타임아웃"); return; }
      setStelReady(true);
      ctrl.onStarSelected((name) => setSelectedStar(name));
    });
  }, []);

  // iframe→parent postMessage 리스너
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "BYEOLDORI_STAR_SELECTED") {
        setSelectedStar(e.data.name || null);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const clearAllOverlays = useCallback(() => {
    controlRef.current?.clearOverlays();
    setImageOverlay(null);
  }, []);

  const startProgram = useCallback(
    async (program: EducationProgram) => {
      warmupVoices(); // 사용자 제스처 시점에 음성 목록 로드
      clearAllOverlays();
      setCharText(null);
      setProgramError(null);
      setCharacterPosition("bottom-right"); // 프로그램마다 기본 위치에서 시작
      // 별 카탈로그가 아직 로드 중이면 getObj가 null을 반환해 카메라 이동·별 강조가
      // 조용히 실패한다. 첫 스텝 실행 전에 조회 가능해질 때까지 기다린다.
      await controlRef.current?.waitForCatalog();
      setActiveProgram(program);
      setStepIndex(0);
      setEduMode(true);
    },
    [clearAllOverlays],
  );

  // ?programId= 쿼리 처리 — stelReady 후 자동 실행
  useEffect(() => {
    const programId = searchParams.get("programId");
    if (!programId || !stelReady) return;

    setLoadingProgram(true);
    setProgramError(null);
    loadProgramById(programId)
      .then(async (program) => {
        await startProgram(program);
        incrementProgramView(programId).catch(() => {});
      })
      .catch((e) => {
        console.error("[StarMap] 프로그램 로드 실패:", e);
        const msg = programErrorMessage(e);
        setProgramError(msg);
        toast.error(msg);
        setEduMode(true); // 오류를 볼 수 있도록 교육 패널을 열어둔다
      })
      .finally(() => setLoadingProgram(false));
  // stelReady가 true로 바뀔 때 한 번만 실행
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stelReady]);

  // 스텝 실행
  useEffect(() => {
    if (!activeProgram || !controlRef.current) return;
    const step = activeProgram.steps[stepIndex];
    if (!step) return;

    // 스텝이 바뀌면 이전 스텝의 잔재(자막 숨김 타이머·재생 중 나레이션)를 반드시 걷어낸다.
    // 없으면 이전 타이머가 새 스텝의 자막을 지우고, 화면을 떠나도 TTS가 계속 재생된다.
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    executeStep(step, controlRef.current, {
      onText: (text, motion, duration) => {
        if (cancelled) return;
        setCharText(text);
        speak(text); // 자막 + 음성 나레이션(ko-KR)
        if (motion) characterManager.playMotion(motion);
        if (duration && duration > 0) {
          timers.push(
            setTimeout(() => {
              if (!cancelled) setCharText(null);
            }, duration),
          );
        }
      },
      onImage: (url, position, width, duration) => {
        if (cancelled) return;
        setImageOverlay({ url, position: position ?? "top-right", width: width ?? "200px" });
        if (duration && duration > 0) {
          timers.push(
            setTimeout(() => {
              if (!cancelled) setImageOverlay(null);
            }, duration),
          );
        }
      },
      onClearOverlays: () => {
        if (cancelled) return;
        controlRef.current?.clearOverlays();
        setImageOverlay(null);
      },
      onDrawLine: (from, to, color) => {
        if (cancelled) return false;
        return controlRef.current?.drawLine(from, to, color) ?? false;
      },
      onCharacterPosition: (pos) => {
        if (!cancelled) setCharacterPosition(pos);
      },
      // 재생 화면에서는 경고를 콘솔에만 남긴다(관람자에게 저작 오류를 노출하지 않는다)
      onStepWarning: (message) => console.warn("[StarMap]", message),
    }).catch((e) => console.error("[StarMap] 스텝 실행 실패:", e));

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      cancelNarration();
    };
  }, [activeProgram, stepIndex]);

  // 페이지를 떠날 때 나레이션이 남아 다른 화면에서 계속 말하는 것을 막는다
  useEffect(
    () => () => {
      if (closingTimerRef.current) clearTimeout(closingTimerRef.current);
      cancelNarration();
    },
    [],
  );

  const nextStep = useCallback(() => {
    if (!activeProgram) return;
    if (stepIndex < activeProgram.steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      setActiveProgram(null);
      setStepIndex(0);
      clearAllOverlays();
      // 마지막 스텝이 캐릭터를 숨겼을 수 있으므로 마무리 인사 전에 되돌린다
      setCharacterPosition("bottom-right");
      const closing = "수업이 끝났어! 정말 잘했어! 🌟";
      setCharText(closing);
      // activeProgram이 null이 되면서 스텝 effect의 cleanup(cancelNarration)이 곧 실행된다.
      // 마무리 인사가 그 취소에 휩쓸리지 않도록 다음 틱으로 미룬다.
      closingTimerRef.current = setTimeout(() => speak(closing), 0);
      characterManager.playMotion("happy");
      // programId 쿼리 파라미터 제거
      router.replace("/starmap");
    }
  }, [activeProgram, stepIndex, clearAllOverlays, router]);

  const prevStep = useCallback(() => {
    if (stepIndex > 0) {
      clearAllOverlays();
      setStepIndex((i) => i - 1);
    }
  }, [stepIndex, clearAllOverlays]);

  const exitProgram = useCallback(() => {
    cancelNarration();
    setActiveProgram(null);
    setStepIndex(0);
    setCharText(null);
    setCharacterPosition("bottom-right");
    clearAllOverlays();
    router.replace("/starmap");
  }, [clearAllOverlays, router]);

  const jumpToStep = useCallback(
    (idx: number) => {
      // 같은 스텝을 다시 누르면 오버레이만 지워지고 재실행은 일어나지 않는다
      // (effect 의존성이 그대로라서). 그러면 화면이 영구히 빈 채로 남는다.
      if (idx === stepIndex) return;
      clearAllOverlays();
      setStepIndex(idx);
    },
    [stepIndex, clearAllOverlays],
  );

  const handleProgramSelect = useCallback(
    async (summary: ProgramSummary) => {
      if (!stelReady) return;
      setLoadingProgram(true);
      setProgramError(null);
      try {
        const program = await loadProgramById(summary.id);
        await startProgram(program);
        incrementProgramView(summary.id).catch(() => {});
      } catch (e) {
        console.error("[StarMap] 프로그램 로드 실패:", e);
        const msg = programErrorMessage(e);
        setProgramError(msg);
        toast.error(msg);
      } finally {
        setLoadingProgram(false);
      }
    },
    [stelReady, startProgram],
  );

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* Stellarium iframe */}
      <iframe
        ref={iframeRef}
        src="/stellarium/index.html"
        className={`absolute left-0 top-0 h-full border-0 transition-[width] duration-300 ${
          eduMode ? "w-[calc(100%-320px)]" : "w-full"
        }`}
        allow="gyroscope; accelerometer"
        title="Stellarium 별지도"
      />

      {/* 이미지 오버레이 */}
      {imageOverlay && (
        <div
          className={`absolute z-30 ${IMAGE_POS[imageOverlay.position]}`}
          style={{ width: imageOverlay.width }}
        >
          <img
            src={imageOverlay.url}
            alt="교육 이미지"
            className="rounded-xl shadow-2xl border border-white/20"
          />
        </div>
      )}

      {/* 캐릭터 말풍선 */}
      {charText && (
        <div
          className={`fixed z-50 w-[220px] rounded-2xl border border-white/20 bg-black/85 p-3 shadow-2xl backdrop-blur-sm ${BUBBLE_POS[characterPosition]}`}
        >
          <p className="text-sm leading-relaxed text-white">{charText}</p>
          <button
            className="mt-2 text-[11px] text-white/40 hover:text-white/80 transition-colors"
            onClick={() => setCharText(null)}
          >
            닫기
          </button>
        </div>
      )}

      {/* Live2D 캐릭터 — 스텝이 지정한 위치로 이동, "hidden"이면 렌더 생략 */}
      {characterPosition !== "hidden" && (
        <Live2DCharacter
          className={`${CHARACTER_BASE} ${CHARACTER_POS[characterPosition]}`}
        />
      )}

      {/* 교육 모드 토글 */}
      <button
        className="fixed bottom-4 left-4 z-50 rounded-full bg-indigo-600/90 px-4 py-2 text-sm text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-indigo-500"
        onClick={() => setEduMode((v) => !v)}
      >
        {eduMode ? "✕ 교육 모드 닫기" : "★ 교육 모드"}
      </button>

      {/* 선택된 별 배지 */}
      {selectedStar && (
        <div className="fixed top-4 left-1/2 z-40 -translate-x-1/2 rounded-full border border-white/20 bg-black/70 px-4 py-1.5 text-sm text-white backdrop-blur-sm">
          ✦ {selectedStar}
        </div>
      )}

      {/* 로딩 표시 */}
      {(!stelReady || loadingProgram) && (
        <div className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center">
          <span className="text-sm text-white/40">
            {loadingProgram ? "교육 프로그램 로딩 중..." : "별지도 초기화 중..."}
          </span>
        </div>
      )}

      {/* 교육 패널 */}
      {eduMode && (
        <div className="fixed right-0 top-0 z-40 flex h-full w-80 flex-col overflow-hidden border-l border-white/10 bg-gray-950/95 backdrop-blur-sm">
          {!activeProgram ? (
            /* 프로그램 선택 */
            <>
              <div className="border-b border-white/10 p-4">
                <h2 className="text-base font-semibold text-white">교육 프로그램</h2>
                <p className="mt-0.5 text-xs text-white/40">
                  {stelReady ? "프로그램을 선택하세요" : "별지도 로딩 중..."}
                </p>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {programError && (
                  <div className="rounded-xl border border-red-400/40 bg-red-500/10 p-3">
                    <p className="text-xs leading-relaxed text-red-300">
                      {programError}
                    </p>
                    <button
                      onClick={() => setProgramError(null)}
                      className="mt-2 text-[11px] text-white/40 transition-colors hover:text-white/80"
                    >
                      닫기
                    </button>
                  </div>
                )}
                {programs.length === 0 && (
                  <p className="text-center text-xs text-white/30 pt-8">등록된 교육 프로그램이 없습니다.</p>
                )}
                {programs.map((prog) => (
                  <button
                    key={prog.id}
                    onClick={() => handleProgramSelect(prog)}
                    disabled={!stelReady || loadingProgram}
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left transition-colors hover:bg-white/10 disabled:opacity-40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-white">{prog.title}</span>
                      {prog.difficulty && (
                        <span className={`shrink-0 text-xs ${DIFF_COLOR[prog.difficulty]}`}>
                          {DIFF_LABEL[prog.difficulty]}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-white/40">
                      {prog.authorName ?? "별도리"} · 조회 {prog.viewCount}
                    </p>
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* 진행 중 프로그램 패널 */
            <>
              <div className="border-b border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white">{activeProgram.title}</h2>
                  <button
                    onClick={exitProgram}
                    className="text-xs text-white/40 transition-colors hover:text-white"
                  >
                    닫기
                  </button>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-indigo-400 transition-all duration-300"
                    style={{
                      width: `${((stepIndex + 1) / activeProgram.steps.length) * 100}%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-white/40">
                  {stepIndex + 1} / {activeProgram.steps.length}
                </p>
              </div>

              {/* 스텝 목록 */}
              <div className="flex-1 space-y-0.5 overflow-y-auto p-2">
                {activeProgram.steps.map((step, idx) => (
                  <button
                    key={idx}
                    onClick={() => jumpToStep(idx)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                      idx === stepIndex
                        ? "border border-indigo-400/40 bg-indigo-600/50 text-white"
                        : idx < stepIndex
                        ? "text-white/30 hover:bg-white/5"
                        : "text-white/60 hover:bg-white/5"
                    }`}
                  >
                    <span className="mr-1.5 opacity-50">{idx + 1}.</span>
                    {stepLabel(step)}
                  </button>
                ))}
              </div>

              {/* 이전/다음 버튼 */}
              <div className="flex gap-2 border-t border-white/10 p-3">
                <button
                  onClick={prevStep}
                  disabled={stepIndex === 0}
                  className="flex-1 rounded-lg bg-white/10 py-2 text-sm text-white transition-colors hover:bg-white/20 disabled:opacity-30"
                >
                  ← 이전
                </button>
                <button
                  onClick={nextStep}
                  className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm text-white transition-colors hover:bg-indigo-500"
                >
                  {stepIndex === activeProgram.steps.length - 1 ? "완료 ✓" : "다음 →"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function StarMapPage() {
  return (
    <Suspense>
      <StarMapInner />
    </Suspense>
  );
}
