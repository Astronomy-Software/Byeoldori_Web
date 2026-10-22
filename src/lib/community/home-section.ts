// 홈 게시글 섹션 상태. 로딩 중·실패를 "게시글이 없습니다."와 구분한다.
export type HomePostsStatus = "loading" | "loaded" | "error";

// 목록 대신 보여줄 자리표시. 글이 있으면 언제나 목록을 그대로 보여준다(null).
// 실패는 섹션 위 오류 배너가 알리므로 섹션 안에는 아무것도 띄우지 않는다(null).
export function homeSectionPlaceholder(
  status: HomePostsStatus,
  count: number,
): "skeleton" | "empty" | null {
  if (count > 0) return null;
  if (status === "loading") return "skeleton";
  if (status === "loaded") return "empty";
  return null;
}
