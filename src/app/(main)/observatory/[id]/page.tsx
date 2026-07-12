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

function WeatherIcon({ sky, pty, className = "h-6 w-6" }: { sky: number | null | undefined; pty: number | null | undefined; className?: string }) {
  const p = pty ?? 0;
  const s = sky ?? 1;
  if (p === 1 || p === 2 || p === 5 || p === 6) return <CloudRain className={className} />;
  if (p === 3 || p === 7) return <Snowflake className={className} />;
  if (s === 1) return <Sun className={className} />;
  if (s === 2) return <CloudSun className={className} />;  // 구름조금
  if (s === 3) return <Cloud className={className} />;     // 구름많음
  return <Cloud className={className} />;                  // 4=흐림
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

function skyText(sky: number | null | undefined): string {
  if (sky === 1) return "맑음";
  if (sky === 2) return "구름조금";
  if (sky === 3) return "구름많음";
  if (sky === 4) return "흐림";
  return "—";
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
  sky: number | null;
  pty: number | null;
  temp: number | null;
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
  const [forecastError, setForecastError] = useState(false);
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
        Promise.allSettled([
          getLiveWeather(data.latitude, data.longitude),
          getForecastData(data.latitude, data.longitude),
        ]).then(([lw, f]) => {
          if (lw.status === "fulfilled") setLive(lw.value);
          if (f.status === "fulfilled") {
            setForecast(f.value);
          } else {
            setForecastError(true);
            console.error("[weather/ForecastData] 실패:", f.reason);
          }
        }).finally(() => setForecastLoading(false));

        getReviewPosts(0, 20, "LATEST")
          .then((r) => setReviews(r.content.filter((p) => p.observationSiteId === id)))
          .catch(() => {});

        const clientId = (process.env.NEXT_PUBLIC_NAVER_CLIENT_ID ?? "").trim();
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

  // 시간별 예보: ultra 전체 + ultra 종료 이후의 short만 이어붙임 (과거·중복 항목 제거)
  const ultraList = forecast?.ultraForecastResponse ?? [];
  const now = new Date();
  const nowTmef = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
  ].join("");
  const lastUltraTmef = ultraList.length > 0 ? ultraList[ultraList.length - 1].tmef : nowTmef;
  const hourlyItems: HourlyItem[] = [
    ...ultraList.map((u) => ({
      tmef: u.tmef,
      sky: u.sky,
      pty: u.pty,
      temp: u.t1h,
      pop: Math.min(Math.round((u.rn1 ?? 0) * 10), 100),
      suit: u.suitability,
    })),
    ...(forecast?.shortForecastResponse ?? [])
      .filter((s) => s.tmef > lastUltraTmef)
      .map((s) => ({
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
      <div className="flex h-full items-center justify-center bg-bg-page">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-interactive-primary border-t-transparent" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-bg-page p-4">
        <p className="text-text-secondary">관측지를 찾을 수 없습니다.</p>
        <button onClick={() => router.back()} className="text-sm text-interactive-link">돌아가기</button>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-full max-w-2xl space-y-5 bg-bg-page pb-8">
      {/* ── 헤더 ── */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border-default glass px-4 py-3">
        <button
          onClick={() => router.back()}
          className="rounded-full p-1.5 transition-colors hover:bg-surface-2"
        >
          <ArrowLeft className="h-5 w-5 text-text-primary" />
        </button>
        <h1 className="text-lg font-bold text-text-primary">{site.name}</h1>
      </div>

      <div className="space-y-5 px-4">
        {/* ── 1. 관측지 히어로 + 기본 정보 ── */}
        <div className="relative overflow-hidden rounded-2xl bg-surface-2">
          {/* 관측지 사진이 없을 때 심우주 별필드 플레이스홀더 */}
          <div
            role="img"
            aria-label={`${site.name} 관측지`}
            className="starfield aspect-video w-full"
          />
          {/* 어두운 그라디언트 오버레이 */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-space-950 via-space-950/40 to-transparent" />
          {/* 이름 + 주소 오버레이 */}
          <div className="absolute inset-x-0 bottom-0 space-y-1 p-4">
            <h2 className="text-xl font-bold text-text-on-primary">{site.name}</h2>
            {address && (
              <div className="flex items-start gap-1.5 text-xs text-starlight-200">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-aurora" />
                <span>{address}</span>
              </div>
            )}
          </div>
        </div>

        {/* 평점 / 리뷰수 / 좋아요 + 현재 적합도 */}
        <div className="glass space-y-3 rounded-2xl p-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 font-mono text-warning">
              <Star className="h-4 w-4 fill-current" />
              {site.averageScore > 0 ? site.averageScore.toFixed(1) : "—"}
            </span>
            <span className="text-text-tertiary">
              리뷰 <span className="font-mono text-text-secondary">{site.reviewCount}</span>개
            </span>
            <span className="flex items-center gap-1 text-text-tertiary">
              <Heart className="h-3.5 w-3.5" /> <span className="font-mono">{site.totalLikes}</span>
            </span>
          </div>
          {/* 현재 관측 적합도 배지 */}
          {live && (
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: `${suitColor(live.suitability)}22`, color: suitColor(live.suitability) }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: suitColor(live.suitability) }} />
              현재 관측 적합도 <span className="font-mono">{live.suitability}</span>점 — {suitLabel(live.suitability)}
            </div>
          )}
          {/* 네이버 지도에서 보기 (좌표 기반, 상태 없음) */}
          <a
            href={`https://map.naver.com/p/search/${encodeURIComponent(site.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-interactive-primary px-4 py-2 text-sm font-semibold text-text-on-primary glow-primary transition-colors hover:brightness-110"
          >
            <MapPin className="h-4 w-4" />
            네이버 지도에서 보기
          </a>
        </div>

        {/* ── 2. 현재 날씨 ── */}
        {(forecastLoading || live) && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-text-primary">현재 날씨</h2>
            {forecastLoading && !live ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-1" />
                ))}
              </div>
            ) : live ? (
              <>
                {/* 하늘 상태 한 줄 — sky가 null이면 숨김 */}
                {live.sky != null && (
                  <div className="mb-2 flex items-center gap-2 text-sm text-text-secondary">
                    <WeatherIcon sky={live.sky} pty={live.pty} className="h-4 w-4" />
                    <span>{skyText(live.sky)}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-2 rounded-xl bg-surface-1 p-3">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-orange-400" />
                      <span className="text-xs text-text-tertiary">기온</span>
                    </div>
                    <p className="font-mono text-xl font-bold text-text-primary">
                      {live.t1h != null ? `${live.t1h}°` : "—"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 rounded-xl bg-surface-1 p-3">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-blue-400" />
                      <span className="text-xs text-text-tertiary">습도</span>
                    </div>
                    <p className="font-mono text-xl font-bold text-text-primary">
                      {live.reh != null ? `${live.reh}%` : "—"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 rounded-xl bg-surface-1 p-3">
                    <div className="flex items-center gap-2">
                      <Wind className="h-4 w-4 text-cyan-400" />
                      <span className="text-xs text-text-tertiary">바람</span>
                    </div>
                    <p className="font-mono text-xl font-bold text-text-primary">
                      {live.wsd != null ? `${live.wsd}m/s` : "—"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 rounded-xl bg-surface-1 p-3">
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-aurora" />
                      <span className="text-xs text-text-tertiary">관측 적합도</span>
                    </div>
                    <p className="font-mono text-xl font-bold" style={{ color: suitColor(live.suitability) }}>
                      {live.suitability}점
                    </p>
                  </div>
                </div>
              </>
            ) : null}
          </section>
        )}

        {/* ── 3. 시간별 예보 (초단기 + 단기, 날짜 구분) ── */}
        {forecastError && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-text-primary">시간별 예보</h2>
            <p className="text-xs text-text-tertiary">예보 데이터를 불러오지 못했습니다.</p>
          </section>
        )}
        {(forecastLoading || hourlyItems.length > 0) && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-text-primary">시간별 예보</h2>
            {forecastLoading && hourlyItems.length === 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-28 min-w-[60px] shrink-0 animate-pulse rounded-xl bg-surface-1" />
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
                        <div className="w-px flex-1 bg-border-default" />
                        <span
                          className="rounded-full bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-aurora"
                          style={{ writingMode: "vertical-lr", transform: "rotate(180deg)" }}
                        >
                          {fmtDate(thisDate)}
                        </span>
                        <div className="w-px flex-1 bg-border-default" />
                      </div>,
                    );
                  }

                  elements.push(
                    <div
                      key={i}
                      className="flex min-w-[60px] shrink-0 flex-col items-center gap-1.5 rounded-xl bg-surface-1 px-2 py-2.5 text-center"
                    >
                      <span className="font-mono text-xs text-text-tertiary">{formatHM(item.tmef)}</span>
                      <WeatherIcon sky={item.sky} pty={item.pty} className="h-6 w-6 text-text-primary" />
                      <span className="font-mono text-xs font-medium text-text-primary">
                        {item.temp != null ? `${item.temp}°` : "—"}
                      </span>
                      <div className="flex items-center gap-0.5 font-mono text-xs text-blue-400">
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

        {/* ── 4. 중기 예보 (날짜별 오전/오후 통합) ── */}
        {(forecastLoading || (forecast?.midCombinedForecastDTO?.length ?? 0) > 0) && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-text-primary">중기 예보</h2>
            {forecastLoading && !forecast ? (
              <div className="space-y-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-surface-1" />
                ))}
              </div>
            ) : (() => {
              // 날짜별로 오전(09시)/오후(18시) 묶기
              type MidItem = NonNullable<typeof forecast>["midCombinedForecastDTO"][0];
              const byDate: Record<string, { am?: MidItem; pm?: MidItem }> = {};
              for (const item of (forecast?.midCombinedForecastDTO ?? [])) {
                const date = item.tmEf.slice(0, 8);
                if (!byDate[date]) byDate[date] = {};
                const hour = item.tmEf.slice(8, 10);
                if (hour <= "12") byDate[date].am = item;
                else byDate[date].pm = item;
              }
              const rows = Object.entries(byDate);
              return (
                <div className="overflow-hidden rounded-xl bg-surface-1">
                  {rows.map(([date, { am, pm }], i) => {
                    const rep = pm ?? am!;
                    const max = pm?.max ?? am?.max ?? 0;
                    const min = am?.min ?? pm?.min ?? 0;
                    const suit = Math.round(((am?.suitability ?? 0) + (pm?.suitability ?? 0)) / (am && pm ? 2 : 1));
                    return (
                      <div
                        key={date}
                        className={`flex items-center gap-2 px-4 py-3 ${
                          i < rows.length - 1 ? "border-b border-border-default" : ""
                        }`}
                      >
                        {/* 날짜 */}
                        <span className="w-10 shrink-0 font-mono text-xs text-text-tertiary">{fmtDate(date)}</span>

                        {/* 오전 날씨 */}
                        <div className="flex shrink-0 flex-col items-center gap-0.5">
                          <span className="text-[10px] text-text-tertiary">오전</span>
                          <WeatherIconMid sky={am?.sky ?? ""} pre={am?.pre ?? ""} className="h-4 w-4 text-text-secondary" />
                          <div className="flex items-center gap-0.5 font-mono text-[10px] text-blue-400">
                            <Droplet className="h-2.5 w-2.5" />{am?.rnSt ?? 0}%
                          </div>
                        </div>

                        {/* 오후 날씨 */}
                        <div className="flex shrink-0 flex-col items-center gap-0.5">
                          <span className="text-[10px] text-text-tertiary">오후</span>
                          <WeatherIconMid sky={pm?.sky ?? rep.sky ?? ""} pre={pm?.pre ?? rep.pre ?? ""} className="h-4 w-4 text-text-primary" />
                          <div className="flex items-center gap-0.5 font-mono text-[10px] text-blue-400">
                            <Droplet className="h-2.5 w-2.5" />{pm?.rnSt ?? 0}%
                          </div>
                        </div>

                        {/* 기온 */}
                        <span className="flex-1 font-mono text-xs">
                          <span className="text-error">{max}°</span>
                          <span className="text-text-tertiary"> / </span>
                          <span className="text-blue-400">{min}°</span>
                        </span>

                        {/* 적합도 */}
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-8 rounded-full" style={{ background: suitColor(suit) }} />
                          <span className="w-6 text-right font-mono text-xs font-medium" style={{ color: suitColor(suit) }}>
                            {suit}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </section>
        )}

        {/* ── 5. 관측 리뷰 ── */}
        <section>
          <h2 className="mb-2 text-sm font-semibold text-text-primary">
            이곳에서 진행한 관측 리뷰
            {reviews.length > 0 && (
              <span className="ml-1.5 font-mono text-xs font-normal text-text-tertiary">{reviews.length}개</span>
            )}
          </h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-text-tertiary">아직 리뷰가 없습니다.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {reviews.map((post) => (
                <Link
                  key={post.id}
                  href={`/community/review/${post.id}`}
                  className="overflow-hidden rounded-2xl bg-surface-1 transition-colors hover:bg-surface-2"
                >
                  <img
                    src={post.thumbnailUrl ?? "/byeoldori.png"}
                    alt={post.title}
                    className="aspect-square w-full object-cover"
                  />
                  <div className="p-2">
                    <p className="line-clamp-2 text-xs font-medium text-text-primary">{post.title}</p>
                    <div className="mt-1 flex items-center justify-between text-xs text-text-tertiary">
                      <span className="truncate">{post.authorNickname}</span>
                      {post.score != null && (
                        <span className="ml-1 flex shrink-0 items-center gap-0.5 font-mono text-warning">
                          <Star className="h-3 w-3 fill-current" />
                          {post.score.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-text-tertiary">
                      <span className="flex items-center gap-0.5">
                        <Heart className="h-3 w-3" /> <span className="font-mono">{post.likeCount}</span>
                      </span>
                      <span className="flex items-center gap-0.5">
                        <MessageSquare className="h-3 w-3" /> <span className="font-mono">{post.commentCount}</span>
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
