// 에디터 노드/링크에 들어오는 URL의 스킴을 검증한다.
//
// 왜 필요한가: content는 Lexical JSON으로 저장돼 dangerouslySetInnerHTML은 안 쓰지만,
// 링크·첨부·이미지의 href/src는 "정상 데이터"로서 저장·역직렬화된다. javascript:/data:
// 스킴이 섞이면 뷰어에서 클릭 시 실행되는 XSS가 된다. 저장(입력)·렌더(역직렬화) 양쪽에서 막는다.
//
// @lexical/link 의 LinkNode 는 자체 sanitizeUrl 로 렌더를 중화하지만, 커스텀 노드
// (ImageNode/FileNode)는 그렇지 않으므로 여기서 공통으로 강제한다.

const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

/** 허용 스킴이면 true. 상대경로(스킴 없음)는 현재 origin 기준이라 허용. */
export function isSafeUrl(raw: string): boolean {
  const url = (raw ?? "").trim();
  if (!url) return false;
  try {
    // base 를 주면 상대경로도 절대화되어 protocol 을 얻는다.
    const u = new URL(url, "https://byeoldori.com");
    return SAFE_PROTOCOLS.has(u.protocol);
  } catch {
    return false;
  }
}

/** 안전하면 원본 URL, 아니면 대체값("#")을 반환한다. href/src 렌더에 사용. */
export function safeUrl(raw: string, fallback = "#"): string {
  return isSafeUrl(raw) ? raw.trim() : fallback;
}
