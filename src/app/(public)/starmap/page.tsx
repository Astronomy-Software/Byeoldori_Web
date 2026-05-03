"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { StellariumControl } from "@/lib/stellarium-control";
import { executeStep } from "@/lib/education-engine";
import { Live2DCharacter } from "@/components/live2d-character";
import { characterManager } from "@/lib/character-manager";
import type { EduLesson, EduStep, ImagePosition } from "@/types/education";

const LESSON_PATHS = [
  "/lessons/orion-101.json",
  "/lessons/ursa-major.json",
  "/lessons/test-playground.json",
];

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

export default function StarMapPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const controlRef = useRef<StellariumControl | null>(null);

  const [stelReady, setStelReady] = useState(false);
  const [eduMode, setEduMode] = useState(false);
  const [lessons, setLessons] = useState<EduLesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<EduLesson | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [charText, setCharText] = useState<string | null>(null);
  const [imageOverlay, setImageOverlay] = useState<ImageOverlay | null>(null);
  const [selectedStar, setSelectedStar] = useState<string | null>(null);

  // 레슨 JSON 로드
  useEffect(() => {
    Promise.all(LESSON_PATHS.map((p) => fetch(p).then((r) => r.json())))
      .then((data) => setLessons(data as EduLesson[]))
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

  // 스텝 실행 — stepIndex or activeLesson 변경 시
  useEffect(() => {
    if (!activeLesson || !controlRef.current) return;
    const step = activeLesson.steps[stepIndex];
    if (!step) return;

    executeStep(step, controlRef.current, {
      onText: (text, motion) => {
        setCharText(text);
        if (motion) characterManager.playMotion(motion);
      },
      onImage: (url, position, width, duration) => {
        setImageOverlay({ url, position: position ?? "top-right", width: width ?? "200px" });
        if (duration && duration > 0) {
          setTimeout(() => setImageOverlay(null), duration);
        }
      },
      onClearOverlays: () => {
        controlRef.current?.clearOverlays();
        setImageOverlay(null);
      },
      onDrawLine: (from, to, color) => {
        controlRef.current?.drawLine(from, to, color);
      },
    });
  }, [activeLesson, stepIndex]);

  const clearAllOverlays = useCallback(() => {
    controlRef.current?.clearOverlays();
    setImageOverlay(null);
  }, []);

  const startLesson = useCallback(
    (lesson: EduLesson) => {
      clearAllOverlays();
      setCharText(null);
      setActiveLesson(lesson);
      setStepIndex(0);
    },
    [clearAllOverlays],
  );

  const nextStep = useCallback(() => {
    if (!activeLesson) return;
    if (stepIndex < activeLesson.steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      setActiveLesson(null);
      setStepIndex(0);
      clearAllOverlays();
      setCharText("수업이 끝났어! 정말 잘했어! 🌟");
      characterManager.playMotion("happy");
    }
  }, [activeLesson, stepIndex, clearAllOverlays]);

  const prevStep = useCallback(() => {
    if (stepIndex > 0) {
      clearAllOverlays();
      setStepIndex((i) => i - 1);
    }
  }, [stepIndex, clearAllOverlays]);

  const exitLesson = useCallback(() => {
    setActiveLesson(null);
    setStepIndex(0);
    setCharText(null);
    clearAllOverlays();
  }, [clearAllOverlays]);

  const jumpToStep = useCallback(
    (idx: number) => {
      clearAllOverlays();
      setStepIndex(idx);
    },
    [clearAllOverlays],
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
        <div className="fixed bottom-[280px] right-[16px] z-50 w-[220px] rounded-2xl border border-white/20 bg-black/85 p-3 shadow-2xl backdrop-blur-sm md:bottom-[340px] md:right-[20px]">
          <p className="text-sm leading-relaxed text-white">{charText}</p>
          <button
            className="mt-2 text-[11px] text-white/40 hover:text-white/80 transition-colors"
            onClick={() => setCharText(null)}
          >
            닫기
          </button>
        </div>
      )}

      {/* Live2D 캐릭터 */}
      <Live2DCharacter />

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
      {!stelReady && (
        <div className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center">
          <span className="text-sm text-white/40">별지도 초기화 중...</span>
        </div>
      )}

      {/* 교육 패널 */}
      {eduMode && (
        <div className="fixed right-0 top-0 z-40 flex h-full w-80 flex-col overflow-hidden border-l border-white/10 bg-gray-950/95 backdrop-blur-sm">
          {!activeLesson ? (
            /* 레슨 선택 */
            <>
              <div className="border-b border-white/10 p-4">
                <h2 className="text-base font-semibold text-white">별자리 수업</h2>
                <p className="mt-0.5 text-xs text-white/40">
                  {stelReady ? "수업을 선택하세요" : "별지도 로딩 중..."}
                </p>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => startLesson(lesson)}
                    disabled={!stelReady}
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left transition-colors hover:bg-white/10 disabled:opacity-40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-white">{lesson.title}</span>
                      <span className={`shrink-0 text-xs ${DIFF_COLOR[lesson.difficulty]}`}>
                        {DIFF_LABEL[lesson.difficulty]}
                      </span>
                    </div>
                    {lesson.subtitle && (
                      <p className="mt-1 text-xs text-white/50">{lesson.subtitle}</p>
                    )}
                    <p className="mt-1 text-xs text-white/30">{lesson.steps.length}단계</p>
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* 진행 중 레슨 패널 */
            <>
              <div className="border-b border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white">{activeLesson.title}</h2>
                  <button
                    onClick={exitLesson}
                    className="text-xs text-white/40 transition-colors hover:text-white"
                  >
                    닫기
                  </button>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-indigo-400 transition-all duration-300"
                    style={{
                      width: `${((stepIndex + 1) / activeLesson.steps.length) * 100}%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-white/40">
                  {stepIndex + 1} / {activeLesson.steps.length}
                </p>
              </div>

              {/* 스텝 목록 */}
              <div className="flex-1 space-y-0.5 overflow-y-auto p-2">
                {activeLesson.steps.map((step, idx) => (
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
                  {stepIndex === activeLesson.steps.length - 1 ? "완료 ✓" : "다음 →"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
