import type { EducationProgram, EduStep } from "@/types/education";
import { getProgram, type ProgramDetail } from "@/lib/api/education-program";

async function prefetchImages(steps: EduStep[]): Promise<void> {
  for (const step of steps) {
    if (step.type === "show-image" && step.imageUrl?.startsWith("http")) {
      try {
        const res = await fetch(step.imageUrl);
        // res.ok 검사가 없으면 404 HTML 본문이 blob URL이 되어 "깨진 이미지"로 뜬다.
        // 실패 응답(404 등)은 원본 URL을 그대로 두고 넘어간다.
        if (res.ok) {
          step.imageUrl = URL.createObjectURL(await res.blob());
        }
      } catch {
        // 이미지 프리패치 실패 시 원본 URL 유지
      }
    }
    if (step.type === "composite" && step.steps) {
      await prefetchImages(step.steps);
    }
  }
}

export async function loadEducationProgram(
  contentUrl: string,
): Promise<EducationProgram> {
  const program: EducationProgram = await fetch(contentUrl).then((r) =>
    r.json(),
  );
  await prefetchImages(program.steps);
  return program;
}

/** ProgramDetail(백엔드 응답) → 재생용 EducationProgram (이미지 프리패치 포함). */
export function detailToProgram(detail: ProgramDetail): EducationProgram {
  return {
    id: detail.id,
    title: detail.title,
    subtitle: detail.subtitle ?? undefined,
    difficulty: detail.difficulty ?? "BEGINNER",
    steps: detail.steps,
  };
}

/** MongoDB 교육 프로그램을 id로 로드해 재생 가능한 형태로 반환. */
export async function loadProgramById(id: string): Promise<EducationProgram> {
  const detail = await getProgram(id);
  const program = detailToProgram(detail);
  await prefetchImages(program.steps);
  return program;
}
