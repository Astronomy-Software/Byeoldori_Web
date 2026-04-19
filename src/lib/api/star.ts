import { apiFetch } from "./client";
import type { BaseResponse, ReviewResponse, EducationResponse } from "@/types/api";

export async function getReviewsByObject(
  objectName: string,
): Promise<ReviewResponse[]> {
  return apiFetch<ReviewResponse[]>(
    `stars/${encodeURIComponent(objectName)}/reviews`,
  );
}

export async function getProgramsByObject(
  objectName: string,
): Promise<EducationResponse[]> {
  return apiFetch<EducationResponse[]>(
    `stars/${encodeURIComponent(objectName)}/educations`,
  );
}
