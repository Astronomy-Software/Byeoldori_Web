import type { ProgramStatus } from "./api/education-program";

// 교육 프로그램 상태 규칙(서버 EducationProgramService와 맞춘다).
// - 검수(moderation.required, 기본 켜짐)가 켜져 있으면 PREVIEW → PUBLISHED 발행은 ADMIN만 한다.
// - 작성자가 PREVIEW 상태에서 수정하면 서버가 DRAFT로 되돌린다(검수 요청 철회).
// - PUBLISHED는 수정할 수 없다.

// 목록(내 교육 프로그램)에 보여 줄 상태 이름. 반려되면 사유와 함께 DRAFT로 돌아온다.
export function programStatusLabel(
  status: ProgramStatus,
  rejectReason?: string | null,
): string {
  if (status === "PUBLISHED") return "발행됨";
  if (status === "PREVIEW") return "검수 대기";
  return rejectReason?.trim() ? "반려됨" : "임시저장";
}

export function programAuthorHref(id: string): string {
  return `/community/program/author?id=${encodeURIComponent(id)}`;
}

export type AuthorStage = "submit" | "publish" | "waiting" | "published";

// 저작 화면의 진행 버튼 단계. 검수가 켜져 있으면 일반 작성자는 검수 대기 중에 누를 버튼이 없고,
// 검수가 꺼져 있으면 작성자도 PREVIEW 프로그램을 바로 발행할 수 있다.
// 검수 설정을 모르면(조회 실패) moderationRequired=true 로 넘겨 안전한 쪽을 따른다.
export function authorStage(
  status: ProgramStatus | null,
  isAdmin: boolean,
  moderationRequired: boolean,
): AuthorStage {
  if (status === "PUBLISHED") return "published";
  if (status === "PREVIEW") return isAdmin || !moderationRequired ? "publish" : "waiting";
  return "submit";
}

// 저장 응답으로 검수 요청이 철회됐는지(PREVIEW였는데 DRAFT로 돌아옴) 판단한다.
export function reviewWithdrawnBySave(
  before: ProgramStatus | null,
  after: ProgramStatus,
): boolean {
  return before === "PREVIEW" && after === "DRAFT";
}
