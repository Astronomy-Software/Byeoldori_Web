import { apiUpload } from "./client";
import type { FileUploadResponse } from "@/types/api";

// 이미지 업로드 (POST /files/image). 백엔드가 url(신) 또는 imageUrl(구)로
// 응답할 수 있으므로 url 필드로 정규화해서 반환한다.
export async function uploadImage(file: File): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiUpload<FileUploadResponse>("files/image", formData);
  return { ...res, url: res.url ?? res.imageUrl ?? "" };
}

// 일반 파일 업로드 (POST /files/upload — 확장자 화이트리스트 + 20MB 제한).
// 응답: { url, filename, size, contentType }
export async function uploadFile(file: File): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiUpload<FileUploadResponse>("files/upload", formData);
  return { ...res, url: res.url ?? res.imageUrl ?? "" };
}
