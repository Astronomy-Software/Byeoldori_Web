"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// 본문 뷰어는 브라우저 전용(SSR 비활성). content는 어차피 클라이언트에서
// fetch하므로 SSR HTML에 포함되지 않는다.
const LexicalViewer = dynamic(
  () =>
    import("@/components/editor/lexical-viewer").then((m) => m.LexicalViewer),
  { ssr: false },
);
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  getPostDetail,
  toggleLike,
  getComments,
  createComment,
  deletePost,
  deleteComment,
  toggleCommentLike,
  updateComment,
} from "@/lib/api/community";
import type {
  PostDetailResponse,
  CommentResponse,
  LikeToggleResponse,
} from "@/types/api";
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Eye,
  Star,
  Send,
  Trash2,
  Pencil,
  MapPin,
  Calendar,
  Target,
  Telescope,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import {
  authorInitial,
  authorLabel,
  buildCommentTree,
  canReplyTo,
  markCommentDeleted,
  mergeComments,
  updateComment as updateCommentInList,
  type CommentNode,
} from "@/lib/community/comments";
import { communityHref, routeTypeToTab } from "@/lib/community/board-query";

// 댓글은 서버에서 평면 목록(대댓글 포함)으로 페이지 단위로 온다.
const COMMENT_PAGE_SIZE = 50;

export default function PostDetailPage() {
  const params = useParams<{ type: string; id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const postId = Number(params.id);

  const [post, setPost] = useState<PostDetailResponse | null>(null);
  // 서버가 준 평면 목록 그대로 보관하고, 렌더 시 트리로 묶는다.
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [commentPage, setCommentPage] = useState(0);
  const [commentTotalPages, setCommentTotalPages] = useState(0);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  // 댓글 등록 중복 방지(두 번 탭·느린 응답) — ref는 같은 틱의 연속 클릭도 막는다.
  const [isPostingComment, setIsPostingComment] = useState(false);
  const postingCommentRef = useRef(false);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const [commentsError, setCommentsError] = useState<string | null>(null);

  useEffect(() => {
    setPostError(null);
    setCommentsError(null);

    getPostDetail(postId)
      .then(setPost)
      .catch(() => {
        setPostError("게시글을 불러오지 못했습니다.");
        toast.error("게시글을 불러오지 못했습니다.");
      });

    getComments(postId, 0, COMMENT_PAGE_SIZE)
      .then((r) => {
        setComments(r.content);
        setCommentPage(0);
        setCommentTotalPages(r.totalPages);
      })
      .catch(() => setCommentsError("댓글을 불러오지 못했습니다."));
  }, [postId]);

  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);
  const hasMoreComments = commentPage + 1 < commentTotalPages;

  async function handleLoadMoreComments() {
    if (loadingMoreComments) return;
    setLoadingMoreComments(true);
    try {
      const next = commentPage + 1;
      const r = await getComments(postId, next, COMMENT_PAGE_SIZE);
      setComments((prev) => mergeComments(prev, r.content));
      setCommentPage(next);
      setCommentTotalPages(r.totalPages);
    } catch {
      toast.error("댓글을 더 불러오지 못했습니다.");
    } finally {
      setLoadingMoreComments(false);
    }
  }

  async function handleLike() {
    if (!post) return;
    try {
      const res: LikeToggleResponse = await toggleLike(postId);
      setPost({ ...post, liked: res.liked, likeCount: res.likes });
    } catch {
      toast.error("좋아요 처리에 실패했습니다.");
    }
  }

  async function handleComment() {
    if (!newComment.trim() || postingCommentRef.current) return;
    postingCommentRef.current = true;
    setIsPostingComment(true);
    try {
      const res = await createComment(postId, {
        content: newComment,
        parentId: replyTo ?? undefined,
      });
      setComments((prev) => mergeComments(prev, [res]));
      setNewComment("");
      setReplyTo(null);
      if (post) setPost({ ...post, commentCount: post.commentCount + 1 });
    } catch {
      toast.error("댓글 작성에 실패했습니다.");
    } finally {
      postingCommentRef.current = false;
      setIsPostingComment(false);
    }
  }

  async function handleDeletePost() {
    if (!confirm("게시글을 삭제하시겠습니까?")) return;
    try {
      await deletePost(postId);
      toast.success("게시글이 삭제되었습니다.");
      // back()은 기록에 따라 삭제된 글의 수정 화면이나 사이트 밖으로 갈 수 있어 목록으로 고정한다.
      router.replace(communityHref(routeTypeToTab(params.type)));
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  }

  async function handleDeleteComment(commentId: number) {
    const target = comments.find((c) => c.id === commentId);
    if (!target || target.deleted) return;
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      await deleteComment(postId, commentId);
      // 서버는 soft delete — 대댓글은 남고 본문만 "삭제된 댓글입니다."로 바뀐다.
      setComments((prev) => markCommentDeleted(prev, commentId));
      if (post) setPost({ ...post, commentCount: Math.max(0, post.commentCount - 1) });
    } catch {
      toast.error("댓글 삭제에 실패했습니다.");
    }
  }

  async function handleCommentEdit(commentId: number, content: string) {
    try {
      const res = await updateComment(postId, commentId, { content });
      setComments((prev) =>
        updateCommentInList(prev, commentId, (c) => ({
          ...c,
          content: res.content,
        })),
      );
    } catch {
      toast.error("댓글 수정에 실패했습니다.");
    }
  }

  async function handleCommentLike(commentId: number) {
    try {
      const res = await toggleCommentLike(postId, commentId);
      setComments((prev) =>
        updateCommentInList(prev, commentId, (c) => ({
          ...c,
          liked: res.liked,
          likeCount: res.likes,
        })),
      );
    } catch {
      toast.error("좋아요 처리에 실패했습니다.");
    }
  }

  if (postError && !post) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 bg-bg-page text-sm text-text-tertiary">
        <p>{postError}</p>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> 돌아가기
        </button>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex h-64 items-center justify-center bg-bg-page">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-interactive-primary border-t-transparent" />
      </div>
    );
  }

  const isAuthor = user?.id === post.authorId;

  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-bg-page p-4 md:p-6">
      {/* 헤더 */}
      <button
        onClick={() => router.back()}
        className="mb-5 flex items-center gap-1 text-sm text-text-tertiary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> 돌아가기
      </button>

      {/* 게시글 */}
      <article className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            {post.type && (
              <Badge className="mb-3 border-transparent bg-surface-2 text-xs font-medium text-text-secondary">
                {post.type === "REVIEW"
                  ? "관측 리뷰"
                  : post.type === "EDUCATION"
                    ? "교육 프로그램"
                    : "자유게시판"}
              </Badge>
            )}
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-text-primary">
              {post.title}
            </h1>
          </div>
          {isAuthor && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="게시글 수정"
                onClick={() => router.push(`/community/${params.type}/${postId}/edit`)}
              >
                <Pencil className="h-4 w-4 text-text-tertiary" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="게시글 삭제"
                onClick={handleDeletePost}
              >
                <Trash2 className="h-4 w-4 text-error" aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm text-text-secondary">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-interactive-primary text-xs text-white">
              {authorInitial(post.authorNickname)}
            </AvatarFallback>
          </Avatar>
          <span className="text-text-primary">{authorLabel(post.authorNickname)}</span>
          <span className="font-mono text-text-tertiary">
            {new Date(post.createdAt).toLocaleDateString("ko-KR")}
          </span>
        </div>

        {/* 관측 리뷰 전용 정보 */}
        {post.review && (
          <div className="space-y-2.5 rounded-2xl border border-border-default bg-surface-1 p-4 text-sm">
            {post.review.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-aurora" />
                <span className="text-text-tertiary">관측지</span>
                <span className="font-mono text-text-primary">{post.review.location}</span>
              </div>
            )}
            {post.review.observationDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-aurora" />
                <span className="text-text-tertiary">관측일</span>
                <span className="font-mono text-text-primary">{post.review.observationDate}</span>
              </div>
            )}
            {post.review.equipment && (
              <div className="flex items-center gap-2">
                <Telescope className="h-3.5 w-3.5 shrink-0 text-aurora" />
                <span className="text-text-tertiary">장비</span>
                <span className="font-mono text-text-primary">{post.review.equipment}</span>
              </div>
            )}
            {post.review.score && (
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < post.review!.score! ? "fill-aurora text-aurora" : "text-text-tertiary"}`}
                  />
                ))}
                <span className="ml-1 font-mono text-text-secondary">({post.review.score}/5)</span>
              </div>
            )}
            {post.review.targets && post.review.targets.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <Target className="h-3.5 w-3.5 shrink-0 text-aurora" />
                {post.review.targets.map((t) => (
                  <span key={t} className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-text-secondary">{t}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 교육 프로그램 전용 정보 */}
        {post.education && (
          <div className="space-y-2.5 rounded-2xl border border-border-default bg-surface-1 p-4 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              {post.education.difficulty && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  post.education.difficulty === "BEGINNER" ? "bg-success/15 text-success" :
                  post.education.difficulty === "INTERMEDIATE" ? "bg-warning/15 text-warning" :
                  "bg-error/15 text-error"
                }`}>
                  {post.education.difficulty === "BEGINNER" ? "입문" :
                   post.education.difficulty === "INTERMEDIATE" ? "중급" : "고급"}
                </span>
              )}
              {post.education.averageScore != null &&
                post.education.averageScore > 0 && (
                <span className="flex items-center gap-1 font-mono text-aurora">
                  <Star className="h-3 w-3 fill-aurora" />
                  {post.education.averageScore.toFixed(1)}
                </span>
              )}
              {post.education.tags && (
                <span className="text-xs text-text-tertiary">{post.education.tags}</span>
              )}
            </div>
            {post.education.targets && post.education.targets.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <Target className="h-3.5 w-3.5 shrink-0 text-aurora" />
                {post.education.targets.map((t) => (
                  <span key={t} className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-text-secondary">{t}</span>
                ))}
              </div>
            )}
            {post.education.programId ? (
              <button
                onClick={() =>
                  router.push(`/starmap?programId=${post.education!.programId}`)
                }
                className="glow-primary mt-2 flex items-center gap-2 rounded-lg bg-interactive-primary px-4 py-2 text-sm text-white transition-colors hover:bg-interactive-primary/90"
              >
                <BookOpen className="h-4 w-4" />
                프로그램 실행
              </button>
            ) : null}
            {/* 예전에는 contentUrl(JSON 링크) 방식이라 게시글 번호를 넘겼지만,
                프로그램이 MongoDB로 분리되면서 starmap 은 programId 를 Mongo id 로
                해석한다. 게시글 번호를 넘기면 반드시 실패하므로 레거시 버튼은 제거했다.
                기존 글은 저작 화면에서 프로그램을 만들어 연결하면 다시 실행할 수 있다. */}
          </div>
        )}

        {/* 본문 — Lexical JSON이면 리치 렌더, 평문(구버전)이면 폴백 렌더 */}
        <LexicalViewer content={post.content} fallbackText={post.content} />


        {post.images && post.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {post.images.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`이미지 ${i + 1}`}
                className="w-full rounded-2xl border border-border-default object-cover"
              />
            ))}
          </div>
        )}

        {/* 통계 + 좋아요 */}
        <div className="flex items-center gap-5 border-t border-border-default pt-4 text-sm">
          <button
            onClick={handleLike}
            aria-label="게시글 좋아요"
            aria-pressed={post.liked}
            className={`flex items-center gap-1.5 font-mono transition-colors ${
              post.liked ? "text-error" : "text-text-tertiary hover:text-error"
            }`}
          >
            <Heart
              className={`h-4 w-4 ${post.liked ? "fill-current" : ""}`}
              aria-hidden="true"
            />
            {post.likeCount}
          </button>
          <span className="flex items-center gap-1.5 font-mono text-text-tertiary">
            <MessageSquare className="h-4 w-4" /> {post.commentCount}
          </span>
          <span className="flex items-center gap-1.5 font-mono text-text-tertiary">
            <Eye className="h-4 w-4" /> {post.viewCount}
          </span>
        </div>
      </article>

      {/* 댓글 섹션 */}
      <section className="mt-8 space-y-4">
        <h2 className="text-sm font-semibold text-text-primary">
          댓글 <span className="font-mono text-aurora">{post.commentCount}</span>
        </h2>

        {/* 댓글 입력 */}
        <div className="flex gap-2">
          <Textarea
            aria-label={replyTo ? "답글 입력" : "댓글 입력"}
            placeholder={
              replyTo ? "답글을 입력하세요..." : "댓글을 입력하세요..."
            }
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[60px] flex-1 border-border-default bg-surface-1 text-text-primary placeholder:text-text-tertiary"
          />
          <Button
            size="icon"
            className="glow-primary bg-interactive-primary text-white hover:bg-interactive-primary/90"
            onClick={handleComment}
            disabled={isPostingComment || !newComment.trim()}
            aria-label={replyTo ? "답글 등록" : "댓글 등록"}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        {replyTo && (
          <button
            className="text-xs text-text-tertiary hover:text-text-primary"
            onClick={() => setReplyTo(null)}
          >
            답글 취소
          </button>
        )}

        {/* 댓글 목록 */}
        {commentsError && (
          <p className="text-xs text-error">{commentsError}</p>
        )}
        <div className="space-y-3">
          {commentTree.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={user?.id}
              onReply={(id) => setReplyTo(id)}
              onDelete={handleDeleteComment}
              onEdit={handleCommentEdit}
              onLike={handleCommentLike}
            />
          ))}
        </div>
        {hasMoreComments && (
          <button
            type="button"
            onClick={handleLoadMoreComments}
            disabled={loadingMoreComments}
            className="w-full rounded-xl border border-border-default py-2 text-xs text-text-secondary transition-colors hover:text-text-primary disabled:opacity-50"
          >
            {loadingMoreComments ? "불러오는 중..." : "댓글 더보기"}
          </button>
        )}
      </section>
    </div>
  );
}

function CommentItem({
  comment,
  currentUserId,
  onReply,
  onDelete,
  onEdit,
  onLike,
  depth = 0,
}: {
  comment: CommentNode;
  currentUserId?: number;
  onReply: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number, content: string) => Promise<void>;
  onLike: (id: number) => void;
  depth?: number;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSaving, setIsSaving] = useState(false);
  const isAuthor =
    currentUserId !== undefined &&
    currentUserId === comment.authorId &&
    !comment.deleted;

  async function handleSaveEdit() {
    if (!editContent.trim()) return;
    setIsSaving(true);
    await onEdit(comment.id, editContent);
    setIsSaving(false);
    setIsEditing(false);
  }

  return (
    <div style={{ marginLeft: depth * 24 }}>
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-interactive-primary text-[10px] text-white">
                {authorInitial(comment.authorNickname)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-text-primary">
              {authorLabel(comment.authorNickname)}
            </span>
            <span className="font-mono">
              {new Date(comment.createdAt).toLocaleDateString("ko-KR")}
            </span>
          </div>
          {!comment.deleted && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onLike(comment.id)}
                aria-label="댓글 좋아요"
                aria-pressed={comment.liked}
                className={`text-xs ${comment.liked ? "text-error" : "text-text-tertiary"}`}
              >
                <Heart
                  className={`h-3 w-3 ${comment.liked ? "fill-current" : ""}`}
                  aria-hidden="true"
                />
              </button>
              <span className="font-mono text-xs text-text-tertiary">
                {comment.likeCount}
              </span>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="mt-2 space-y-1">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[60px] border-border-default bg-surface-1 text-sm text-text-primary"
            />
            <div className="flex gap-2 text-xs">
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="text-interactive-link hover:text-aurora disabled:opacity-50"
              >
                {isSaving ? "저장 중..." : "저장"}
              </button>
              <button
                onClick={() => { setIsEditing(false); setEditContent(comment.content); }}
                className="text-text-tertiary hover:text-text-primary"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <p
            className={`mt-2 text-sm leading-relaxed ${
              comment.deleted ? "italic text-text-tertiary" : "text-text-secondary"
            }`}
          >
            {comment.content}
          </p>
        )}

        {!isEditing && (canReplyTo(comment) || isAuthor) && (
          <div className="mt-2 flex gap-3 text-xs">
            {canReplyTo(comment) && (
              <button
                onClick={() => onReply(comment.id)}
                className="text-text-tertiary hover:text-text-primary"
              >
                답글
              </button>
            )}
            {isAuthor && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-text-tertiary hover:text-text-primary"
                >
                  수정
                </button>
                <button
                  onClick={() => onDelete(comment.id)}
                  className="text-text-tertiary hover:text-error"
                >
                  삭제
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {comment.children.map((child) => (
        <CommentItem
          key={child.id}
          comment={child}
          currentUserId={currentUserId}
          onReply={onReply}
          onDelete={onDelete}
          onEdit={onEdit}
          onLike={onLike}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
