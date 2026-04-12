import { apiFetch } from "./client";
import type { BaseResponse, ReviewResponse, EducationResponse } from "@/types/api";

export async function getReviewsByObject(
  objectName: string,
): Promise<BaseResponse<ReviewResponse[]>> {
  return apiFetch<BaseResponse<ReviewResponse[]>>(
    `stars/${encodeURIComponent(objectName)}/reviews`,
  );
}

export async function getProgramsByObject(
  objectName: string,
): Promise<BaseResponse<EducationResponse[]>> {
  return apiFetch<BaseResponse<EducationResponse[]>>(
    `stars/${encodeURIComponent(objectName)}/educations`,
  );
}
