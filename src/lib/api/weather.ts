import { apiFetch } from "./client";
import type { ForecastResponse } from "@/types/api";

export async function getForecastData(
  lat: number,
  lon: number,
): Promise<ForecastResponse> {
  return apiFetch<ForecastResponse>(
    `weather/ForecastData?lat=${lat}&lon=${lon}`,
  );
}
