// 커뮤니티 목록의 탭·페이지·검색어를 URL 쿼리(?tab=free&page=2&q=...)와 맞춘다.
// URL에 두면 홈의 '더보기'가 원하는 탭을 열 수 있고, 글에서 뒤로 와도 위치가 유지된다.

export const COMMUNITY_TABS = ["review", "program", "free"] as const;
export type CommunityTab = (typeof COMMUNITY_TABS)[number];

export const DEFAULT_COMMUNITY_TAB: CommunityTab = "review";

export interface CommunityQuery {
  tab: CommunityTab;
  page: number; // 0-based (URL에는 1-based로 쓴다)
  keyword: string;
}

interface ParamsLike {
  get(name: string): string | null;
}

export function isCommunityTab(v: unknown): v is CommunityTab {
  return (
    typeof v === "string" && (COMMUNITY_TABS as readonly string[]).includes(v)
  );
}

export function parseCommunityQuery(params: ParamsLike): CommunityQuery {
  const rawTab = params.get("tab");
  const tab = isCommunityTab(rawTab) ? rawTab : DEFAULT_COMMUNITY_TAB;
  const rawPage = Number(params.get("page"));
  const page =
    Number.isInteger(rawPage) && rawPage >= 1 ? rawPage - 1 : 0;
  const keyword = (params.get("q") ?? "").trim();
  return { tab, page, keyword };
}

export function buildCommunityQuery(q: CommunityQuery): string {
  const params = new URLSearchParams();
  if (q.tab !== DEFAULT_COMMUNITY_TAB) params.set("tab", q.tab);
  if (q.page > 0) params.set("page", String(q.page + 1));
  const keyword = q.keyword.trim();
  if (keyword) params.set("q", keyword);
  return params.toString();
}

export function communityHref(tab: CommunityTab): string {
  const qs = buildCommunityQuery({ tab, page: 0, keyword: "" });
  return qs ? `/community?${qs}` : "/community";
}
