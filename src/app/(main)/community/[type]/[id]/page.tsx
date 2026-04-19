"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";

export default function PostDetailPage() {
  const params = useParams<{ type: string; id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const postId = Number(params.id);

  const [post, setPost] = useState<PostDetailResponse | null>(null);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);

  useEffect(() => {
    getPostDetail(postId)
      .then(setPost)
      .catch(() => toast.error("게시글을 불러오지 못했습니다."));

    getComments(postId)
      .then((r) => setComments(r.content))
      .catch(() => {});
  }, [postId]);

  async function handleLike() {
    if (!post) return;
    try {
      const res: LikeToggleResponse = await toggleLike(postId);
      setPost({ ...post, liked: res.liked, likeCount: res.likeCount });
    } catch {
      toast.error("좋아요 처리에 실패했습니다.");
    }
  }

  async function handleComment() {
    if (!newComment.trim()) return;
    try {
      const res = await createComment(postId, {
        content: newComment,
        parentId: replyTo ?? undefined,
      });
      setComments((prev) => [...prev, res]);
      setNewComment("");
      setReplyTo(null);
      if (post) setPost({ ...post, commentCount: post.commentCount + 1 });
    } catch {
      toast.error("댓글 작성에 실패했습니다.");
    }
  }

  async function handleDeletePost() {
    if (!confirm("게시글을 삭제하시겠습니까?")) return;
    try {
      await deletePost(postId);
      toast.success("게시글이 삭제되었습니다.");
      router.back();
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  }

  async function handleDeleteComment(commentId: number) {
    try {
      await deleteComment(postId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      if (post) setPost({ ...post, commentCount: post.commentCount - 1 });
    } catch {
      toast.error("댓글 삭제에 실패했습니다.");
    }
  }

  async function handleCommentLike(commentId: number) {
    try {
      const res = await toggleCommentLike(postId, commentId);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, liked: res.liked, likeCount: res.likeCount }
            : c,
        ),
      );
    } catch {
      toast.error("좋아요 처리에 실패했습니다.");
    }
  }

  if (!post) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  const isAuthor = user?.nickname === post.authorNickname;

  return (
    <div className="mx-auto max-w-3xl p-4">
      {/* 헤더 */}
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 돌아가기
      </button>

      {/* 게시글 */}
      <article className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            {post.type && (
              <Badge variant="secondary" className="mb-2">
                {post.type === "REVIEW"
                  ? "관측 리뷰"
                  : post.type === "EDUCATION"
                    ? "교육 프로그램"
                    : "자유게시판"}
              </Badge>
            )}
            <h1 className="text-xl font-bold text-foreground">{post.title}</h1>
          </div>
          {isAuthor && (
            <Button variant="ghost" size="icon" onClick={handleDeletePost}>
              <Trash2 className="h-4 w-4 text-error" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-purple-600 text-xs">
              {post.authorNickname[0]}
            </AvatarFallback>
          </Avatar>
          <span>{post.authorNickname}</span>
          <span>{new Date(post.createdAt).toLocaleDateString("ko-KR")}</span>
        </div>

        {/* 리뷰 전용 정보 */}
        {post.siteName && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">관측지:</span>
            <span className="text-foreground">{post.siteName}</span>
            {post.rating && (
              <span className="flex items-center gap-0.5 text-warning">
                <Star className="h-3 w-3" /> {post.rating}
              </span>
            )}
          </div>
        )}

        {/* 본문 */}
        <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
          {post.content}
        </div>

        {/* 이미지 — 서버 필드명: images (imageUrls는 레거시) */}
        {((post.images ?? post.imageUrls) ?? []).length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {(post.images ?? post.imageUrls ?? []).map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`이미지 ${i + 1}`}
                className="rounded-lg object-cover"
              />
            ))}
          </div>
        )}

        {/* 통계 + 좋아요 */}
        <div className="flex items-center gap-4 border-t border-border pt-3 text-sm">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 transition-colors ${
              post.liked ? "text-error" : "text-muted-foreground hover:text-error"
            }`}
          >
            <Heart className={`h-4 w-4 ${post.liked ? "fill-current" : ""}`} />
            {post.likeCount}
          </button>
          <span className="flex items-center gap-1 text-muted-foreground">
            <MessageSquare className="h-4 w-4" /> {post.commentCount}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Eye className="h-4 w-4" /> {post.viewCount}
          </span>
        </div>
      </article>

      {/* 댓글 섹션 */}
      <section className="mt-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">
          댓글 {post.commentCount}
        </h2>

        {/* 댓글 입력 */}
        <div className="flex gap-2">
          <Textarea
            placeholder={
              replyTo ? "답글을 입력하세요..." : "댓글을 입력하세요..."
            }
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[60px] flex-1"
          />
          <Button
            size="icon"
            className="bg-purple-600 hover:bg-purple-700"
            onClick={handleComment}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {replyTo && (
          <button
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setReplyTo(null)}
          >
            답글 취소
          </button>
        )}

        {/* 댓글 목록 */}
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={user?.nickname}
              onReply={(id) => setReplyTo(id)}
              onDelete={handleDeleteComment}
              onLike={handleCommentLike}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function CommentItem({
  comment,
  currentUser,
  onReply,
  onDelete,
  onLike,
  depth = 0,
}: {
  comment: CommentResponse;
  currentUser?: string;
  onReply: (id: number) => void;
  onDelete: (id: number) => void;
  onLike: (id: number) => void;
  depth?: number;
}) {
  const isAuthor = currentUser === comment.authorNickname;

  return (
    <div style={{ marginLeft: depth * 24 }}>
      <div className="rounded-lg bg-card/30 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="bg-purple-700 text-[10px]">
                {comment.authorNickname[0]}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground">
              {comment.authorNickname}
            </span>
            <span>
              {new Date(comment.createdAt).toLocaleDateString("ko-KR")}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onLike(comment.id)}
              className={`text-xs ${comment.liked ? "text-error" : "text-muted-foreground"}`}
            >
              <Heart
                className={`h-3 w-3 ${comment.liked ? "fill-current" : ""}`}
              />
            </button>
            <span className="text-xs text-muted-foreground">
              {comment.likeCount}
            </span>
          </div>
        </div>
        <p className="mt-1 text-sm text-foreground">{comment.content}</p>
        <div className="mt-1 flex gap-2 text-xs">
          <button
            onClick={() => onReply(comment.id)}
            className="text-muted-foreground hover:text-foreground"
          >
            답글
          </button>
          {isAuthor && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-muted-foreground hover:text-error"
            >
              삭제
            </button>
          )}
        </div>
      </div>
      {comment.children?.map((child) => (
        <CommentItem
          key={child.id}
          comment={child}
          currentUser={currentUser}
          onReply={onReply}
          onDelete={onDelete}
          onLike={onLike}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
