import type {
  EduStep,
  CharacterMotion,
  CharacterPosition,
  ImagePosition,
} from "@/types/education";
import type { StellariumControl } from "@/lib/stellarium-control";

export interface StepCallbacks {
  onText: (text: string, motion: CharacterMotion | undefined, duration: number | undefined) => void;
  onImage: (url: string, position: ImagePosition | undefined, width: string | undefined, duration: number | undefined) => void;
  onClearOverlays: () => void;
  // 선 긋기 성공 여부를 돌려주면(false) 실행기가 onStepWarning으로 알린다.
  onDrawLine: (
    from: string,
    to: string,
    color: [number, number, number, number],
  ) => boolean | void;
  onCharacterPosition?: (pos: CharacterPosition) => void;
  // quiz 스텝 — 재생 화면이 문제 카드를 띄운다. 실행기는 응답을 기다리지 않는다
  // (관람자가 "다음"을 누를 때까지 스텝이 머무르므로).
  onQuiz?: (step: EduStep) => void;
  // 스텝이 조용히 실패했을 때(별 이름 오타 등) 저작자에게 알리기 위한 경고 채널
  onStepWarning?: (message: string) => void;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function executeStep(
  step: EduStep,
  control: StellariumControl,
  cb: StepCallbacks,
): Promise<void> {
  // 캐릭터 위치는 스텝 타입과 무관한 공통 지시다 — 카메라가 움직이는 동안에도
  // 별도리가 설명 대상을 가리면 안 되므로 switch 진입 전에 먼저 반영한다.
  if (step.characterPosition) {
    cb.onCharacterPosition?.(step.characterPosition);
  }

  switch (step.type) {
    case "camera-move": {
      if (!step.target) break;
      const ok = control.gotoStar(step.target, step.duration ?? 2.0);
      if (!ok) cb.onStepWarning?.(`별을 찾지 못했습니다: ${step.target}`);
      await delay((step.duration ?? 2.0) * 1000 + 300);
      break;
    }

    case "look-at": {
      if (step.az === undefined || step.alt === undefined) break;
      control.lookAt({ az: step.az, alt: step.alt, fov: step.fov });
      if (step.duration && step.duration > 0) {
        await delay(step.duration * 1000);
      }
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
      const drawn = cb.onDrawLine(
        step.from,
        step.to,
        step.lineColor ?? [1, 0.3, 0.3, 0.9],
      );
      if (drawn === false) {
        cb.onStepWarning?.(`선을 긋지 못했습니다: ${step.from} → ${step.to}`);
      }
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

    case "set-time": {
      if (step.time) {
        const d = new Date(step.time);
        if (!Number.isNaN(d.getTime())) control.setTime(d);
      }
      if (step.timeSpeed !== undefined) control.setTimeSpeed(step.timeSpeed);
      break;
    }

    case "toggle-constellation": {
      control.toggleConstellations({
        lines: step.constellationLines,
        labels: step.constellationLabels,
        images: step.constellationImages,
      });
      break;
    }

    case "clear-overlays": {
      cb.onClearOverlays();
      break;
    }

    case "sky-image": {
      if (!step.imageUrl || step.ra === undefined || step.dec === undefined) {
        cb.onStepWarning?.("하늘 이미지: 이미지와 위치(적경·적위)를 지정해주세요.");
        break;
      }
      const ok = await control.addSkyImage({
        url: step.imageUrl,
        ra: step.ra,
        dec: step.dec,
        sizeDeg: step.sizeDeg ?? 10,
        rotation: step.rotation,
      });
      if (!ok) cb.onStepWarning?.("하늘 이미지를 불러오지 못했습니다(JPG/PNG만 지원).");
      break;
    }

    case "quiz": {
      cb.onQuiz?.(step);
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
