export type CharacterMotion = "Idle" | "happy" | "angry" | "crying" | "standing";
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

export interface EduLesson {
  id: string;
  title: string;
  subtitle?: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  steps: EduStep[];
}
