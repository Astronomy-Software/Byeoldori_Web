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
): Promise<BaseResponse<PlanDetailDto>> {
  return apiFetch<BaseResponse<PlanDetailDto>>(`calendar/events/${id}`);
}

export async function getMonthlySummary(
  year: number,
  month: number,
): Promise<BaseResponse<MonthDaySummaryDto[]>> {
  return apiFetch<BaseResponse<MonthDaySummaryDto[]>>(
    `calendar/events/month?year=${year}&month=${month}`,
  );
}

export async function createPlan(
  body: CreatePlanRequest,
): Promise<BaseResponse<number>> {
  return apiFetch<BaseResponse<number>>("calendar/events", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getEventsByDate(
  date: string,
): Promise<BaseResponse<PlanDetailDto[]>> {
  return apiFetch<BaseResponse<PlanDetailDto[]>>(
    `calendar/events/date?date=${date}`,
  );
}

export async function updatePlan(
  id: number,
  body: UpdatePlanRequest,
): Promise<BaseResponse<PlanDetailDto>> {
  return apiFetch<BaseResponse<PlanDetailDto>>(`calendar/events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deletePlan(
  id: number,
): Promise<BaseResponse<null>> {
  return apiFetch<BaseResponse<null>>(`calendar/events/${id}`, {
    method: "DELETE",
  });
}

export async function getObservationCount(): Promise<
  BaseResponse<ObservationCountDto>
> {
  return apiFetch<BaseResponse<ObservationCountDto>>("calendar/events/count");
}

export async function completeEvent(
  id: number,
  observedAt?: string,
): Promise<BaseResponse<PlanDetailDto>> {
  const params = observedAt ? `?observedAt=${observedAt}` : "";
  return apiFetch<BaseResponse<PlanDetailDto>>(
    `calendar/events/${id}/complete${params}`,
    { method: "POST" },
  );
}
