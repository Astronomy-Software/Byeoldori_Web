"use client";

import { useEffect, useState, useRef } from "react";
import { getAllSites, getSitesByKeyword, getSiteById } from "@/lib/api/observation-sites";
import { getForecastData } from "@/lib/api/weather";
import { WeatherSection } from "@/components/weather-section";
import type { ObservationSite, ObservationSiteDetail, ForecastData } from "@/types/api";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Lamp, X, Star, Heart } from "lucide-react";

declare global {
  interface Window {
    naver: {
      maps: {
        Map: new (el: HTMLElement, opts: Record<string, unknown>) => NaverMap;
        LatLng: new (lat: number, lng: number) => NaverLatLng;
        LatLngBounds: new (sw: NaverLatLng, ne: NaverLatLng) => NaverLatLngBounds;
        Marker: new (opts: Record<string, unknown>) => NaverMarker;
        GroundOverlay: new (
          url: string,
          bounds: NaverLatLngBounds,
          opts?: { opacity?: number }
        ) => NaverGroundOverlay;
        InfoWindow: new (opts: {
          content: string;
          borderWidth?: number;
          backgroundColor?: string;
          disableAnchor?: boolean;
          pixelOffset?: { x: number; y: number };
        }) => NaverInfoWindow;
        Event: {
          addListener: (target: unknown, event: string, handler: () => void) => void;
        };
      };
    };
  }
}

interface NaverMap {
  setCenter(latlng: NaverLatLng): void;
  setZoom(zoom: number): void;
}
interface NaverLatLng { lat(): number; lng(): number; }
interface NaverLatLngBounds { _min?: NaverLatLng; _max?: NaverLatLng; }
interface NaverMarker {
  setMap(map: NaverMap | null): void;
  getPosition(): NaverLatLng;
}
interface NaverGroundOverlay { setMap(map: NaverMap | null): void; }
interface NaverInfoWindow {
  open(map: NaverMap, anchor: NaverLatLng | NaverMarker): void;
  close(): void;
}

interface DayForecast {
  label: string;
  suitability: number;
  sky: string;
  minTemp?: number;
  maxTemp?: number;
}

function getSkyEmoji(sky: number | string): string {
  const n = typeof sky === "string" ? parseInt(sky) : sky;
  if (n <= 1) return "☀️";
  if (n <= 3) return "🌤️";
  return "☁️";
}

function getMidSkyEmoji(sky: string): string {
  if (sky === "WB01") return "☀️";
  if (sky === "WB02") return "🌤️";
  if (sky === "WB03") return "⛅";
  return "☁️";
}

function suitabilityColor(score: number): string {
  if (score >= 70) return "text-green-400";
  if (score >= 40) return "text-yellow-400";
  return "text-red-400";
}

export default function ObservatoryPage() {
  const [sites, setSites] = useState<ObservationSite[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<ObservationSite[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState<ObservationSite | null>(null);
  const [siteDetail, setSiteDetail] = useState<ObservationSiteDetail | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [lpOn, setLpOn] = useState(false);
  const [panelLoading, setPanelLoading] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const naverMapRef = useRef<NaverMap | null>(null);
  const markersRef = useRef<NaverMarker[]>([]);
  const lpOverlayRef = useRef<NaverGroundOverlay | null>(null);

  useEffect(() => {
    getAllSites().then((page) => setSites(page.content)).catch(() => {});
  }, []);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
    if (!clientId) return;
    const existing = document.getElementById("naver-map-script");
    if (existing) { initMap(); return; }
    const script = document.createElement("script");
    script.id = "naver-map-script";
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&ncpClientId=${clientId}`;
    script.onload = initMap;
    document.head.appendChild(script);
  }, []);

  function initMap() {
    if (!mapRef.current || !window.naver) return;
    const map = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(36.6284, 127.4572),
      zoom: 7,
    });
    naverMapRef.current = map;

    // 광공해 오버레이 — Android 앱과 동일한 bounds, GroundOverlay 방식
    const sw = new window.naver.maps.LatLng(32.0, 123.5);
    const ne = new window.naver.maps.LatLng(40.5, 132.5);
    const bounds = new window.naver.maps.LatLngBounds(sw, ne);
    const overlay = new window.naver.maps.GroundOverlay(
      "/korea_lightpollution_overlay.png",
      bounds,
      { opacity: 0.65 },
    );
    lpOverlayRef.current = overlay;
  }

  useEffect(() => {
    const map = naverMapRef.current;
    if (!map || !window.naver) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    sites.forEach((site) => {
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(site.latitude, site.longitude),
        map,
      });

      // 호버 툴팁
      const infoWindow = new window.naver.maps.InfoWindow({
        content: `<div style="padding:6px 10px;background:#1e1b4b;color:#e2e8f0;border-radius:8px;font-size:12px;font-weight:500;border:1px solid rgba(139,92,246,0.4);white-space:nowrap">${site.name}</div>`,
        borderWidth: 0,
        backgroundColor: "transparent",
        disableAnchor: true,
      });

      window.naver.maps.Event.addListener(marker, "mouseover", () => {
        infoWindow.open(map, marker.getPosition());
      });
      window.naver.maps.Event.addListener(marker, "mouseout", () => {
        infoWindow.close();
      });
      window.naver.maps.Event.addListener(marker, "click", () => selectSite(site));

      markersRef.current.push(marker);
    });
  }, [sites]);

  function selectSite(site: ObservationSite) {
    setSelected(site);
    setSiteDetail(null);
    setForecast(null);
    setSearchResults(null);
    if (naverMapRef.current && window.naver) {
      naverMapRef.current.setCenter(new window.naver.maps.LatLng(site.latitude, site.longitude));
      naverMapRef.current.setZoom(12);
    }
    setPanelLoading(true);
    Promise.all([
      getSiteById(site.id),
      getForecastData(site.latitude, site.longitude),
    ])
      .then(([detail, fc]) => { setSiteDetail(detail); setForecast(fc); })
      .catch(() => {})
      .finally(() => setPanelLoading(false));
  }

  async function handleSearch() {
    const q = searchInput.trim();
    if (!q) { setSearchResults(null); return; }
    setIsSearching(true);
    try {
      const results = await getSitesByKeyword(q);
      setSearchResults(results);
    } catch {
      setSearchResults(sites.filter((s) => s.name.includes(q)));
    } finally {
      setIsSearching(false);
    }
  }

  function toggleLightPollution() {
    const overlay = lpOverlayRef.current;
    const map = naverMapRef.current;
    if (!overlay || !map) return;
    if (lpOn) {
      overlay.setMap(null);
    } else {
      overlay.setMap(map);
    }
    setLpOn((v) => !v);
  }

  function closeModal() {
    setSelected(null);
    setSiteDetail(null);
    setForecast(null);
  }

  function buildDayForecasts(): DayForecast[] {
    if (!forecast) return [];
    const days: DayForecast[] = [];

    const shortByDate: Record<string, { suitability: number[]; sky: number[]; tmp: number[] }> = {};
    for (const item of forecast.shortForecastResponse) {
      const date = item.tmef.slice(0, 8);
      if (!shortByDate[date]) shortByDate[date] = { suitability: [], sky: [], tmp: [] };
      shortByDate[date].suitability.push(item.suitability);
      shortByDate[date].sky.push(item.sky);
      shortByDate[date].tmp.push(item.tmp);
    }
    for (const [date, data] of Object.entries(shortByDate)) {
      const label = `${date.slice(4, 6)}/${date.slice(6, 8)}`;
      days.push({
        label,
        suitability: Math.max(...data.suitability),
        sky: getSkyEmoji(Math.round(data.sky.reduce((a, b) => a + b, 0) / data.sky.length)),
        minTemp: Math.min(...data.tmp),
        maxTemp: Math.max(...data.tmp),
      });
    }

    const existingDates = new Set(days.map((d) => d.label));
    for (const item of forecast.midCombinedForecastDTO) {
      const date = item.tmEf.slice(0, 8);
      const label = `${date.slice(4, 6)}/${date.slice(6, 8)}`;
      if (!existingDates.has(label)) {
        existingDates.add(label);
        days.push({
          label,
          suitability: item.suitability,
          sky: getMidSkyEmoji(item.sky),
          minTemp: item.min,
          maxTemp: item.max,
        });
      }
    }
    return days.slice(0, 14);
  }

  const dayForecasts = buildDayForecasts();

  return (
    // 높이 fix: 모바일에서 하단 네비(4rem=64px) 제외한 높이, 데스크탑은 flex-1이 처리
    <div className="relative h-[calc(100dvh-4rem)] w-full overflow-hidden md:h-full">
      {/* 네이버 지도 */}
      <div ref={mapRef} className="h-full w-full" />

      {/* 검색 바 */}
      <div className="absolute left-4 right-4 top-4 z-10 mx-auto max-w-md">
        <div className="flex gap-2">
          <Input
            placeholder="관측지 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="bg-background/90 backdrop-blur"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-input bg-background/90 backdrop-blur transition-colors hover:bg-background"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        {searchResults && searchResults.length > 0 && (
          <div className="mt-1 overflow-hidden rounded-lg bg-background/95 shadow-lg backdrop-blur">
            {searchResults.map((site) => (
              <button
                key={site.id}
                onClick={() => selectSite(site)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-card"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-purple-400" />
                <span className="text-foreground">{site.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {site.latitude.toFixed(3)}, {site.longitude.toFixed(3)}
                </span>
              </button>
            ))}
          </div>
        )}
        {searchResults && searchResults.length === 0 && (
          <div className="mt-1 rounded-lg bg-background/95 px-3 py-2 text-sm text-muted-foreground backdrop-blur">
            검색 결과가 없습니다.
          </div>
        )}
      </div>

      {/* 광공해 토글 */}
      <button
        onClick={toggleLightPollution}
        className={`absolute bottom-6 right-4 z-10 flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium shadow-lg backdrop-blur transition-colors ${
          lpOn ? "bg-yellow-500/90 text-black" : "bg-background/90 text-foreground hover:bg-background"
        }`}
      >
        <Lamp className="h-4 w-4" />
        광공해 {lpOn ? "ON" : "OFF"}
      </button>

      {/* 관측지 상세 모달 */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 배경 딤 */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* 모달 카드 */}
          <div className="relative z-10 w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-background shadow-2xl">
            <div className="sticky top-0 flex items-start justify-between bg-background px-5 pb-3 pt-5">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{selected.name}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}
                </p>
                {siteDetail && (
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5 text-yellow-400">
                      <Star className="h-3 w-3 fill-yellow-400" />
                      {siteDetail.averageScore.toFixed(1)}
                    </span>
                    <span>리뷰 {siteDetail.reviewCount}개</span>
                    <span className="flex items-center gap-0.5">
                      <Heart className="h-3 w-3" /> {siteDetail.totalLikes}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={closeModal}
                className="rounded-full p-1.5 transition-colors hover:bg-card"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4 px-5 pb-5">
              <WeatherSection lat={selected.latitude} lon={selected.longitude} />

              {panelLoading && (
                <div className="h-24 animate-pulse rounded-xl bg-purple-500/10" />
              )}
              {!panelLoading && dayForecasts.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-foreground">2주 관측 적합도</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {dayForecasts.map((day, i) => (
                      <div
                        key={i}
                        className="flex shrink-0 flex-col items-center rounded-lg bg-card/50 px-2.5 py-2 text-center"
                        style={{ minWidth: 56 }}
                      >
                        <span className="text-xs text-muted-foreground">{day.label}</span>
                        <span className="my-0.5 text-base">{day.sky}</span>
                        <span className={`text-sm font-bold ${suitabilityColor(day.suitability)}`}>
                          {day.suitability}
                        </span>
                        {day.minTemp !== undefined && day.maxTemp !== undefined && (
                          <span className="mt-0.5 text-xs text-muted-foreground">
                            {day.minTemp}~{day.maxTemp}°
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
