// 교육 게시글의 '천체 이름' 입력(가운뎃점 구분) ↔ 서버 education.targets(List) 변환.
export function splitTargets(objectName: string): string[] {
  return objectName
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function joinTargets(targets: readonly string[] | null | undefined): string {
  return (targets ?? []).join(" · ");
}

// 교육 게시글 수정 요청 본문. 서버는 education.targets 가 빠지면 대상 천체를 모두 지우므로 항상 보낸다.
// 난이도는 고른 값이 있을 때만 보낸다. 발행 상태(status)·연결 프로그램(programId)은 보내지 않아 그대로 둔다.
export interface EducationUpdateInput {
  title: string;
  content: string;
  imageUrls: string[];
  difficulty: string;
  objectName: string;
}

export function toEducationUpdatePayload(body: EducationUpdateInput) {
  return {
    title: body.title,
    content: body.content,
    imageUrls: body.imageUrls,
    education: {
      ...(body.difficulty ? { difficulty: body.difficulty } : {}),
      targets: splitTargets(body.objectName),
    },
  };
}
