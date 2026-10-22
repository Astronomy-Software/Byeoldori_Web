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

// 리뷰 수정 요청 본문. 서버 PostUpdateRequest.review 는 보낸 필드만 바꾸지만 두 가지는 예외다.
// - observationSiteId: 빠지면 관측지 연결이 끊긴다 → 기존 연결을 유지하려면 그대로 다시 보낸다.
// - targets: 빠지면 대상 천체가 모두 지워진다 → 웹에서 고치지 않는 값도 기존 목록을 그대로 보낸다.
// 관측지 이름·평점은 비어 있으면 보내지 않아 기존 값을 유지한다(앱에서 쓴 글은 비어 있을 수 있다).
export interface ReviewUpdateInput {
  title: string;
  content: string;
  imageUrls: string[];
  siteName: string;
  rating: number | null;
  observationSiteId?: number;
  targets: string[];
}

export function toReviewUpdatePayload(body: ReviewUpdateInput) {
  return {
    title: body.title,
    content: body.content,
    imageUrls: body.imageUrls,
    review: {
      ...(body.siteName.trim() ? { location: body.siteName } : {}),
      ...(body.rating != null ? { score: body.rating } : {}),
      ...(body.observationSiteId != null
        ? { observationSiteId: body.observationSiteId }
        : {}),
      targets: body.targets,
    },
  };
}

// 수정 화면의 관측지 연결. 이름을 그대로 두면 기존 연결을 유지하고(관측지 이름이 바뀌었어도 끊지 않는다),
// 이름을 바꿨을 때만 작성 화면처럼 정확히 같은 이름의 관측지를 다시 찾는다.
// 이름을 비우면 location 을 보내지 않아 기존 이름이 남으므로 연결도 그대로 둔다.
export async function resolveEditedSiteId(
  original: { location?: string | null; observationSiteId?: number | null },
  siteName: string,
  findByName: (name: string) => Promise<number | undefined>,
): Promise<number | undefined> {
  const name = siteName.trim();
  if (!name || name === (original.location ?? "").trim()) {
    return original.observationSiteId ?? undefined;
  }
  return findByName(siteName);
}
