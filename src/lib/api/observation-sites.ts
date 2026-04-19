import { apiFetch } from "./client";
import type {
  ObservationSite,
  ObservationSitePage,
  ObservationSiteRegisterRequest,
  ObservationSiteUpdateRequest,
  ObservationSitesRecommendRequest,
} from "@/types/api";

// 서버가 Page 구조({ content, totalPages, ... })로 반환
export async function getAllSites(): Promise<ObservationSitePage> {
  return apiFetch<ObservationSitePage>("observationsites");
}

export async function getSiteByName(
  name: string,
): Promise<ObservationSite[]> {
  return apiFetch<ObservationSite[]>(
    `observationsites/${encodeURIComponent(name)}`,
  );
}

export async function registerSite(
  body: ObservationSiteRegisterRequest,
): Promise<ObservationSite> {
  return apiFetch<ObservationSite>("observationsites", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function recommendSites(
  body: ObservationSitesRecommendRequest,
): Promise<ObservationSite[]> {
  return apiFetch<ObservationSite[]>("observationsites/recommend", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateSite(
  name: string,
  body: ObservationSiteUpdateRequest,
): Promise<ObservationSite> {
  return apiFetch<ObservationSite>(
    `observationsites/${encodeURIComponent(name)}`,
    { method: "PUT", body: JSON.stringify(body) },
  );
}

export async function deleteSite(name: string): Promise<void> {
  await apiFetch(`observationsites/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
}
