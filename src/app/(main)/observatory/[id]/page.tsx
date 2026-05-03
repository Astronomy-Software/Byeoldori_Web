"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Star, Heart, MessageSquare, MapPin,
  Thermometer, Droplets, Wind, Gauge,
  Sun, CloudSun, Cloud, CloudRain, Snowflake, Droplet,
} from "lucide-react";
import { getSiteById } from "@/lib/api/observation-sites";
import { getLiveWeather, getForecastData } from "@/lib/api/weather";
import { getReviewPosts } from "@/lib/api/community";
import type {
  ObservationSiteDetail,
  UltraForecastItem,
  ForecastData,
  PostSummary,
} from "@/types/api";

function WeatherIcon({ sky, pty, className = "h-6 w-6" }: { sky: number; pty: number; className?: string }) {
  if (pty === 1 || pty === 2 || pty === 5 || pty === 6) return <CloudRain className={className} />;
  if (pty === 3 || pty === 7) return <Snowflake className={className} />;
  if (sky === 1) return <Sun className={className} />;
  if (sky === 3) return <CloudSun className={className} />;
  return <Cloud className={className} />;
}

function WeatherIconMid({ sky, pre, className = "h-5 w-5" }: { sky: string; pre: string; className?: string }) {
  if (pre === "WB09" || pre === "WB11" || pre === "WB13") return <CloudRain className={className} />;
  if (pre === "WB12") return <Snowflake className={className} />;
  if (sky === "WB01") return <Sun className={className} />;
  if (sky === "WB02") return <CloudSun className={className} />;
  return <Cloud className={className} />;
}

function suitColor(n: number): string {
  if (n >= 70) return "#6effa6";
  if (n >= 40) return "#facc15";
  return "#f87171";
}

function suitLabel(n: number): string {
  if (n >= 70) return "관측 가능";
  if (n >= 40) return "보통";
  return "관측 어려움";
}

function skyText(sky: number): string {
  if (sky === 1) return "맑음";
  if (sky === 3) return "구름조금";
  if (sky === 4) return "흐림";
  return "구름많음";
}

function formatHM(tmef: string): string {
  const h = tmef.slice(8, 10);
  const m = tmef.slice(10, 12);
  return m === "00" ? `${h}시` : `${h}:${m}`;
}

function fmtDate(s: string): string {
  return `${s.slice(4, 6)}/${s.slice(6, 8)}`;
}

type HourlyItem = {
  tmef: string;
  sky: number;
  pty: number;
  temp: number;
  pop: number;
  suit: number;
};

export default function ObservatoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [site, setSite] = useState<ObservationSiteDetail | null>(null);
  const [live, setLive] = useState<UltraForecastItem | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
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

        setForecastLoading(true);
        Promise.all([
          getLiveWeather(data.latitude, data.longitude),
          getForecastData(data.latitude, data.longitude),
        ])
          .then(([lw, f]) => { setLive(lw); setForecast(f); })
          .catch(() => {})
          .finally(() => setForecastLoading(false));

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

  // 시간별 예보 (ultra + short 합산)
  const hourlyItems: HourlyItem[] = [
    ...(forecast?.ultraForecastResponse ?? []).map((u) => ({
      tmef: u.tmef,
      sky: u.sky,
      pty: u.pty,
      temp: u.t1h,
      pop: Math.min(Math.round((u.rn1 ?? 0) * 10), 100),
      suit: u.suitability,
    })),
    ...(forecast?.shortForecastResponse ?? []).map((s) => ({
      tmef: s.tmef,
      sky: s.sky,
      pty: s.pty,
      temp: s.tmp,
      pop: s.pop ?? 0,
      suit: s.suitability,
    })),
  ];

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
        <button onClick={() => router.back()} className="text-sm text-purple-400">돌아가기</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-8">
      {/* ── 헤더 ── */}
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-background/80 px-4 py-3 backdrop-blur-sm">
        <button
          onClick={() => router.back()}
          className="rounded-full p-1.5 transition-colors hover:bg-card"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">{site.name}</h1>
      </div>

      <div className="space-y-5 px-4">
        {/* ── 1. 관측지 사진 + 기본 정보 ── */}
        <div className="overflow-hidden rounded-2xl bg-card/50">
          <img
            src="/byeoldori.png"
            alt={site.name}
            className="aspect-video w-full object-cover"
          />
          <div className="space-y-3 p-4">
            {/* 평점 / 리뷰수 / 좋아요 */}
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
            {/* 주소 */}
            {address && (
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-400" />
                <span>{address}</span>
              </div>
            )}
            {/* 현재 관측 적합도 배지 */}
            {live && (
              <div
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: `${suitColor(live.suitability)}22`, color: suitColor(live.suitability) }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: suitColor(live.suitability) }} />
                현재 관측 적합도 {live.suitability}점 — {suitLabel(live.suitability)}
              </div>
            )}
          </div>
        </div>

        {/* ── 2. 현재 날씨 ── */}
        {(forecastLoading || live) && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-foreground">현재 날씨</h2>
            {forecastLoading && !live ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl bg-card/50" />
                ))}
              </div>
            ) : live ? (
              <>
                {/* 하늘 상태 한 줄 */}
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <WeatherIcon sky={live.sky} pty={live.pty} className="h-4 w-4" />
                  <span>{skyText(live.sky)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-2 rounded-xl bg-card/50 p-3">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-orange-400" />
                      <span className="text-xs text-muted-foreground">기온</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">{live.t1h}°</p>
                  </div>
                  <div className="flex flex-col gap-2 rounded-xl bg-card/50 p-3">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-blue-400" />
                      <span className="text-xs text-muted-foreground">습도</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">{live.reh}%</p>
                  </div>
                  <div className="flex flex-col gap-2 rounded-xl bg-card/50 p-3">
                    <div className="flex items-center gap-2">
                      <Wind className="h-4 w-4 text-cyan-400" />
                      <span className="text-xs text-muted-foreground">바람</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">{live.wsd}m/s</p>
                  </div>
                  <div className="flex flex-col gap-2 rounded-xl bg-card/50 p-3">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-green-400" />
                      <span className="text-xs text-muted-foreground">관측 적합도</span>
                    </div>
                    <p className="text-xl font-bold" style={{ color: suitColor(live.suitability) }}>
                      {live.suitability}점
                    </p>
                  </div>
                </div>
              </>
            ) : null}
          </section>
        )}

        {/* ── 3. 시간별 예보 (초단기 + 단기, 날짜 구분) ── */}
        {(forecastLoading || hourlyItems.length > 0) && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-foreground">시간별 예보</h2>
            {forecastLoading && hourlyItems.length === 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-28 min-w-[60px] shrink-0 animate-pulse rounded-xl bg-card/50" />
                ))}
              </div>
            ) : (
              <div className="flex items-end gap-2 overflow-x-auto pb-2">
                {hourlyItems.flatMap((item, i) => {
                  const thisDate = item.tmef.slice(0, 8);
                  const prevDate = i > 0 ? hourlyItems[i - 1].tmef.slice(0, 8) : null;
                  const newDay = i > 0 && thisDate !== prevDate;
                  const elements = [];

                  if (newDay) {
                    elements.push(
                      <div
                        key={`sep-${i}`}
                        className="flex shrink-0 flex-col items-center self-stretch justify-center gap-1 px-0.5"
                      >
                        <div className="w-px flex-1 bg-white/10" />
                        <span
                          className="rounded-full bg-indigo-900/50 px-1.5 py-0.5 text-[10px] text-indigo-300"
                          style={{ writingMode: "vertical-lr", transform: "rotate(180deg)" }}
                        >
                          {fmtDate(thisDate)}
                        </span>
                        <div className="w-px flex-1 bg-white/10" />
                      </div>,
                    );
                  }

                  elements.push(
                    <div
                      key={i}
                      className="flex min-w-[60px] shrink-0 flex-col items-center gap-1.5 rounded-xl bg-card/50 px-2 py-2.5 text-center"
                    >
                      <span className="text-xs text-muted-foreground">{formatHM(item.tmef)}</span>
                      <WeatherIcon sky={item.sky} pty={item.pty} className="h-6 w-6 text-foreground" />
                      <span className="text-xs font-medium text-foreground">{item.temp}°</span>
                      <div className="flex items-center gap-0.5 text-xs text-blue-400">
                        <Droplet className="h-3 w-3" />{item.pop}%
                      </div>
                      <div
                        className="h-1.5 w-8 rounded-full"
                        style={{ background: suitColor(item.suit) }}
                      />
                    </div>,
                  );
                  return elements;
                })}
              </div>
            )}
          </section>
        )}

        {/* ── 4. 중기 예보 ── */}
        {(forecastLoading || (forecast?.midCombinedForecastDTO?.length ?? 0) > 0) && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-foreground">중기 예보</h2>
            {forecastLoading && !forecast ? (
              <div className="space-y-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-card/50" />
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl bg-card/50">
                {(forecast?.midCombinedForecastDTO ?? []).map((item, i, arr) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-4 py-3 ${
                      i < arr.length - 1 ? "border-b border-border/30" : ""
                    }`}
                  >
                    <span className="w-10 shrink-0 text-xs text-muted-foreground">
                      {fmtDate(item.tmEf.slice(0, 8))}
                    </span>
                    <div className="flex w-10 shrink-0 items-center gap-0.5 text-xs text-blue-400">
                      <Droplet className="h-3 w-3" />{item.rnSt ?? 0}%
                    </div>
                    <div className="shrink-0 text-foreground">
                      <WeatherIconMid sky={item.sky ?? ""} pre={item.pre ?? ""} />
                    </div>
                    <span className="flex-1 text-xs">
                      <span className="text-red-400">{item.max}°</span>
                      <span className="text-muted-foreground"> / </span>
                      <span className="text-blue-400">{item.min}°</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-8 rounded-full" style={{ background: suitColor(item.suitability) }} />
                      <span className="w-6 text-right text-xs font-medium" style={{ color: suitColor(item.suitability) }}>
                        {item.suitability}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── 5. 관측 리뷰 ── */}
        <section>
          <h2 className="mb-2 text-sm font-semibold text-foreground">
            이곳에서 진행한 관측 리뷰
            {reviews.length > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground font-normal">{reviews.length}개</span>
            )}
          </h2>
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
    </div>
  );
}
