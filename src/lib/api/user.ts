import { apiFetch, apiUpload } from "./client";
import type {
  UserProfile,
  UpdateUserProfile,
  ProfileImageResponse,
} from "@/types/api";

// apiFetch가 { success, message, data } 래퍼를 자동 unwrap하므로
// 반환 타입은 항상 실제 데이터 타입 T로 선언한다

export async function getMyProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>("users/me");
}

export async function updateMe(body: UpdateUserProfile): Promise<null> {
  return apiFetch<null>("users/me", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function resign(): Promise<null> {
  return apiFetch<null>("users/me", { method: "DELETE" });
}

export async function logOut(): Promise<null> {
  return apiFetch<null>("users/logout", { method: "POST" });
}

export async function uploadProfileImage(file: File): Promise<ProfileImageResponse> {
  const formData = new FormData();
  formData.append("image", file);
  return apiUpload<ProfileImageResponse>("users/me/profile-image", formData);
}
