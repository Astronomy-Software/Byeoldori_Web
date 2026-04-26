"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Star, Heart, MessageSquare, MapPin,
  Thermometer, Droplets, Wind, ThumbsUp,
  Sun, CloudSun, Cloud, CloudMoon, CloudRainWind, Snowflake, Droplet,
} from "lucide-react";
import { getSiteById } from "@/lib/api/observation-sites";
import { getWeatherSummary, getForecastData } from "@/lib/api/weather";
import { getReviewPosts } from "@/lib/api/community";
import type {
  ObservationSiteDetail,
  WeatherSummary,
  ForecastData,
  PostSummary,
} from "@/types/api";

// lucide 날씨 아이콘 (피그마 기준: sun / cloud-sun / cloud / cloud-rain-wind / snowflake)
function WeatherIcon({ sky, pty, className = "h-7 w-7" }: { sky: number | string; pty: number | string; className?: string }) {
  const p = Number(pty);
  const s = Number(sky);
  if (p === 1 || p === 5) return <CloudRainWind className={className} />;
  if (p === 2 || p === 6) return <CloudRainWind className={className} />;
  if (p === 3 || p === 7) return <Snowflake className={className} />;
  if (s === 1) return <Sun className={className} />;
  if (s === 3) return <CloudSun className={className} />;
  return <Cloud className={className} />;
}

function WeatherIconMid({ sky, pre, className = "h-7 w-7" }: { sky: string; pre: string; className?: string }) {
  if (pre.includes("RAIN")) return <CloudRainWind className={className} />;
  if (pre.includes("SNOW")) return <Snowflake className={className} />;
  if (sky === "WB01") return <Sun className={className} />;
  if (sky === "WB02") return <CloudSun className={className} />;
  if (sky === "WB03") return <CloudMoon className={className} />;
  return <Cloud className={className} />;
}

function suitColor(n: number): string {
  if (n >= 70) return "#6effa6";
  if (n >= 40) return "#facc15";
  return "#f87171";
}

function formatHour(tmef: string): string {
  const h = tmef.slice(8, 10);
  const m = tmef.slice(10, 12);
  return m === "00" ? `${h}시` : `${h}:${m}`;
}

function formatDateLabel(s: string): string {
  return `${s.slice(4, 6)}/${s.slice(6, 8)}`;
}

type HourlyItem = {
  time: string;
  sky: number;
  pty: number;
  temp: number;
  pop: number;
  suit: number;
};

type DayRow =
  | { label: string; pop: number; max: number; min: number; suit: number; kind: "short"; sky: number; pty: number }
  | { label: string; pop: number; max: number; min: number; suit: number; kind: "mid"; skyCode: string; pre: string };

export default function ObservatoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [site, setSite] = useState<ObservationSiteDetail | null>(null);
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [reviews, setReviews] = useState<PostSummary[]>([]);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const doGeocode = useCallback((lat: number, lng: number) => {
    if (!window.naver?.maps?.Service) return;
    window.naver.maps.Service.reverseGeocode(
      { coords: new window.naver.maps.LatLng(lat, lng) },
      (status, res) => {
        if (status === window.naver.maps.Service.Status.ERROR) return;
        const r = res.v2.results[0];
        if (!r) return;
        const { area1, area2, area3 } = r.region;
        const road = r.land?.addition0?.value;
        setAddress([area1.name, area2.name, area3.name, road].filter(Boolean).join(" "));
      },
    );
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getSiteById(id)
      .then((data) => {
        setSite(data);
        setLoading(false);

        Promise.all([
          getWeatherSummary(data.latitude, data.longitude),
          getForecastData(data.latitude, data.longitude),
        ])
          .then(([w, f]) => { setWeather(w); setForecast(f); })
          .catch(() => {});

        getReviewPosts(0, 20, "LATEST")
          .then((r) => setReviews(r.content.filter((p) => p.observationSiteId === id)))
          .catch(() => {});

        const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
        if (!clientId) return;
        const existing = document.getElementById("naver-map-script");
        if (existing && window.naver?.maps?.Service) {
          doGeocode(data.latitude, data.longitude);
        } else if (!existing) {
          const script = document.createElement("script");
          script.id = "naver-map-script";
          script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&ncpClientId=${clientId}&submodules=geocoder`;
          script.onload = () => doGeocode(data.latitude, data.longitude);
          document.head.appendChild(script);
        } else {
          existing.addEventListener("load", () => doGeocode(data.latitude, data.longitude), { once: true });
        }
      })
      .catch(() => setLoading(false));
  }, [id, doGeocode]);

  // 시간별 예보 (ultra + short 앞 16개)
  const hourlyItems: HourlyItem[] = [
    ...(forecast?.ultraForecastResponse ?? []).map((u) => ({
      time: formatHour(u.tmef),
      sky: u.sky,
      pty: u.pty,
      temp: u.t1h,
      pop: Math.min(Math.round(u.rn1 * 10), 100),
      suit: u.suitability,
    })),
    ...(forecast?.shortForecastResponse ?? []).slice(0, 16).map((s) => ({
      time: formatHour(s.tmef),
      sky: s.sky,
      pty: s.pty,
      temp: s.tmp,
      pop: s.pop,
      suit: s.suitability,
    })),
  ];

  // 일별 예보 (short 날짜그룹 + mid)
  const dayRows: DayRow[] = (() => {
    if (!forecast) return [];
    const rows: DayRow[] = [];
    const seen = new Set<string>();

    const byDate: Record<string, { tmp: number[]; pop: number[]; suit: number[]; sky: number[]; pty: number[] }> = {};
    for (const item of forecast.shortForecastResponse) {
      const date = item.tmef.slice(0, 8);
      if (!byDate[date]) byDate[date] = { tmp: [], pop: [], suit: [], sky: [], pty: [] };
      byDate[date].tmp.push(item.tmp);
      byDate[date].pop.push(item.pop);
      byDate[date].suit.push(item.suitability);
      byDate[date].sky.push(item.sky);
      byDate[date].pty.push(item.pty);
    }
    for (const [date, d] of Object.entries(byDate)) {
      const label = formatDateLabel(date);
      seen.add(label);
      rows.push({
        kind: "short",
        label,
        pop: Math.max(...d.pop),
        sky: Math.round(d.sky.reduce((a, b) => a + b, 0) / d.sky.length),
        pty: Math.max(...d.pty),
        max: Math.max(...d.tmp),
        min: Math.min(...d.tmp),
        suit: Math.round(d.suit.reduce((a, b) => a + b, 0) / d.suit.length),
      });
    }

    for (const item of forecast.midCombinedForecastDTO) {
      const label = formatDateLabel(item.tmEf.slice(0, 8));
      if (!seen.has(label)) {
        seen.add(label);
        rows.push({
          kind: "mid",
          label,
          pop: item.rnSt,
          skyCode: item.sky,
          pre: item.pre,
          max: item.max,
          min: item.min,
          suit: item.suitability,
        });
      }
    }
    return rows;
  })();

  // ultra 첫 번째 항목에서 습도·바람 추출
  const latestUltra = forecast?.ultraForecastResponse[0];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
        <p className="text-muted-foreground">관측지를 찾을 수 없습니다.</p>
        <button onClick={() => router.back()} className="text-sm text-purple-400">
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-full p-1.5 transition-colors hover:bg-card"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{site.name}</h1>
      </div>

      {/* 썸네일 + 기본 정보 카드 */}
      <div className="overflow-hidden rounded-2xl bg-card/50">
        <img
          src="/byeoldori.png"
          alt={site.name}
          className="aspect-video w-full object-cover"
        />
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-yellow-400">
              <Star className="h-4 w-4 fill-yellow-400" />
              {site.averageScore > 0 ? site.averageScore.toFixed(1) : "—"}
            </span>
            <span className="text-muted-foreground">리뷰 {site.reviewCount}개</span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Heart className="h-3.5 w-3.5" /> {site.totalLikes}
            </span>
          </div>
          {address && (
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-400" />
              <span>{address}</span>
            </div>
          )}
        </div>
      </div>

      {/* 현재 날씨 2×2 (피그마: 기온 / 습도 / 바람 / 관측 적합도) */}
      {weather && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-foreground">해당 위치의 현재 날씨</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-2 rounded-xl bg-card/50 p-3">
              <div className="flex items-center gap-2 text-foreground">
                <Thermometer className="h-5 w-5 text-orange-400" />
                <span className="text-sm font-semibold">기온</span>
              </div>
              <p className="text-lg font-bold text-foreground">{weather.temperature}°</p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl bg-card/50 p-3">
              <div className="flex items-center gap-2 text-foreground">
                <Droplets className="h-5 w-5 text-blue-400" />
                <span className="text-sm font-semibold">습도</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                {latestUltra ? `${latestUltra.reh}%` : "—"}
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl bg-card/50 p-3">
              <div className="flex items-center gap-2 text-foreground">
                <Wind className="h-5 w-5 text-cyan-400" />
                <span className="text-sm font-semibold">바람</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                {latestUltra ? `${latestUltra.wsd}m/s` : "—"}
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl bg-card/50 p-3">
              <div className="flex items-center gap-2 text-foreground">
                <ThumbsUp className="h-5 w-5 text-green-400" />
                <span className="text-sm font-semibold">관측 적합도</span>
              </div>
              <p className="text-lg font-bold" style={{ color: suitColor(weather.suitability) }}>
                {weather.suitability}점
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 시간별 예보 */}
      {hourlyItems.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-foreground">시간별 예보</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {hourlyItems.map((item, i) => (
              <div
                key={i}
                className="flex min-w-[60px] shrink-0 flex-col items-center gap-1.5 rounded-xl bg-card/50 px-2 py-2.5 text-center"
              >
                <span className="text-xs text-muted-foreground">{item.time}</span>
                <WeatherIcon sky={item.sky} pty={item.pty} className="h-6 w-6 text-foreground" />
                <span className="text-xs font-medium text-foreground">{item.temp}°</span>
                <div className="flex items-center gap-0.5 text-xs text-blue-400">
                  <Droplet className="h-3 w-3" />
                  {item.pop}%
                </div>
                <div
                  className="h-1.5 w-8 rounded-full"
                  style={{ background: suitColor(item.suit) }}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 일간 예보 */}
      {dayRows.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-foreground">일간 예보</h2>
          <div className="overflow-hidden rounded-xl bg-card/50">
            {dayRows.map((row, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3 ${
                  i < dayRows.length - 1 ? "border-b border-border/30" : ""
                }`}
              >
                <span className="w-10 shrink-0 text-xs text-muted-foreground">{row.label}</span>
                <div className="flex w-10 shrink-0 items-center gap-0.5 text-xs text-blue-400">
                  <Droplet className="h-3 w-3" />
                  {row.pop}%
                </div>
                <div className="shrink-0 text-foreground">
                  {row.kind === "short"
                    ? <WeatherIcon sky={row.sky} pty={row.pty} className="h-5 w-5" />
                    : <WeatherIconMid sky={row.skyCode} pre={row.pre} className="h-5 w-5" />
                  }
                </div>
                <span className="flex-1 text-xs">
                  <span className="text-red-400">{row.max}°</span>
                  <span className="text-muted-foreground"> / </span>
                  <span className="text-blue-400">{row.min}°</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-8 rounded-full" style={{ background: suitColor(row.suit) }} />
                  <span className="text-xs font-medium" style={{ color: suitColor(row.suit) }}>
                    {row.suit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 관측 리뷰 */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">해당 관측지에서 진행한 관측후기</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">아직 리뷰가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {reviews.map((post) => (
              <Link
                key={post.id}
                href={`/community/review/${post.id}`}
                className="overflow-hidden rounded-xl bg-card/50 transition-colors hover:bg-card"
              >
                <img
                  src={post.thumbnailUrl ?? "/byeoldori.png"}
                  alt={post.title}
                  className="aspect-square w-full object-cover"
                />
                <div className="p-2">
                  <p className="line-clamp-2 text-xs font-medium text-foreground">{post.title}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate">{post.authorNickname}</span>
                    {post.score != null && (
                      <span className="ml-1 flex shrink-0 items-center gap-0.5 text-yellow-400">
                        <Star className="h-3 w-3 fill-yellow-400" />
                        {post.score.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Heart className="h-3 w-3" /> {post.likeCount}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <MessageSquare className="h-3 w-3" /> {post.commentCount}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
