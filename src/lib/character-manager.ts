// 싱글턴 캐릭터 매니저 — Live2DCharacter 컴포넌트와 교육 엔진을 연결

type MotionFn = (motionName: string) => void;

// byeoldori.model3.json의 실제 모션 그룹명(대문자). model.motion()은 정확일치라
// 스키마의 소문자/별칭을 여기서 표준 그룹명으로 정규화해야 재생된다.
const MOTION_GROUPS = [
  "Idle",
  "Happy",
  "Angry",
  "Crying",
  "Her",
  "Appearance",
  "Exit",
] as const;

// 콘텐츠·스키마 하위호환 별칭 → 표준 그룹명
const MOTION_ALIASES: Record<string, string> = {
  standing: "Idle", // 'standing'은 실존 그룹 아님 → 중립(Idle)
  neutral: "Idle",
};

function normalizeMotion(name: string): string {
  const key = (name ?? "").trim().toLowerCase();
  if (!key) return "Idle";
  if (MOTION_ALIASES[key]) return MOTION_ALIASES[key];
  const match = MOTION_GROUPS.find((g) => g.toLowerCase() === key);
  return match ?? "Idle"; // 알 수 없는 모션은 중립으로 폴백
}

class CharacterManagerSingleton {
  private motionFn: MotionFn | null = null;

  /** Live2DCharacter 컴포넌트에서 모델 로드 후 등록 */
  register(fn: MotionFn): void {
    this.motionFn = fn;
  }

  /** 컴포넌트 언마운트 시 해제 */
  unregister(): void {
    this.motionFn = null;
  }

  /** 모션 재생 — 그룹명 대소문자/별칭을 표준화 후 재생 (등록된 경우에만) */
  playMotion(name: string): void {
    this.motionFn?.(normalizeMotion(name));
  }
}

export const characterManager = new CharacterManagerSingleton();
