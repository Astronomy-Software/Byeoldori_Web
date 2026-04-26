import { apiFetch, apiUpload } from "./client";
import type {
  UserProfile,
  UpdateUserProfile,
  ProfileImageResponse,
  ChangePasswordRequest,
} from "@/types/api";

export async function getMyProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>("users/me");
}

export async function updateMe(body: UpdateUserProfile): Promise<null> {
  return apiFetch<null>("users/me", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function changePassword(body: ChangePasswordRequest): Promise<null> {
  return apiFetch<null>("users/password-change", {
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
