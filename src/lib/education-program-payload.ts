import type {
  CreateProgramRequest,
  ProgramDifficulty,
} from "./api/education-program";
import type { EduStep } from "@/types/education";

// 저작 화면의 저장 본문. 서버 PATCH는 빠진 필드를 "바꾸지 않음"으로 보므로,
// 수정할 때는 부제를 항상(빈 문자열이라도) 보내야 지운 부제가 실제로 지워진다.
export function buildProgramSavePayload(
  input: {
    title: string;
    subtitle: string;
    difficulty: ProgramDifficulty;
    steps: EduStep[];
  },
  mode: "create" | "update",
): CreateProgramRequest {
  const subtitle = input.subtitle.trim();
  return {
    title: input.title.trim(),
    subtitle: mode === "update" ? subtitle : subtitle || undefined,
    difficulty: input.difficulty,
    steps: input.steps,
  };
}
