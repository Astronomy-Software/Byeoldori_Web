"use client";

import { useEffect, useRef } from "react";
import { characterManager } from "@/lib/character-manager";

function loadCubism4Core(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && (window as any).Live2DCubismCore) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[src*="live2dcubismcore"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Cubism4 코어 로드 실패"));
    document.head.appendChild(script);
  });
}

export function Live2DCharacter({
  className,
  scale = 0.9,
}: {
  className?: string;
  scale?: number;
} = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let app: import("pixi.js").Application | null = null;
    let cancelled = false;

    (async () => {
      try {
        await loadCubism4Core();
        if (cancelled) return;

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

        app.stage.eventMode = "none";
        app.stage.interactiveChildren = false;

        const model = await Live2DModel.from(
          "/live2d/byeoldori/byeoldori.model3.json",
          { autoInteract: false },
        );
        if (cancelled) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        app.stage.addChild(model as any);

        const fitScale = canvas.offsetHeight / model.height;
        model.scale.set(fitScale * scale);
        model.anchor.set(0.5, 1);
        model.position.set(canvas.offsetWidth / 2, canvas.offsetHeight);

        model.motion("Idle");

        // characterManager에 모션 제어 함수 등록
        characterManager.register((motionName: string) => {
          try {
            model.motion(motionName);
          } catch (e) {
            console.warn("[Live2D] 모션 재생 실패:", motionName, e);
          }
        });
      } catch (e) {
        console.warn("Live2D 초기화 실패:", e);
      }
    })();

    return () => {
      cancelled = true;
      characterManager.unregister();
      app?.destroy(false);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={
        className ??
        "pointer-events-none fixed bottom-16 right-0 z-40 h-64 w-48 md:bottom-0 md:h-80 md:w-64"
      }
    />
  );
}
