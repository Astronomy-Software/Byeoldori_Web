import { apiFetch, apiUpload } from "./client";
import type {
  ApiResponse,
  UserProfile,
  UpdateUserProfile,
  ProfileImageResponse,
} from "@/types/api";

export async function getMyProfile(): Promise<ApiResponse<UserProfile>> {
  return apiFetch<ApiResponse<UserProfile>>("users/me");
}

export async function updateMe(
  body: UpdateUserProfile,
): Promise<ApiResponse<null>> {
  return apiFetch<ApiResponse<null>>("users/me", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function resign(): Promise<ApiResponse<null>> {
  return apiFetch<ApiResponse<null>>("users/me", { method: "DELETE" });
}

export async function logOut(): Promise<ApiResponse<null>> {
  return apiFetch<ApiResponse<null>>("users/logout", { method: "POST" });
}

export async function uploadProfileImage(
  file: File,
): Promise<ApiResponse<ProfileImageResponse>> {
  const formData = new FormData();
  formData.append("image", file);
  return apiUpload<ApiResponse<ProfileImageResponse>>(
    "users/me/profile-image",
    formData,
  );
}
