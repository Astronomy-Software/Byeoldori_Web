// 관측 리뷰의 '관측지 이름' 입력을 등록된 관측지와 연결한다.
// 서버는 review.observationSiteId가 있어야 관측지별 리뷰 수·평점·목록에 반영한다.

interface SiteLike {
  id: number;
  name: string;
}

function normalizeSiteName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

// 이름이 정확히 같은(공백·대소문자 무시) 관측지만 연결한다. 애매하면 연결하지 않는다.
export function findSiteByExactName<T extends SiteLike>(
  sites: readonly T[],
  name: string,
): T | undefined {
  const target = normalizeSiteName(name);
  if (!target) return undefined;
  const matches = sites.filter((s) => normalizeSiteName(s.name) === target);
  return matches.length === 1 ? matches[0] : undefined;
}
