import type { CreateReviewRequest } from "@/types/api";

// 리뷰 작성/수정 요청 본문.
// 백엔드는 review 필드로 중첩된 형태를 기대한다(PostCreateRequest/PostUpdateRequest.review: ReviewDto).
// 프론트의 flat 입력(siteName·rating)을 매핑: siteName→location, rating→score.
export function toReviewPayload(body: CreateReviewRequest) {
  return {
    title: body.title,
    content: body.content,
    imageUrls: body.imageUrls ?? [],
    review: {
      location: body.siteName,
      score: body.rating,
      ...(body.observationSiteId != null
        ? { observationSiteId: body.observationSiteId }
        : {}),
    },
  };
}
