import { apiFetch } from "./client";
import { collectPages } from "./paginate";
import type {
  ObservationSite,
  ObservationSiteDetail,
  ObservationSitePage,
  ObservationSiteRegisterRequest,
  ObservationSiteUpdateRequest,
} from "@/types/api";

const SITES_PAGE_SIZE = 100;

// GET /observationsites 는 페이지 응답(기본 20개, 이름순)이라 마지막 페이지까지 모두 받아 합친다.
export async function getAllSites(): Promise<ObservationSite[]> {
  const { items } = await collectPages((page) =>
    apiFetch<ObservationSitePage>(
      `observationsites?page=${page}&size=${SITES_PAGE_SIZE}`,
    ),
  );
  return items;
}

// GET /observationsites/name?keyword= — 이름으로 관측지 검색
export async function getSitesByKeyword(
  keyword: string,
): Promise<ObservationSite[]> {
  return apiFetch<ObservationSite[]>(
    `observationsites/name?keyword=${encodeURIComponent(keyword)}`,
  );
}

// GET /observationsites/{id} — ID로 단건 조회
export async function getSiteById(
  id: number,
): Promise<ObservationSiteDetail> {
  return apiFetch<ObservationSiteDetail>(`observationsites/${id}`);
}

export async function registerSite(
  body: ObservationSiteRegisterRequest,
): Promise<ObservationSite> {
  return apiFetch<ObservationSite>("observationsites", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateSite(
  id: number,
  body: ObservationSiteUpdateRequest,
): Promise<ObservationSite> {
  return apiFetch<ObservationSite>(`observationsites/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteSite(id: number): Promise<void> {
  await apiFetch(`observationsites/${id}`, { method: "DELETE" });
}
