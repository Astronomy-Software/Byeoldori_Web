// 싱글턴 캐릭터 매니저 — Live2DCharacter 컴포넌트와 교육 엔진을 연결

type MotionFn = (motionName: string) => void;

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

  /** 모션 재생 (등록된 경우에만 동작) */
  playMotion(name: string): void {
    this.motionFn?.(name);
  }
}

export const characterManager = new CharacterManagerSingleton();
