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
      <div className="glass rounded-2xl p-5 flex items-center gap-2 text-sm text-text-tertiary">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>날씨 정보를 가져올 수 없습니다.</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-surface-2" />
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="h-20 animate-pulse rounded-xl bg-surface-2" />
          <div className="h-20 animate-pulse rounded-xl bg-surface-2" />
        </div>
      </div>
    );
  }

  // 기상청 API에서 데이터를 못 가져온 경우 (sky가 "정보없음" 또는 temperature null)
  const hasNoData = data.sky === "정보없음" || data.temperature === null;
  if (hasNoData) {
    return (
      <div className="glass rounded-2xl p-5 flex items-center gap-2 text-sm text-text-tertiary">
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
    <div className="glass glow-primary rounded-2xl p-6">
      {/* 적합도 히어로 */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">
            오늘 밤 관측 적합도
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`font-mono text-5xl font-bold leading-none ${scoreColor}`}>
              {data.suitability}
            </span>
            <span className="font-mono text-lg text-text-secondary">점</span>
            <span className={`ml-1 text-sm font-medium ${scoreColor}`}>
              · {data.suitability >= 70 ? "좋음" : data.suitability >= 40 ? "보통" : "나쁨"}
            </span>
          </div>
        </div>
        <div className="twinkle hidden h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface-2 text-aurora sm:flex">
          <Star className="h-6 w-6" />
        </div>
      </div>

      {/* 계기판 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border-default bg-surface-1 p-3">
          <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
            <Thermometer className="h-3.5 w-3.5 text-interactive-link" /> 기온
          </div>
          <p className="mt-1.5 font-mono text-2xl text-text-primary">
            {data.temperature}
            <span className="ml-0.5 text-base text-text-secondary">°C</span>
          </p>
        </div>
        <div className="rounded-xl border border-border-default bg-surface-1 p-3">
          <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
            <Cloud className="h-3.5 w-3.5 text-interactive-link" /> 하늘 상태
          </div>
          <p className="mt-1.5 text-2xl font-medium text-text-primary">{data.sky}</p>
        </div>
      </div>

      {data.nextGoodTime && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-border-default bg-surface-1 p-3">
          <Star className="h-4 w-4 shrink-0 text-aurora" />
          <span className="text-sm text-text-secondary">다음 좋은 관측 시각</span>
          <span className="ml-auto font-mono text-sm text-aurora">
            {data.nextGoodTime}
          </span>
        </div>
      )}
    </div>
  );
}
