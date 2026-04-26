import { apiFetch } from "./client";
import type {
  ObservationSite,
  ObservationSiteDetail,
  ObservationSitePage,
  ObservationSiteRegisterRequest,
  ObservationSiteUpdateRequest,
} from "@/types/api";

export async function getAllSites(): Promise<ObservationSitePage> {
  return apiFetch<ObservationSitePage>("observationsites");
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
