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
    | "composite"
    | "sky-image"
    | "quiz";

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

  // sky-image — 하늘(적도좌표)에 고정되는 이미지. imageUrl 을 함께 쓴다.
  // 별지도를 돌려도 그 자리에 붙어 있다(스텔라리움 photo 오브젝트). 단위는 度.
  ra?: number;
  dec?: number;
  sizeDeg?: number; // 이미지 가로폭이 하늘에서 차지하는 각도
  rotation?: number; // 시계 반대 방향 회전

  // quiz — 사지선다형 등 객관식. 채점은 서버가 저장된 answerIndex 로 다시 한다.
  question?: string;
  choices?: string[];
  answerIndex?: number;
  explanation?: string;

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
