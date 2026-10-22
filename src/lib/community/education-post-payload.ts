// 교육 게시글 작성 화면의 '천체 이름' 입력(가운뎃점 구분) → 서버 education.targets(List) 변환.
export function splitTargets(objectName: string): string[] {
  return objectName
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean);
}

// 수정 화면은 천체 이름을 한 줄에 하나씩 보여 준다. 이름 안에 가운뎃점이 든 천체(예: "알파·센타우리")를
// '·'로 합쳤다 다시 나누면 이름이 쪼개지므로, 한 줄짜리 입력에서 들어올 수 없는 줄바꿈을 구분자로 쓴다.
// 입력을 고치지 않았으면 나누지 않고 처음 받은 목록을 그대로 다시 보낸다.
export function targetsToLines(targets: readonly string[] | null | undefined): string {
  return (targets ?? []).join("\n");
}

export function resolveEditedTargets(
  original: readonly string[] | null | undefined,
  text: string,
): string[] {
  if (text === targetsToLines(original)) return [...(original ?? [])];
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// 교육 게시글 수정 요청 본문. 서버는 education.targets 가 빠지면 대상 천체를 모두 지우므로 항상 보낸다.
// 난이도는 고른 값이 있을 때만 보낸다. 발행 상태(status)·연결 프로그램(programId)은 보내지 않아 그대로 둔다.
export interface EducationUpdateInput {
  title: string;
  content: string;
  imageUrls: string[];
  difficulty: string;
  targets: string[];
}

export function toEducationUpdatePayload(body: EducationUpdateInput) {
  return {
    title: body.title,
    content: body.content,
    imageUrls: body.imageUrls,
    education: {
      ...(body.difficulty ? { difficulty: body.difficulty } : {}),
      targets: body.targets,
    },
  };
}
