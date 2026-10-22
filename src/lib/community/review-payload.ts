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
// 단 clearLocation 이면 사용자가 이름을 일부러 지운 것이므로 빈 이름을 보내 지운다.
export interface ReviewUpdateInput {
  title: string;
  content: string;
  imageUrls: string[];
  siteName: string;
  rating: number | null;
  observationSiteId?: number;
  clearLocation?: boolean;
  targets: string[];
}

export function toReviewUpdatePayload(body: ReviewUpdateInput) {
  return {
    title: body.title,
    content: body.content,
    imageUrls: body.imageUrls,
    review: {
      ...(body.clearLocation
        ? { location: "" }
        : body.siteName.trim()
          ? { location: body.siteName }
          : {}),
      ...(body.rating != null ? { score: body.rating } : {}),
      ...(body.observationSiteId != null
        ? { observationSiteId: body.observationSiteId }
        : {}),
      targets: body.targets,
    },
  };
}

export const SITE_NAME_NOT_REGISTERED_MESSAGE =
  "등록된 관측지 이름을 목록에서 선택해 주세요. 관측지 연결을 지우려면 이름을 비워 주세요.";
export const SITE_LOOKUP_FAILED_MESSAGE =
  "관측지 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.";

export type EditedSiteResolution =
  | { ok: true; observationSiteId?: number; clearLocation?: boolean }
  | { ok: false; message: string };

// 수정 화면의 관측지 연결. 서버는 observationSiteId 가 빠진 수정 요청을 '연결 해제'로 처리하므로
// 연결이 조용히 사라지는 저장은 하지 않는다.
// - 이름을 그대로 두면 기존 연결을 유지한다(관측지 이름이 바뀌었어도 끊지 않는다).
// - 원래 있던 이름을 비우면 사용자가 일부러 지운 것으로 보고 이름과 연결을 함께 지운다.
// - 이름을 바꾸면 작성 화면처럼 정확히 같은 이름의 관측지를 찾는다. 없을 때 원래 연결이 있었다면
//   저장을 막고, 원래 연결이 없던 글은 작성 화면처럼 이름만 저장한다(잃을 연결이 없다).
// - 관측지 조회가 실패(네트워크·5xx)하면 연결 여부를 알 수 없으므로 저장을 막는다.
export async function resolveEditedSite(
  original: { location?: string | null; observationSiteId?: number | null },
  siteName: string,
  findByName: (name: string) => Promise<number | undefined>,
): Promise<EditedSiteResolution> {
  const name = siteName.trim();
  const originalName = (original.location ?? "").trim();
  const originalId = original.observationSiteId ?? undefined;
  if (name === originalName) return { ok: true, observationSiteId: originalId };
  if (!name) return { ok: true, clearLocation: true };
  let found: number | undefined;
  try {
    found = await findByName(siteName);
  } catch {
    return { ok: false, message: SITE_LOOKUP_FAILED_MESSAGE };
  }
  if (found != null) return { ok: true, observationSiteId: found };
  if (originalId != null) return { ok: false, message: SITE_NAME_NOT_REGISTERED_MESSAGE };
  return { ok: true };
}
