import type { CommentResponse } from "@/types/api";

// 서버 soft delete 시 치환되는 본문(CommentService.delete와 동일)
export const DELETED_COMMENT_CONTENT = "삭제된 댓글입니다.";

const UNKNOWN_AUTHOR = "알 수 없는 사용자";

// 탈퇴 회원·닉네임 미설정 사용자는 서버가 authorNickname=null을 보낸다.
export function authorLabel(nickname: string | null | undefined): string {
  const trimmed = nickname?.trim();
  return trimmed ? trimmed : UNKNOWN_AUTHOR;
}

// 아바타 첫 글자. 닉네임이 없으면 "?"
export function authorInitial(nickname: string | null | undefined): string {
  const trimmed = nickname?.trim();
  return trimmed ? Array.from(trimmed)[0] : "?";
}

export interface CommentNode extends CommentResponse {
  children: CommentNode[];
}

// 평면 목록을 id 기준으로 합친다(중복 제거, 같은 id는 incoming이 우선).
// 서버 정렬(작성 시각→id 오름차순)과 같도록 id 오름차순으로 정렬한다.
export function mergeComments(
  prev: CommentResponse[],
  incoming: CommentResponse[],
): CommentResponse[] {
  const byId = new Map<number, CommentResponse>();
  for (const c of prev) byId.set(c.id, c);
  for (const c of incoming) byId.set(c.id, c);
  return Array.from(byId.values()).sort((a, b) => a.id - b.id);
}

// 평면 목록 → 부모-자식 트리. 부모가 목록에 없는 대댓글은 최상위로 둔다.
export function buildCommentTree(flat: CommentResponse[]): CommentNode[] {
  const nodes = new Map<number, CommentNode>();
  for (const c of flat) nodes.set(c.id, { ...c, children: [] });

  const roots: CommentNode[] = [];
  for (const c of flat) {
    const node = nodes.get(c.id)!;
    const parent = c.parentId != null ? nodes.get(c.parentId) : undefined;
    if (parent && parent !== node) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

// 서버는 대댓글(depth>0)에 대한 답글을 거부한다(CANNOT_REPLY_TO_REPLY).
export function canReplyTo(c: CommentResponse): boolean {
  return !c.deleted && c.depth === 0 && c.parentId == null;
}

// 입력칸 위 "○○님에게 답글" 표시용. 대상이 목록에 없으면(삭제·미로드) null.
export function replyTargetLabel(
  flat: CommentResponse[],
  replyTo: number | null,
): string | null {
  if (replyTo == null) return null;
  const target = flat.find((c) => c.id === replyTo);
  return target ? authorLabel(target.authorNickname) : null;
}

export function updateComment(
  flat: CommentResponse[],
  id: number,
  updater: (c: CommentResponse) => CommentResponse,
): CommentResponse[] {
  return flat.map((c) => (c.id === id ? updater(c) : c));
}

// 서버와 같은 방식으로 soft delete 상태를 반영한다(대댓글은 그대로 남는다).
export function markCommentDeleted(
  flat: CommentResponse[],
  id: number,
): CommentResponse[] {
  return updateComment(flat, id, (c) => ({
    ...c,
    deleted: true,
    content: DELETED_COMMENT_CONTENT,
  }));
}
