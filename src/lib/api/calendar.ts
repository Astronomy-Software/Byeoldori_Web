import { apiFetch } from "./client";
import type {
  BaseResponse,
  PlanDetailDto,
  MonthDaySummaryDto,
  CreatePlanRequest,
  UpdatePlanRequest,
  ObservationCountDto,
} from "@/types/api";

export async function getPlanDetail(
  id: number,
): Promise<PlanDetailDto> {
  return apiFetch<PlanDetailDto>(`calendar/events/${id}`);
}

export async function getMonthlySummary(
  year: number,
  month: number,
): Promise<MonthDaySummaryDto[]> {
  return apiFetch<MonthDaySummaryDto[]>(
    `calendar/events/month?year=${year}&month=${month}`,
  );
}

export async function createPlan(
  body: CreatePlanRequest,
): Promise<number> {
  return apiFetch<number>("calendar/events", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getEventsByDate(
  date: string,
): Promise<PlanDetailDto[]> {
  return apiFetch<PlanDetailDto[]>(
    `calendar/events/date?date=${date}`,
  );
}

export async function updatePlan(
  id: number,
  body: UpdatePlanRequest,
): Promise<PlanDetailDto> {
  return apiFetch<PlanDetailDto>(`calendar/events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deletePlan(
  id: number,
): Promise<null> {
  return apiFetch<null>(`calendar/events/${id}`, {
    method: "DELETE",
  });
}

export async function getObservationCount(): Promise<ObservationCountDto> {
  return apiFetch<ObservationCountDto>("calendar/events/count");
}

export async function completeEvent(
  id: number,
  observedAt?: string,
): Promise<PlanDetailDto> {
  const params = observedAt ? `?observedAt=${observedAt}` : "";
  return apiFetch<PlanDetailDto>(
    `calendar/events/${id}/complete${params}`,
    { method: "POST" },
  );
}
