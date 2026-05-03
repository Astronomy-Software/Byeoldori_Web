import type { EduStep, CharacterMotion, ImagePosition } from "@/types/education";
import type { StellariumControl } from "@/lib/stellarium-control";

export interface StepCallbacks {
  onText: (text: string, motion: CharacterMotion | undefined, duration: number | undefined) => void;
  onImage: (url: string, position: ImagePosition | undefined, width: string | undefined, duration: number | undefined) => void;
  onClearOverlays: () => void;
  onDrawLine: (from: string, to: string, color: [number, number, number, number]) => void;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function executeStep(
  step: EduStep,
  control: StellariumControl,
  cb: StepCallbacks,
): Promise<void> {
  switch (step.type) {
    case "camera-move": {
      if (!step.target) break;
      control.gotoStar(step.target, step.duration ?? 2.0);
      await delay((step.duration ?? 2.0) * 1000 + 300);
      break;
    }

    case "highlight-stars": {
      if (!step.stars?.length) break;
      control.highlightStars(
        step.stars,
        step.color ?? [1, 0.2, 0.2, 1],
      );
      break;
    }

    case "draw-line": {
      if (!step.from || !step.to) break;
      cb.onDrawLine(step.from, step.to, step.lineColor ?? [1, 0.3, 0.3, 0.9]);
      break;
    }

    case "show-text": {
      cb.onText(step.text ?? "", step.motion, step.textDuration);
      if (step.textDuration && step.textDuration > 0) {
        await delay(step.textDuration);
      }
      break;
    }

    case "show-image": {
      if (!step.imageUrl) break;
      cb.onImage(step.imageUrl, step.imagePosition, step.imageWidth, step.imageDuration);
      if (step.imageDuration && step.imageDuration > 0) {
        await delay(step.imageDuration);
      }
      break;
    }

    case "clear-overlays": {
      cb.onClearOverlays();
      break;
    }

    case "wait": {
      if (step.waitMs && step.waitMs > 0) {
        await delay(step.waitMs);
      }
      break;
    }

    case "composite": {
      if (!step.steps?.length) break;
      await Promise.all(step.steps.map((s) => executeStep(s, control, cb)));
      break;
    }
  }
}
