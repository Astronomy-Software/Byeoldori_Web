import { apiFetch } from "./client";
import type {
  PostResponse,
  ReviewPostResponse,
  EducationPostResponse,
  PostDetailResponse,
  CreateFreeRequest,
  CreateReviewRequest,
  CreateEducationRequest,
  CreatedPostId,
  LikeToggleResponse,
  CommentsPageResponse,
  CommentResponse,
  CreateCommentRequest,
  FeedbackRequest,
  PostSummary,
  ReviewPostSummary,
  EducationPostSummary,
} from "@/types/api";

// 게시글 목록
export async function getPosts(
  type: string,
  page = 0,
  size = 20,
  sortBy = "LATEST",
  keyword?: string,
  searchBy = "TITLE",
): Promise<PostResponse> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sortBy,
    searchBy,
  });
  if (keyword) params.set("keyword", keyword);
  return apiFetch<PostResponse>(`community/${type}/posts?${params}`);
}

export async function getReviewPosts(
  page = 0,
  size = 20,
  sortBy = "LATEST",
  keyword?: string,
): Promise<ReviewPostResponse> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sortBy,
  });
  if (keyword) params.set("keyword", keyword);
  return apiFetch<ReviewPostResponse>(`community/REVIEW/posts?${params}`);
}

export async function getEducationPosts(
  page = 0,
  size = 20,
  sortBy = "LATEST",
  keyword?: string,
): Promise<EducationPostResponse> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sortBy,
  });
  if (keyword) params.set("keyword", keyword);
  return apiFetch<EducationPostResponse>(
    `community/EDUCATION/posts?${params}`,
  );
}

// 게시글 작성
export async function createFreePost(
  body: CreateFreeRequest,
): Promise<CreatedPostId> {
  return apiFetch<CreatedPostId>("community/FREE/posts", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function createReviewPost(
  body: CreateReviewRequest,
): Promise<CreatedPostId> {
  // 백엔드는 review 필드로 중첩된 형태를 기대한다(PostCreateRequest.review: ReviewDto).
  // 프론트의 flat 입력(siteName·rating)을 매핑: siteName→location, rating→score.
  const payload = {
    title: body.title,
    content: body.content,
    imageUrls: body.imageUrls ?? [],
    review: {
      location: body.siteName,
      score: body.rating,
    },
  };
  return apiFetch<CreatedPostId>("community/REVIEW/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createEducationPost(
  body: CreateEducationRequest,
): Promise<CreatedPostId> {
  // 백엔드는 education 필드로 중첩된 형태를 기대한다(PostCreateRequest.education: EducationRequestDto).
  // objectName→education.targets(List), status는 PUBLISHED로 게시.
  const payload = {
    title: body.title,
    content: body.content,
    imageUrls: body.imageUrls ?? [],
    education: {
      difficulty: body.difficulty,
      targets: body.objectName
        ? body.objectName
            .split("·")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      status: "PUBLISHED",
      ...(body.programId ? { programId: body.programId } : {}),
    },
  };
  return apiFetch<CreatedPostId>("community/EDUCATION/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// 게시글 상세
export async function getPostDetail(
  postId: number,
): Promise<PostDetailResponse> {
  return apiFetch<PostDetailResponse>(`community/posts/${postId}`);
}

// 게시글 수정
export async function updatePost(
  postId: number,
  body: CreateFreeRequest,
): Promise<void> {
  await apiFetch(`community/posts/${postId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function updateReview(
  postId: number,
  body: CreateReviewRequest,
): Promise<void> {
  await apiFetch(`community/posts/${postId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

// 게시글 삭제
export async function deletePost(postId: number): Promise<void> {
  await apiFetch(`community/posts/${postId}`, { method: "DELETE" });
}

// 좋아요
export async function toggleLike(
  postId: number,
): Promise<LikeToggleResponse> {
  return apiFetch<LikeToggleResponse>(
    `community/posts/${postId}/likes/toggle`,
    { method: "POST" },
  );
}

// 댓글
export async function getComments(
  postId: number,
  page = 0,
  size = 15,
): Promise<CommentsPageResponse> {
  return apiFetch<CommentsPageResponse>(
    `community/posts/${postId}/comments?page=${page}&size=${size}`,
  );
}

export async function createComment(
  postId: number,
  body: CreateCommentRequest,
): Promise<CommentResponse> {
  return apiFetch<CommentResponse>(`community/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateComment(
  postId: number,
  commentId: number,
  body: CreateCommentRequest,
): Promise<CommentResponse> {
  return apiFetch<CommentResponse>(
    `community/posts/${postId}/comments/${commentId}`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
}

export async function deleteComment(
  postId: number,
  commentId: number,
): Promise<void> {
  await apiFetch(`community/posts/${postId}/comments/${commentId}`, {
    method: "DELETE",
  });
}

export async function toggleCommentLike(
  postId: number,
  commentId: number,
): Promise<LikeToggleResponse> {
  return apiFetch<LikeToggleResponse>(
    `community/posts/${postId}/comments/${commentId}/likes-toggle`,
    { method: "POST" },
  );
}

// 홈 화면 전용 API (docs: /community/home/*)
export async function getHomeReviews(): Promise<ReviewPostSummary[]> {
  return apiFetch<ReviewPostSummary[]>("community/home/reviews");
}

export async function getHomeEducations(): Promise<EducationPostSummary[]> {
  return apiFetch<EducationPostSummary[]>("community/home/educations");
}

export async function getHomeFreePosts(): Promise<PostSummary[]> {
  return apiFetch<PostSummary[]>("community/home/free-posts");
}

export async function evaluateEduPost(
  postId: number,
  body: FeedbackRequest,
): Promise<void> {
  await apiFetch(`community/posts/${postId}/evaluations`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
