// 서버 검증 한도(PostCreateRequest/PostUpdateRequest·CommentCreateRequest)와 맞춘다.
export const POST_TITLE_MAX_LENGTH = 120;
export const POST_IMAGE_MAX_COUNT = 20;
export const COMMENT_MAX_LENGTH = 1000;

export const POST_IMAGE_LIMIT_MESSAGE = `이미지는 최대 ${POST_IMAGE_MAX_COUNT}장까지 첨부할 수 있습니다.`;

// 이미 첨부한 장수에 이번에 고른 장수를 더하면 한도를 넘는지
export function exceedsImageLimit(current: number, adding: number): boolean {
  return current + adding > POST_IMAGE_MAX_COUNT;
}
