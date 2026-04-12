import { apiUpload } from "./client";
import type { FileUploadResponse } from "@/types/api";

export async function uploadImage(file: File): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload<FileUploadResponse>("files/image", formData);
}
