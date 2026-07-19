// 표준 모션 그룹명(byeoldori.model3.json). 런타임은 characterManager가 대소문자·별칭을
// 정규화하므로 아래 legacy 별칭(소문자/standing)도 계속 동작한다.
export type CharacterMotion =
  // 표준 그룹 (신규 저작 권장)
  | "Idle"
  | "Happy"
  | "Angry"
  | "Crying"
  | "Her"
  | "Appearance"
  | "Exit"
  // legacy 별칭 (기존 콘텐츠 하위호환)
  | "happy"
  | "angry"
  | "crying"
  | "standing";
export type ImagePosition =
  | "top-left" | "top-center" | "top-right"
  | "bottom-left" | "bottom-center" | "bottom-right"
  | "center-left" | "center-right";

// 별도리(Live2D) 캐릭터의 화면상 위치. 설명 대상을 가리지 않도록 스텝별로 지정한다.
// 미지정(undefined) 시 직전 스텝의 위치가 유지되며, 프로그램 시작 시 기본값은 "bottom-right".
export type CharacterPosition =
  | "bottom-right"
  | "bottom-left"
  | "bottom-center"
  | "hidden";

export interface EduStep {
  id?: string;

  // 모든 스텝 타입 공통 — 이 스텝이 실행될 때 별도리를 옮긴다(카메라 이동 중에도 비켜야 하므로).
  characterPosition?: CharacterPosition;

  type:
    | "camera-move"
    | "look-at"
    | "highlight-stars"
    | "draw-line"
    | "show-text"
    | "show-image"
    | "set-time"
    | "toggle-constellation"
    | "clear-overlays"
    | "wait"
    | "composite";

  // camera-move
  target?: string;
  duration?: number;

  // look-at (감독모드에서 캡처한 임의 시점. 度 단위)
  az?: number;
  alt?: number;
  fov?: number;

  // highlight-stars
  stars?: string[];
  color?: [number, number, number, number];

  // draw-line
  from?: string;
  to?: string;
  lineColor?: [number, number, number, number];

  // show-text
  text?: string;
  motion?: CharacterMotion;
  textDuration?: number;

  // show-image
  imageUrl?: string;
  imagePosition?: ImagePosition;
  imageWidth?: string;
  imageDuration?: number;

  // set-time (ISO 문자열 또는 "sunset"/"night" 등 프리셋. speed=시간흐름 배속)
  time?: string;
  timeSpeed?: number;

  // toggle-constellation
  constellationLines?: boolean;
  constellationLabels?: boolean;
  constellationImages?: boolean;

  // wait
  waitMs?: number;

  // composite
  steps?: EduStep[];
}

export interface EducationProgram {
  id: string;
  title: string;
  subtitle?: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  steps: EduStep[];
}
