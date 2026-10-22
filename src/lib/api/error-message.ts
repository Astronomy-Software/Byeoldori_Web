// 사용자 입력 때문에 거절된 요청(4xx)이면 서버가 준 이유(ApiError.body)를, 아니면 기본 문구를 돌려준다.
// 401(세션 만료)·5xx·네트워크 오류는 내부 문구가 그대로 보이지 않도록 기본 문구를 쓴다.
const MAX_MESSAGE_LENGTH = 200;

export function clientErrorMessage(e: unknown, fallback: string): string {
  if (typeof e !== "object" || e === null) return fallback;
  const { status, body } = e as { status?: unknown; body?: unknown };
  if (typeof status !== "number" || status < 400 || status >= 500 || status === 401) {
    return fallback;
  }
  if (typeof body !== "string") return fallback;
  const msg = body.trim();
  if (!msg || msg.length > MAX_MESSAGE_LENGTH || msg.startsWith("{") || msg.startsWith("<")) {
    return fallback;
  }
  return msg;
}
