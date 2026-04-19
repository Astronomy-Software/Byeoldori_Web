import { apiFetch } from "./client";
import type { WeatherSummary } from "@/types/api";

// GET /weather/summary — 현재 날씨 요약 (lat, lon 필수)
export async function getWeatherSummary(
  lat: number,
  lon: number,
): Promise<WeatherSummary> {
  return apiFetch<WeatherSummary>(`weather/summary?lat=${lat}&lon=${lon}`);
}

// 기존 위치 기반 예보 — WeatherSection이 summary 방식으로 전환됐으므로 레거시
export async function getForecastData(
  lat: number,
  lon: number,
): Promise<WeatherSummary> {
  return apiFetch<WeatherSummary>(
    `weather/ForecastData?lat=${lat}&lon=${lon}`,
  );
}
