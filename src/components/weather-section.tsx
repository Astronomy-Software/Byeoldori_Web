"use client";

import { useEffect, useState } from "react";
import { getForecastData } from "@/lib/api/weather";
import type { ForecastResponse } from "@/types/api";
import { Cloud, Thermometer, Droplets, Wind } from "lucide-react";

interface WeatherSectionProps {
  lat: number;
  lon: number;
}

export function WeatherSection({ lat, lon }: WeatherSectionProps) {
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getForecastData(lat, lon)
      .then(setData)
      .catch(() => setError(true));
  }, [lat, lon]);

  if (error) {
    return (
      <div className="rounded-xl bg-purple-100/10 p-4 text-sm text-muted-foreground">
        날씨 정보를 가져올 수 없습니다.
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl bg-purple-100/10 p-4">
        <div className="h-20 animate-pulse rounded bg-purple-500/10" />
      </div>
    );
  }

  const current = data.forecasts[0];
  const score = data.suitabilityScore;

  const scoreColor =
    score >= 70 ? "text-success" : score >= 40 ? "text-warning" : "text-error";

  return (
    <div className="rounded-xl bg-purple-100/10 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">현재 날씨</h3>
        <span className={`text-lg font-bold ${scoreColor}`}>
          관측 적합도 {score}점
        </span>
      </div>
      {current && (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-purple-400" />
            <span>온도: {current.temperature}°C</span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-400" />
            <span>습도: {current.humidity}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-gray-400" />
            <span>구름: {current.cloudCover}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-cyan-400" />
            <span>풍속: {current.windSpeed}m/s</span>
          </div>
        </div>
      )}
    </div>
  );
}
