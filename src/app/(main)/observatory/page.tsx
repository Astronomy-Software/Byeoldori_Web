"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getAllSites, getSitesByKeyword } from "@/lib/api/observation-sites";
import type { ObservationSite } from "@/types/api";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Lamp, X, LocateFixed } from "lucide-react";

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
        Service: {
          reverseGeocode(
            opts: { coords: NaverLatLng },
            cb: (status: string, res: {
              v2: { results: Array<{
                region: { area1: { name: string }; area2: { name: string }; area3: { name: string } };
                land?: { addition0?: { value?: string } };
              }> };
            }) => void,
          ): void;
          Status: { ERROR: string; OK: string };
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
}
interface NaverLatLng { lat(): number; lng(): number; }
interface NaverLatLngBounds { _sw?: NaverLatLng; _ne?: NaverLatLng; }
interface NaverMarker {
  setMap(map: NaverMap | null): void;
  getPosition(): NaverLatLng;
}
interface NaverSize { width: number; height: number; }
interface NaverGroundOverlay { setMap(map: NaverMap | null): void; }

const CARD_W = 116;
const CARD_IMG_H = 74;
const CARD_ANCHOR = { x: CARD_W / 2, y: CARD_IMG_H + 26 + 6 };

function cardMarkerHtml(name: string, rating?: number | null): string {
  const ratingStr = rating != null ? rating.toFixed(1) : "··";
  return `
    <div style="cursor:pointer;user-select:none;width:${CARD_W}px">
      <div style="
        background:rgba(12,8,45,0.93);
        border:1px solid rgba(139,92,246,0.6);
        border-radius:9px;
        overflow:hidden;
        box-shadow:0 3px 12px rgba(0,0,0,0.6);
        backdrop-filter:blur(6px);
      ">
        <img
          src="/byeoldori.png"
          style="width:${CARD_W}px;height:${CARD_IMG_H}px;object-fit:cover;display:block;pointer-events:none"
        />
        <div style="
          display:flex;align-items:center;justify-content:space-between;
          padding:4px 7px;gap:4px;
        ">
          <span style="
            color:#e2e8f0;font-size:10px;font-weight:600;
            overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;
          ">${name}</span>
          <span style="color:#facc15;font-size:10px;font-weight:700;white-space:nowrap;flex-shrink:0">
            ★ ${ratingStr}
          </span>
        </div>
      </div>
      <div style="
        width:0;height:0;
        border-left:6px solid transparent;
        border-right:6px solid transparent;
        border-top:6px solid rgba(139,92,246,0.75);
        margin:0 auto;
      "></div>
    </div>
  `;
}

function clusterIcon(size: number) {
  return {
    content: `<div style="width:${size}px;height:${size}px;background:rgba(124,58,237,0.85);border:2px solid rgba(255,255,255,0.6);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:${size > 44 ? 14 : 12}px;box-shadow:0 2px 8px rgba(0,0,0,0.4);cursor:pointer"><span class="c-cnt"></span></div>`,
    size: { width: size, height: size },
    anchor: { x: size / 2, y: size / 2 },
  };
}

export default function ObservatoryPage() {
  const router = useRouter();
  const [sites, setSites] = useState<ObservationSite[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<ObservationSite[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [lpOn, setLpOn] = useState(false);
  const [locating, setLocating] = useState(false);
  const [clusterSites, setClusterSites] = useState<ObservationSite[] | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const naverMapRef = useRef<NaverMap | null>(null);
  const lpOverlayRef = useRef<NaverGroundOverlay | null>(null);
  const rawMarkersRef = useRef<NaverMarker[]>([]);
  const myLocMarkerRef = useRef<NaverMarker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const markerToSiteRef = useRef<Map<NaverMarker, ObservationSite>>(new Map());

  useEffect(() => {
    getAllSites()
      .then((page) => setSites(page.content))
      .catch((err) => console.error("[observation-sites/getAllSites] 실패:", err));
  }, []);

  // 현재 위치 블루닷
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
    const clientId = (process.env.NEXT_PUBLIC_NAVER_CLIENT_ID ?? "").trim();
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
      script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&ncpClientId=${clientId}&submodules=geocoder`;
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

  function buildMarkers(map: NaverMap) {
    if (!window.naver || sites.length === 0) return;
    rawMarkersRef.current.forEach((m) => m.setMap(null));
    rawMarkersRef.current = [];
    markerToSiteRef.current.clear();

    const markers: NaverMarker[] = sites.map((site) => {
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(site.latitude, site.longitude),
        icon: { content: cardMarkerHtml(site.name, site.averageScore), anchor: CARD_ANCHOR },
        zIndex: 100,
      });

      markerToSiteRef.current.set(marker, site);
      window.naver.maps.Event.addListener(marker, "click", () => goToDetail(site));

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

  function goToDetail(site: ObservationSite) {
    setSearchResults(null);
    setClusterSites(null);
    router.push(`/observatory/${site.id}`);
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

  return (
    <div className="relative h-[calc(100dvh-4rem)] w-full overflow-hidden bg-bg-page md:h-screen">
      <div ref={mapRef} className="h-full w-full" />

      {/* 데스크톱 좌측 glass 패널: 관측지 리스트 */}
      <aside className="absolute left-0 top-0 z-20 hidden h-full w-80 flex-col border-r border-border-strong bg-bg-section/95 backdrop-blur-md md:flex">
        <div className="border-b border-border-default bg-surface-1/60 px-5 pb-4 pt-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-text-primary">
            <MapPin className="h-4 w-4 text-aurora" aria-hidden="true" /> 관측지
          </h2>
          <p className="mt-0.5 font-mono text-xs text-text-tertiary">전국 {sites.length}곳</p>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
          {sites.map((site) => (
            <button
              key={site.id}
              onClick={() => goToDetail(site)}
              className="group flex w-full items-center gap-3 rounded-2xl border border-border-default bg-surface-1 px-3 py-3 text-left transition-colors hover:border-border-strong hover:bg-surface-2"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-1 text-interactive-link">
                <MapPin className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-text-primary">{site.name}</span>
                <span className="block truncate font-mono text-[11px] text-text-tertiary">
                  {site.latitude.toFixed(3)}, {site.longitude.toFixed(3)}
                </span>
              </span>
              {site.averageScore != null && (
                <span className="shrink-0 rounded-full bg-surface-1 px-2 py-1 font-mono text-xs text-warning">
                  ★ {site.averageScore.toFixed(1)}
                </span>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* 검색 바 */}
      <div className="absolute left-4 right-4 top-4 z-30 mx-auto max-w-md md:left-[21rem] md:right-auto md:mx-0 md:w-[22rem]">
        <div className="flex gap-2">
          <Input
            placeholder="관측지 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="glass border-border-default text-text-primary placeholder:text-text-tertiary"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            aria-label="관측지 검색"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md glass text-text-secondary transition-colors hover:bg-surface-2"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {searchResults && searchResults.length > 0 && (
          <div className="mt-2 overflow-hidden rounded-2xl border border-border-default glass shadow-lg">
            {searchResults.map((site) => (
              <button
                key={site.id}
                onClick={() => goToDetail(site)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-2"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-interactive-link" aria-hidden="true" />
                <span className="text-text-primary">{site.name}</span>
              </button>
            ))}
          </div>
        )}
        {searchResults && searchResults.length === 0 && (
          <div className="mt-2 rounded-2xl border border-border-default glass px-3 py-2.5 text-sm text-text-tertiary">
            검색 결과가 없습니다.
          </div>
        )}
      </div>

      {/* 우하단 버튼 그룹 */}
      <div className="absolute right-4 bottom-[calc(34vh+1rem)] z-40 flex flex-col gap-2 md:bottom-6">
        <button
          onClick={goToMyLocation}
          disabled={locating}
          aria-label="내 위치로 이동"
          className="flex h-10 w-10 items-center justify-center rounded-full glass text-text-secondary shadow-lg transition-colors hover:bg-surface-2 disabled:opacity-60"
          title="내 위치로 이동"
        >
          <LocateFixed className={`h-4 w-4 ${locating ? "animate-pulse text-interactive-link" : ""}`} aria-hidden="true" />
        </button>

        <button
          onClick={toggleLightPollution}
          className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium shadow-lg transition-colors ${
            lpOn
              ? "bg-warning text-space-950"
              : "glass text-text-secondary hover:bg-surface-2"
          }`}
        >
          <Lamp className="h-4 w-4" aria-hidden="true" />
          광공해 {lpOn ? "ON" : "OFF"}
        </button>
      </div>

      {/* 모바일 하단 리스트 */}
      <div className="absolute inset-x-0 bottom-0 z-20 md:hidden">
        <div className="max-h-[34vh] overflow-y-auto rounded-t-2xl border-t border-border-default glass px-3 pb-4 pt-3">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-border-strong" />
          <h2 className="px-2 pb-1 text-sm font-semibold text-text-primary">
            관측지 <span className="font-mono text-xs text-text-tertiary">{sites.length}</span>
          </h2>
          {sites.map((site) => (
            <button
              key={site.id}
              onClick={() => goToDetail(site)}
              className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors hover:bg-surface-2"
            >
              <MapPin className="h-4 w-4 shrink-0 text-interactive-link" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-sm text-text-primary">{site.name}</span>
              {site.averageScore != null && (
                <span className="shrink-0 font-mono text-xs text-warning">★ {site.averageScore.toFixed(1)}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 클러스터 클릭 → 관측지 목록 바텀시트 */}
      {clusterSites && (
        <div className="absolute bottom-0 left-0 right-0 z-40 rounded-t-2xl border-t border-border-default bg-surface-1 shadow-2xl">
          <div className="sticky top-0 flex items-center justify-between rounded-t-2xl border-b border-border-default bg-surface-1 px-4 py-3">
            <span className="font-semibold text-text-primary">
              이 지역 관측지 <span className="font-mono text-text-secondary">{clusterSites.length}</span>곳
            </span>
            <button
              onClick={() => setClusterSites(null)}
              aria-label="닫기"
              className="rounded-full p-1 transition-colors hover:bg-surface-2"
            >
              <X className="h-4 w-4 text-text-tertiary" aria-hidden="true" />
            </button>
          </div>
          <div className="max-h-56 overflow-y-auto p-2 pb-4">
            {clusterSites.map((site) => (
              <button
                key={site.id}
                onClick={() => goToDetail(site)}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
              >
                <MapPin className="h-4 w-4 shrink-0 text-interactive-link" aria-hidden="true" />
                <span className="text-sm text-text-primary">{site.name}</span>
                {site.averageScore != null && (
                  <span className="ml-auto font-mono text-xs text-warning">★ {site.averageScore.toFixed(1)}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
