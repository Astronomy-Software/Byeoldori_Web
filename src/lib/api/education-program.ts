import { apiFetch } from "./client";
import type { EduStep } from "@/types/education";

// 백엔드 교육 프로그램(MongoDB) API 계약.
// 교육 게시글(community의 EducationPost, MySQL)과는 별개 도메인이다.
// 서버 봉투 {success,message,data}는 apiFetch가 자동 unwrap → caller는 실제 데이터를 받는다.

export type ProgramStatus = "DRAFT" | "PREVIEW" | "PUBLISHED";
export type ProgramDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

// 서버 PageResponse<T>
export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// GET /education/programs (목록) — ProgramSummaryResponse
export interface ProgramSummary {
  id: string;
  title: string;
  difficulty: ProgramDifficulty | null;
  status: ProgramStatus;
  authorName: string | null;
  viewCount: number;
  updatedAt: string | null;
}

// GET /education/programs/{id} (상세) — ProgramDetailResponse
export interface ProgramDetail {
  id: string;
  title: string;
  subtitle: string | null;
  difficulty: ProgramDifficulty | null;
  schemaVersion: number;
  steps: EduStep[];
  status: ProgramStatus;
  authorId: number;
}

export interface CreateProgramRequest {
  title: string;
  subtitle?: string;
  difficulty?: ProgramDifficulty;
  targets?: string[];
  steps?: EduStep[];
}

export type UpdateProgramRequest = Partial<CreateProgramRequest>;

// 기본: PUBLISHED 공개 목록. mine=내 전체 상태, pending=검수 큐(ADMIN).
export function listPrograms(
  opts: { page?: number; size?: number; mine?: boolean; pending?: boolean } = {},
): Promise<Page<ProgramSummary>> {
  const params = new URLSearchParams({
    page: String(opts.page ?? 0),
    size: String(opts.size ?? 20),
  });
  if (opts.mine) params.set("mine", "true");
  if (opts.pending) params.set("pending", "true");
  return apiFetch<Page<ProgramSummary>>(`education/programs?${params}`);
}

export function getProgram(id: string): Promise<ProgramDetail> {
  return apiFetch<ProgramDetail>(`education/programs/${id}`);
}

export function createProgram(req: CreateProgramRequest): Promise<ProgramDetail> {
  return apiFetch<ProgramDetail>("education/programs", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export function updateProgram(
  id: string,
  req: UpdateProgramRequest,
): Promise<ProgramDetail> {
  return apiFetch<ProgramDetail>(`education/programs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(req),
  });
}

// DRAFT → PREVIEW (검수 요청, 작성자)
export function submitProgram(id: string): Promise<ProgramDetail> {
  return apiFetch<ProgramDetail>(`education/programs/${id}/submit`, {
    method: "POST",
  });
}

// PREVIEW → PUBLISHED (moderation ON이면 ADMIN만)
export function publishProgram(id: string): Promise<ProgramDetail> {
  return apiFetch<ProgramDetail>(`education/programs/${id}/publish`, {
    method: "POST",
  });
}

// PREVIEW → DRAFT (ADMIN 반려)
export function rejectProgram(id: string): Promise<ProgramDetail> {
  return apiFetch<ProgramDetail>(`education/programs/${id}/reject`, {
    method: "POST",
  });
}

export function deleteProgram(id: string): Promise<void> {
  return apiFetch<void>(`education/programs/${id}`, { method: "DELETE" });
}

export function incrementProgramView(id: string): Promise<void> {
  return apiFetch<void>(`education/programs/${id}/view`, { method: "POST" });
}
