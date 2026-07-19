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

export interface EduStep {
  id?: string;
  type:
    | "camera-move"
    | "highlight-stars"
    | "draw-line"
    | "show-text"
    | "show-image"
    | "clear-overlays"
    | "wait"
    | "composite";

  // camera-move
  target?: string;
  duration?: number;

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
