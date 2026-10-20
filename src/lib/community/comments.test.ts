import { test } from "node:test";
import assert from "node:assert/strict";
import type { CommentResponse } from "@/types/api";
import {
  DELETED_COMMENT_CONTENT,
  authorInitial,
  authorLabel,
  buildCommentTree,
  canReplyTo,
  markCommentDeleted,
  mergeComments,
} from "./comments.ts";

function c(
  id: number,
  parentId: number | null = null,
  extra: Partial<CommentResponse> = {},
): CommentResponse {
  return {
    id,
    content: `c${id}`,
    authorId: 1,
    authorNickname: "별돌이",
    authorProfileImageUrl: null,
    createdAt: "2026-10-20T00:00:00",
    likeCount: 0,
    liked: false,
    parentId,
    depth: parentId == null ? 0 : 1,
    deleted: false,
    ...extra,
  };
}

test("authorLabel/authorInitial: null·빈 닉네임에서 크래시 없이 대체값", () => {
  assert.equal(authorLabel(null), "알 수 없는 사용자");
  assert.equal(authorLabel("  "), "알 수 없는 사용자");
  assert.equal(authorLabel("별돌이"), "별돌이");
  assert.equal(authorInitial(null), "?");
  assert.equal(authorInitial(undefined), "?");
  assert.equal(authorInitial(""), "?");
  assert.equal(authorInitial("별돌이"), "별");
});

test("buildCommentTree: 평면 목록의 대댓글을 부모 children으로 묶는다", () => {
  const tree = buildCommentTree([c(1), c(2), c(3, 1), c(4, 2), c(5, 1)]);
  assert.deepEqual(
    tree.map((n) => [n.id, n.children.map((ch) => ch.id)]),
    [
      [1, [3, 5]],
      [2, [4]],
    ],
  );
});

test("buildCommentTree: 부모가 목록에 없으면 최상위로 둔다", () => {
  const tree = buildCommentTree([c(10, 99)]);
  assert.equal(tree.length, 1);
  assert.equal(tree[0].id, 10);
});

test("mergeComments: id 중복 제거 + id 오름차순", () => {
  const merged = mergeComments([c(1), c(5)], [c(3), c(5, null, { content: "new" })]);
  assert.deepEqual(merged.map((m) => m.id), [1, 3, 5]);
  assert.equal(merged[2].content, "new");
});

test("canReplyTo: 대댓글·삭제 댓글에는 답글 불가", () => {
  assert.equal(canReplyTo(c(1)), true);
  assert.equal(canReplyTo(c(2, 1)), false);
  assert.equal(canReplyTo(c(3, null, { deleted: true })), false);
});

test("markCommentDeleted: soft delete — 대댓글은 유지", () => {
  const after = markCommentDeleted([c(1), c(2, 1)], 1);
  assert.equal(after.length, 2);
  assert.equal(after[0].deleted, true);
  assert.equal(after[0].content, DELETED_COMMENT_CONTENT);
  assert.equal(after[1].deleted, false);
});
