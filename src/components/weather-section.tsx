"use client";

import { useEffect, useState } from "react";
import { getWeatherSummary } from "@/lib/api/weather";
import type { WeatherSummary } from "@/types/api";
import { Cloud, Thermometer, Star, AlertCircle } from "lucide-react";

interface WeatherSectionProps {
  lat: number;
  lon: number;
}

export function WeatherSection({ lat, lon }: WeatherSectionProps) {
  const [data, setData] = useState<WeatherSummary | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getWeatherSummary(lat, lon)
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

  // 기상청 API에서 데이터를 못 가져온 경우 (sky가 "정보없음" 또는 temperature null)
  const hasNoData = data.sky === "정보없음" || data.temperature === null;
  if (hasNoData) {
    return (
      <div className="rounded-xl bg-purple-100/10 p-4 flex items-center gap-2 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>현재 위치의 날씨 정보를 가져올 수 없습니다.</span>
      </div>
    );
  }

  const scoreColor =
    data.suitability >= 70
      ? "text-success"
      : data.suitability >= 40
        ? "text-warning"
        : "text-error";

  return (
    <div className="rounded-xl bg-purple-100/10 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">현재 날씨</h3>
        <span className={`text-lg font-bold ${scoreColor}`}>
          관측 적합도 {data.suitability}점
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-purple-400" />
          <span>온도: {data.temperature}°C</span>
        </div>
        <div className="flex items-center gap-2">
          <Cloud className="h-4 w-4 text-blue-400" />
          <span>{data.sky}</span>
        </div>
        {data.nextGoodTime && (
          <div className="col-span-2 flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-400" />
            <span>다음 좋은 관측 시각: {data.nextGoodTime}</span>
          </div>
        )}
      </div>
    </div>
  );
}
