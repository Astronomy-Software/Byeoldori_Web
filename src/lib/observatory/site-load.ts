// 관측지 상세(/observatory/[id]) 경로 id 해석과 불러오기 실패 구분.

// 경로의 id가 양의 정수일 때만 숫자를 돌려준다('abc'·'1.5'·'0' 같은 잘못된 링크는 null).
export function parseSiteId(raw: unknown): number | null {
  if (typeof raw !== "string" || !/^[1-9]\d*$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) ? id : null;
}

export type SiteLoadError = "notFound" | "failed";

// 404만 '없는 관측지'로 본다. 5xx·프록시 타임아웃·네트워크 오류는 다시 시도할 수 있는 일시 오류다.
export function siteLoadErrorKind(e: unknown): SiteLoadError {
  if (typeof e === "object" && e !== null && (e as { status?: unknown }).status === 404) {
    return "notFound";
  }
  return "failed";
}
