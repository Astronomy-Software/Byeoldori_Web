"use client";

import { useEffect, useRef } from "react";

/** Cubism 4 코어 SDK를 CDN에서 동적으로 로드 (중복 로드 방지) */
function loadCubism4Core(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && (window as any).Live2DCubismCore) {
      resolve();
      return;
    }
    const existing = document.querySelector(
      'script[src*="live2dcubismcore"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Cubism4 코어 로드 실패"));
    document.head.appendChild(script);
  });
}

export function Live2DCharacter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let app: import("pixi.js").Application | null = null;
    let cancelled = false;

    (async () => {
      try {
        // 1. Cubism 4 코어를 먼저 로드 (전역 Live2DCubismCore 설정)
        await loadCubism4Core();
        if (cancelled) return;

        // 2. 코어 로드 후에 pixi-live2d-display/cubism4 import
        const PIXI = await import("pixi.js");
        const { Live2DModel } = await import("pixi-live2d-display/cubism4");
        if (cancelled) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Live2DModel.registerTicker(PIXI.Ticker as any);

        const canvas = canvasRef.current;
        if (!canvas) return;

        app = new PIXI.Application({
          view: canvas,
          backgroundAlpha: 0,
          width: canvas.offsetWidth,
          height: canvas.offsetHeight,
          antialias: true,
        });

        // PIXI v7 + pixi-live2d-display v0.4 호환성:
        // 스테이지에서 pointer hit-testing을 완전히 끈다.
        // autoInteract:false만으로는 PIXI 이벤트 시스템이 여전히 동작해
        // "t.isInteractive is not a function" 에러 발생.
        app.stage.eventMode = "none";
        app.stage.interactiveChildren = false;

        const model = await Live2DModel.from(
          "/live2d/byeoldori/byeoldori.model3.json",
          { autoInteract: false },
        );
        if (cancelled) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        app.stage.addChild(model as any);

        const scale = canvas.offsetHeight / model.height;
        model.scale.set(scale * 0.9);
        model.anchor.set(0.5, 1);
        model.position.set(canvas.offsetWidth / 2, canvas.offsetHeight);

        model.motion("Idle");
      } catch (e) {
        console.warn("Live2D 초기화 실패:", e);
      }
    })();

    return () => {
      cancelled = true;
      app?.destroy(false);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed bottom-16 right-0 z-40 h-64 w-48 md:bottom-0 md:h-80 md:w-64"
    />
  );
}
