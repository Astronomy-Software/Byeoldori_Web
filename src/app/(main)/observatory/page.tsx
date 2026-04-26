"use client";

import { useEffect, useState, useRef } from "react";
import { getAllSites, getSitesByKeyword } from "@/lib/api/observation-sites";
import type { ObservationSite } from "@/types/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Search } from "lucide-react";

declare global {
  interface Window {
    naver: {
      maps: {
        Map: new (el: HTMLElement, opts: Record<string, unknown>) => NaverMap;
        LatLng: new (lat: number, lng: number) => NaverLatLng;
        Marker: new (opts: Record<string, unknown>) => NaverMarker;
        Event: {
          addListener: (
            target: unknown,
            event: string,
            handler: () => void,
          ) => void;
        };
      };
    };
  }
}

interface NaverMap {
  setCenter: (latlng: NaverLatLng) => void;
  setZoom: (zoom: number) => void;
}
interface NaverLatLng {
  lat: () => number;
  lng: () => number;
}
interface NaverMarker {
  setMap: (map: NaverMap | null) => void;
}

export default function ObservatoryPage() {
  const [sites, setSites] = useState<ObservationSite[]>([]);
  const [filtered, setFiltered] = useState<ObservationSite[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ObservationSite | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const naverMapRef = useRef<NaverMap | null>(null);
  const markersRef = useRef<NaverMarker[]>([]);

  useEffect(() => {
    getAllSites()
      .then((page) => {
        setSites(page.content);
        setFiltered(page.content);
      })
      .catch(() => {});
  }, []);

  // 네이버 지도 로드
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
    if (!clientId) return;

    const existing = document.getElementById("naver-map-script");
    if (existing) {
      initMap();
      return;
    }

    const script = document.createElement("script");
    script.id = "naver-map-script";
    // NCP가 2024년부터 ncpClientId → ncpKeyId 전환 중. 둘 다 보내면 호환.
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
  }

  // 마커 업데이트
  useEffect(() => {
    if (!naverMapRef.current || !window.naver) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const map = naverMapRef.current;
    filtered.forEach((site) => {
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(site.latitude, site.longitude),
        map,
      });
      window.naver.maps.Event.addListener(marker, "click", () => {
        setSelected(site);
        map.setCenter(
          new window.naver.maps.LatLng(site.latitude, site.longitude),
        );
        map.setZoom(12);
      });
      markersRef.current.push(marker);
    });
  }, [filtered]);

  // 서버 검색 API 사용
  async function handleSearch() {
    if (!search.trim()) {
      setFiltered(sites);
      return;
    }
    setIsSearching(true);
    try {
      const results = await getSitesByKeyword(search.trim());
      setFiltered(results);
    } catch {
      // 검색 실패 시 클라이언트 필터로 폴백
      setFiltered(sites.filter((s) => s.name.includes(search)));
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* 사이드 패널 */}
      <div className="w-full overflow-y-auto border-b border-border p-4 md:w-80 md:border-b-0 md:border-r">
        <h1 className="mb-4 text-xl font-bold text-foreground">관측지</h1>

        <div className="mb-3 flex gap-2">
          <Input
            placeholder="관측지 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSearch}
            disabled={isSearching}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          {filtered.map((site) => (
            <button
              key={site.id}
              onClick={() => {
                setSelected(site);
                if (naverMapRef.current && window.naver) {
                  naverMapRef.current.setCenter(
                    new window.naver.maps.LatLng(site.latitude, site.longitude),
                  );
                  naverMapRef.current.setZoom(12);
                }
              }}
              className={`w-full rounded-lg p-3 text-left transition-colors ${
                selected?.id === site.id
                  ? "border border-purple-500/50 bg-purple-500/20"
                  : "bg-card/30 hover:bg-card/50"
              }`}
            >
              <p className="text-sm font-medium text-foreground">
                <MapPin className="mr-1 inline h-3 w-3 text-purple-400" />
                {site.name}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* 지도 */}
      <div className="flex-1">
        <div
          ref={mapRef}
          className="h-[400px] w-full md:h-full"
          style={{ minHeight: 400 }}
        >
          {!process.env.NEXT_PUBLIC_NAVER_CLIENT_ID && (
            <div className="flex h-full items-center justify-center bg-card text-sm text-muted-foreground">
              네이버 지도를 사용하려면 NEXT_PUBLIC_NAVER_CLIENT_ID 환경 변수를
              설정해주세요.
            </div>
          )}
        </div>

        {/* 선택된 관측지 상세 */}
        {selected && (
          <div className="absolute bottom-20 left-4 right-4 rounded-xl bg-card/95 p-4 backdrop-blur md:bottom-4 md:left-auto md:right-4 md:w-80">
            <h3 className="font-semibold text-foreground">{selected.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              좌표: {selected.latitude.toFixed(4)}, {selected.longitude.toFixed(4)}
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="mt-2"
              onClick={() => setSelected(null)}
            >
              닫기
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
