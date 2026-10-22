import type { EduStep } from "@/types/education";

// 별지도(/starmap) 교육 패널의 스텝 목록에 보여 줄 이름. 시청자에게 영문 타입명이 보이지 않게 한다.
export function viewerStepLabel(step: EduStep): string {
  switch (step.type) {
    case "camera-move": return `📷 ${step.target ?? "이동"}`;
    case "look-at": return `📷 시점 이동`;
    case "highlight-stars": return `✦ 별 강조 (${step.stars?.length ?? 0}개)`;
    case "draw-line": return `— ${step.from} → ${step.to}`;
    case "show-text": return `💬 ${step.text ? step.text.slice(0, 22) + "…" : "텍스트"}`;
    case "show-image": return `🖼 이미지`;
    case "set-time": return `🕐 시간 설정`;
    case "toggle-constellation": return `✨ 별자리 표시`;
    case "clear-overlays": return `○ 오버레이 초기화`;
    case "wait": return `⏸ 대기 ${step.waitMs ?? 0}ms`;
    case "composite": return `◈ 복합 (${step.steps?.length ?? 0}개)`;
    case "sky-image": return `🌌 하늘 이미지`;
    case "quiz": return `❓ ${step.question ? step.question.slice(0, 20) + "…" : "퀴즈"}`;
    default: return step.type;
  }
}
