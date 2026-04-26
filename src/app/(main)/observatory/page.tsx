"use client";

import { useEffect, useState, useRef } from "react";
import { getAllSites, getSitesByKeyword, getSiteById } from "@/lib/api/observation-sites";
import { getForecastData } from "@/lib/api/weather";
import { WeatherSection } from "@/components/weather-section";
import type { ObservationSite, ObservationSiteDetail, ForecastData } from "@/types/api";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Lamp, X, Star, Heart, LocateFixed } from "lucide-react";

declare global {
  interface Window {
    naver: {
      maps: {
        Map: new (el: HTMLElement, opts: Record<string, unknown>) => NaverMap;
        LatLng: new (lat: number, lng: number) => NaverLatLng;
        LatLngBounds: new (sw: NaverLatLng, ne: NaverLatLng) => NaverLatLngBounds;
        Marker: new (opts: Record<string, unknown>) => NaverMarker;
        Size: new (w: number, h: number) => NaverSize;
        GroundOverlay: new (
          url: string,
          bounds: NaverLatLngBounds,
          opts?: { opacity?: number },
        ) => NaverGroundOverlay;
        Event: {
          addListener: (target: unknown, event: string, handler: (arg?: unknown) => void) => void;
        };
      };
    };
    MarkerClustering: new (opts: {
      map: NaverMap;
      markers: NaverMarker[];
      maxZoom?: number;
      gridSize?: number;
      minClusterSize?: number;
      icons?: unknown[];
      indexGenerator?: number[];
      stylingFunction?: (marker: { getElement(): HTMLElement }, count: number) => void;
    }) => unknown;
  }
}

interface NaverMap {
  setCenter(latlng: NaverLatLng): void;
  setZoom(zoom: number): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getProjection(): any;
}
interface NaverLatLng { lat(): number; lng(): number; }
interface NaverLatLngBounds { _sw?: NaverLatLng; _ne?: NaverLatLng; }
interface NaverMarker {
  setMap(map: NaverMap | null): void;
  getPosition(): NaverLatLng;
}
interface NaverSize { width: number; height: number; }
interface NaverGroundOverlay { setMap(map: NaverMap | null): void; }

interface DayForecast {
  label: string;
  suitability: number;
  sky: string;
  minTemp?: number;
  maxTemp?: number;
}

interface HoverInfo {
  site: ObservationSite;
  x: number;
  y: number;
  detail: ObservationSiteDetail | null;
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

function clusterIcon(size: number) {
  return {
    content: `<div style="width:${size}px;height:${size}px;background:rgba(124,58,237,0.85);border:2px solid rgba(255,255,255,0.6);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:${size > 44 ? 14 : 12}px;box-shadow:0 2px 8px rgba(0,0,0,0.4);cursor:pointer"><span class="c-cnt"></span></div>`,
    size: { width: size, height: size },
    anchor: { x: size / 2, y: size / 2 },
  };
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
  const [locating, setLocating] = useState(false);
  const [panelLoading, setPanelLoading] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [clusterSites, setClusterSites] = useState<ObservationSite[] | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const naverMapRef = useRef<NaverMap | null>(null);
  const lpOverlayRef = useRef<NaverGroundOverlay | null>(null);
  const rawMarkersRef = useRef<NaverMarker[]>([]);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const myLocMarkerRef = useRef<NaverMarker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const markerToSiteRef = useRef<Map<NaverMarker, ObservationSite>>(new Map());

  useEffect(() => {
    getAllSites().then((page) => setSites(page.content)).catch(() => {});
  }, []);

  // 현재 위치 블루닷 — watchPosition으로 지속 추적
  useEffect(() => {
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const map = naverMapRef.current;
        if (!map || !window.naver) return;
        const latlng = new window.naver.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        if (myLocMarkerRef.current) {
          (myLocMarkerRef.current as unknown as { setPosition(l: NaverLatLng): void }).setPosition(latlng);
        } else {
          myLocMarkerRef.current = new window.naver.maps.Marker({
            position: latlng,
            map,
            icon: {
              content: `<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.3)"></div>`,
              anchor: { x: 8, y: 8 },
            },
            zIndex: 200,
          });
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
    if (!clientId) return;

    function initMap() {
      if (!mapRef.current || !window.naver) return;
      const map = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(36.6284, 127.4572),
        zoom: 7,
      });
      naverMapRef.current = map;

      const sw = new window.naver.maps.LatLng(32.0, 123.5);
      const ne = new window.naver.maps.LatLng(40.5, 132.5);
      const overlay = new window.naver.maps.GroundOverlay(
        "/korea_lightpollution_overlay.png",
        new window.naver.maps.LatLngBounds(sw, ne),
        { opacity: 0.7 },
      );
      lpOverlayRef.current = overlay;

      if (typeof window.MarkerClustering === "undefined") {
        const s = document.createElement("script");
        s.src = "https://navermaps.github.io/maps.js.ncp/docs/js/MarkerClustering.js";
        s.onload = () => buildMarkers(map);
        document.head.appendChild(s);
      } else {
        buildMarkers(map);
      }
    }

    const existing = document.getElementById("naver-map-script");
    if (existing && window.naver) {
      initMap();
    } else if (!existing) {
      const script = document.createElement("script");
      script.id = "naver-map-script";
      script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&ncpClientId=${clientId}`;
      script.onload = initMap;
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    const map = naverMapRef.current;
    if (!map || !window.naver || sites.length === 0) return;
    if (typeof window.MarkerClustering !== "undefined") {
      buildMarkers(map);
    }
  }, [sites]);

  function getMarkerScreenPos(map: NaverMap, lat: number, lng: number): { x: number; y: number } | null {
    try {
      const proj = map.getProjection();
      const offset = proj.fromCoordToOffset(new window.naver.maps.LatLng(lat, lng));
      return { x: offset.x, y: offset.y };
    } catch {
      return null;
    }
  }

  function cancelHoverClose() {
    if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null; }
  }
  function startHoverClose() {
    hoverTimerRef.current = setTimeout(() => setHoverInfo(null), 400);
  }

  function buildMarkers(map: NaverMap) {
    if (!window.naver || sites.length === 0) return;
    rawMarkersRef.current.forEach((m) => m.setMap(null));
    rawMarkersRef.current = [];
    markerToSiteRef.current.clear();

    const markers: NaverMarker[] = sites.map((site) => {
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(site.latitude, site.longitude),
        title: site.name,
      });

      markerToSiteRef.current.set(marker, site);

      window.naver.maps.Event.addListener(marker, "mouseover", () => {
        cancelHoverClose();
        // 350ms 딜레이: 카드가 즉시 렌더링되어 마커 mouseout을 재발사하는 루프 방지
        if (showTimerRef.current) clearTimeout(showTimerRef.current);
        showTimerRef.current = setTimeout(() => {
          const pos = getMarkerScreenPos(map, site.latitude, site.longitude);
          if (!pos) return;
          setHoverInfo({ site, x: pos.x, y: pos.y, detail: null });
          getSiteById(site.id)
            .then((detail) =>
              setHoverInfo((prev) => (prev?.site.id === site.id ? { ...prev, detail } : prev))
            )
            .catch(() => {});
        }, 350);
      });

      window.naver.maps.Event.addListener(marker, "mouseout", () => {
        if (showTimerRef.current) { clearTimeout(showTimerRef.current); showTimerRef.current = null; }
        startHoverClose();
      });

      window.naver.maps.Event.addListener(marker, "click", () => {
        setHoverInfo(null);
        selectSite(site);
      });

      return marker;
    });

    rawMarkersRef.current = markers;

    if (typeof window.MarkerClustering !== "undefined") {
      const clustering = new window.MarkerClustering({
        map,
        markers,
        maxZoom: 11,
        gridSize: 100,
        minClusterSize: 2,
        icons: [clusterIcon(36), clusterIcon(44), clusterIcon(54)],
        indexGenerator: [5, 15, 50],
        stylingFunction: (clusterMarker, count) => {
          const el = clusterMarker.getElement().querySelector(".c-cnt");
          if (el) el.textContent = String(count);
        },
      });

      // 클러스터 클릭 → 소속 관측지 목록 표시
      window.naver.maps.Event.addListener(clustering, "clusterclick", (cluster: unknown) => {
        const clusterMarkers: NaverMarker[] =
          (cluster as { getMarkers?: () => NaverMarker[]; _clusterMarkers?: NaverMarker[] })
            .getMarkers?.() ??
          (cluster as { _clusterMarkers?: NaverMarker[] })._clusterMarkers ??
          [];
        const list = clusterMarkers
          .map((m) => markerToSiteRef.current.get(m))
          .filter((s): s is ObservationSite => !!s);
        if (list.length > 0) setClusterSites(list);
      });
    } else {
      markers.forEach((m) => m.setMap(map));
    }
  }

  function selectSite(site: ObservationSite) {
    setSelected(site);
    setSiteDetail(null);
    setForecast(null);
    setSearchResults(null);
    setClusterSites(null);
    if (naverMapRef.current && window.naver) {
      naverMapRef.current.setCenter(new window.naver.maps.LatLng(site.latitude, site.longitude));
      naverMapRef.current.setZoom(12);
    }
    setPanelLoading(true);
    Promise.all([getSiteById(site.id), getForecastData(site.latitude, site.longitude)])
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
    if (lpOn) overlay.setMap(null);
    else overlay.setMap(map);
    setLpOn((v) => !v);
  }

  function goToMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const map = naverMapRef.current;
        if (map && window.naver) {
          map.setCenter(new window.naver.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
          map.setZoom(14);
        }
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 },
    );
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

      {/* 핀 호버 카드
          - wrapper의 paddingBottom이 카드~마커 사이 공백을 덮어 mouse가 항상 wrapper 안에 있게 함
          - show 350ms 딜레이로 즉시 렌더 → mouseout 루프 방지
      */}
      {hoverInfo && (
        <div
          className="pointer-events-auto absolute z-20"
          style={{
            left: hoverInfo.x - 56,
            top: hoverInfo.y - 220,
            paddingBottom: 55,
          }}
          onMouseEnter={cancelHoverClose}
          onMouseLeave={startHoverClose}
        >
          <div
            className="w-28 cursor-pointer overflow-hidden rounded-xl bg-background/95 shadow-xl ring-1 ring-purple-500/30 transition-transform hover:scale-105"
            onClick={() => selectSite(hoverInfo.site)}
          >
            <img
              src="/byeoldori.png"
              alt={hoverInfo.site.name}
              className="aspect-square w-full object-cover"
            />
            <div className="p-2">
              <p className="truncate text-xs font-semibold text-foreground">{hoverInfo.site.name}</p>
              <div className="mt-0.5 flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {hoverInfo.detail ? (
                  <span className="text-xs text-yellow-400">{hoverInfo.detail.averageScore.toFixed(1)}</span>
                ) : (
                  <span className="text-xs text-muted-foreground">···</span>
                )}
              </div>
            </div>
          </div>
          <div className="mx-auto h-3 w-0.5 bg-purple-400/50" />
        </div>
      )}

      {/* 우하단 버튼 그룹 */}
      <div className="absolute bottom-6 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={goToMyLocation}
          disabled={locating}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-background/90 shadow-lg backdrop-blur transition-colors hover:bg-background disabled:opacity-60"
          title="내 위치로 이동"
        >
          <LocateFixed className={`h-4 w-4 ${locating ? "animate-pulse text-purple-400" : ""}`} />
        </button>

        <button
          onClick={toggleLightPollution}
          className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium shadow-lg backdrop-blur transition-colors ${
            lpOn
              ? "bg-yellow-500/90 text-black"
              : "bg-background/90 text-foreground hover:bg-background"
          }`}
        >
          <Lamp className="h-4 w-4" />
          광공해 {lpOn ? "ON" : "OFF"}
        </button>
      </div>

      {/* 클러스터 클릭 → 관측지 목록 바텀시트 */}
      {clusterSites && (
        <div className="absolute bottom-0 left-0 right-0 z-30 rounded-t-2xl bg-background shadow-2xl">
          <div className="sticky top-0 flex items-center justify-between rounded-t-2xl bg-background px-4 py-3">
            <span className="font-semibold text-foreground">
              이 지역 관측지 {clusterSites.length}곳
            </span>
            <button
              onClick={() => setClusterSites(null)}
              className="rounded-full p-1 transition-colors hover:bg-card"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div className="max-h-56 overflow-y-auto pb-4">
            {clusterSites.map((site) => (
              <button
                key={site.id}
                onClick={() => selectSite(site)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-card"
              >
                <MapPin className="h-4 w-4 shrink-0 text-purple-400" />
                <span className="text-sm text-foreground">{site.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {site.latitude.toFixed(3)}, {site.longitude.toFixed(3)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 관측지 상세 모달 */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
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
              <button onClick={closeModal} className="rounded-full p-1.5 transition-colors hover:bg-card">
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
