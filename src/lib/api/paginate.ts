import type { PageResponse } from "@/types/api";

export interface CollectPagesOptions<T> {
  // 안전장치: 서버가 비정상 totalPages를 주더라도 이 이상은 요청하지 않는다.
  maxPages?: number;
  // 모을 항목만 남긴다(기본: 전부).
  keep?: (item: T) => boolean;
  // 모은 항목이 충분하면 남은 페이지를 더 받지 않는다.
  enough?: (kept: T[]) => boolean;
}

export interface CollectPagesResult<T> {
  items: T[];
  // 마지막 페이지까지 다 읽었거나 enough를 만족했으면 true, maxPages에 걸려 끊겼으면 false.
  complete: boolean;
}

// 0페이지부터 totalPages까지 순서대로 받아 content를 이어붙인다.
export async function collectPages<T>(
  fetchPage: (page: number) => Promise<PageResponse<T>>,
  opts: CollectPagesOptions<T> = {},
): Promise<CollectPagesResult<T>> {
  const maxPages = opts.maxPages ?? 50;
  const items: T[] = [];
  for (let page = 0; page < maxPages; page++) {
    const res = await fetchPage(page);
    const content = res.content ?? [];
    for (const item of content) {
      if (!opts.keep || opts.keep(item)) items.push(item);
    }
    if (opts.enough?.(items)) return { items, complete: true };
    const lastPage = content.length === 0 || page >= (res.totalPages ?? 0) - 1;
    if (lastPage) return { items, complete: true };
  }
  return { items, complete: false };
}
