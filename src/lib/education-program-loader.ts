import type { EducationProgram, EduStep } from "@/types/education";

async function prefetchImages(steps: EduStep[]): Promise<void> {
  for (const step of steps) {
    if (step.type === "show-image" && step.imageUrl?.startsWith("http")) {
      try {
        const blob = await fetch(step.imageUrl).then((r) => r.blob());
        step.imageUrl = URL.createObjectURL(blob);
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
