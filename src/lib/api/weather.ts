import { apiFetch } from "./client";
import type { WeatherSummary, UltraForecastItem, ForecastData } from "@/types/api";

export async function getWeatherSummary(lat: number, lon: number): Promise<WeatherSummary> {
  return apiFetch<WeatherSummary>(`weather/summary?lat=${lat}&lon=${lon}`);
}

export async function getLiveWeather(lat: number, lon: number): Promise<UltraForecastItem> {
  return apiFetch<UltraForecastItem>(`weather/live?lat=${lat}&lon=${lon}`);
}

export async function getForecastData(lat: number, lon: number): Promise<ForecastData> {
  return apiFetch<ForecastData>(`weather/ForecastData?lat=${lat}&lon=${lon}`);
}
