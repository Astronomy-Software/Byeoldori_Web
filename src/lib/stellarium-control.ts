"use client";

// Stellarium iframe 직접 제어 레이어 (same-origin iframe.contentWindow 접근)
// sw_helpers.js의 onReady 이후 window.__stellariumAPI 가 설정되어 있어야 함

type StelAPI = {
  stel: any;
  eduLayer: any;
  onSelect: ((name: string, types: string[]) => void) | null;
  lastSelected: any;
};

function getAPI(iframe: HTMLIFrameElement): StelAPI | null {
  try {
    const win = iframe.contentWindow as any;
    return win?.__stellariumAPI ?? null;
  } catch {
    return null;
  }
}

export type SkyImageParams = {
  url: string;
  ra: number; // 度 (ICRF)
  dec: number; // 度 (ICRF)
  sizeDeg: number; // 이미지 가로폭이 하늘에서 차지하는 각도
  rotation?: number; // 度
};

// 백엔드 파일 서버 호스트. 엔진(iframe)은 이미지를 fetch 로 받아 wasm 안에서 디코딩하므로
// 다른 출처 URL 은 CORS 에 막힌다. 이 호스트들의 URL 은 같은 출처 프록시(/api/...)로 돌린다.
const BACKEND_HOSTS = [
  process.env.NEXT_PUBLIC_API_URL,
  "https://api.byeoldori.com",
]
  .filter((h): h is string => !!h)
  .map((h) => h.replace(/\/+$/, ""));

/** 엔진이 읽을 수 있는 같은 출처 URL 로 바꾼다. blob:/data: 와 이미 같은 출처인 URL 은 그대로 둔다. */
export function toEngineImageUrl(url: string): string {
  const trimmed = url.trim();
  if (typeof window === "undefined") return trimmed;
  if (/^(blob:|data:)/.test(trimmed)) return trimmed;
  for (const host of BACKEND_HOSTS) {
    if (trimmed.startsWith(host + "/")) {
      return `${window.location.origin}/api${trimmed.slice(host.length)}`;
    }
  }
  if (trimmed.startsWith("/")) return `${window.location.origin}${trimmed}`;
  return trimmed;
}

// 엔진 photo 는 크기를 "픽셀당 각초(pixscale)"로 받으므로 이미지 픽셀폭이 필요하다.
function loadImageSize(url: string): Promise<{ w: number; h: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () =>
      resolve(img.naturalWidth > 0 ? { w: img.naturalWidth, h: img.naturalHeight } : null);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export class StellariumControl {
  private iframe: HTMLIFrameElement;
  private circleHandles: any[] = [];
  private geojsonHandles: any[] = [];
  private photoHandles: any[] = [];
  // 저작 화면에서 편집 중인 하늘 이미지 1장. 값이 바뀔 때마다 새로 만들어 교체한다.
  private previewHandle: any = null;
  private previewSeq = 0;

  constructor(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
  }

  private get api(): StelAPI | null {
    return getAPI(this.iframe);
  }

  isReady(): boolean {
    const api = this.api;
    return !!(api?.stel && api?.eduLayer);
  }

  waitForReady(maxMs = 30000): Promise<boolean> {
    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        if (this.isReady()) { resolve(true); return; }
        if (Date.now() - start > maxMs) { resolve(false); return; }
        setTimeout(check, 500);
      };
      check();
    });
  }

  /**
   * 별 카탈로그가 실제로 조회 가능해질 때까지 대기.
   * isReady()(=__stellariumAPI 존재)가 true여도 카탈로그는 비동기로 나중에 로드되어,
   * 그 사이 getObj()는 모든 이름에 null을 반환한다. 이 상태에서 프로그램을 시작하면
   * camera-move·highlight-stars·draw-line 이 조용히 실패한다(브라우저 실측으로 확인).
   * Rigel 은 기본 밝은별 카탈로그에 항상 포함되므로 준비 판별용 표본으로 쓴다.
   */
  waitForCatalog(maxMs = 15000, sample = "Rigel"): Promise<boolean> {
    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        try {
          if (this.api?.stel?.getObj(sample)) { resolve(true); return; }
        } catch {
          // 엔진 준비 전이면 무시하고 재시도
        }
        if (Date.now() - start > maxMs) { resolve(false); return; }
        setTimeout(check, 400);
      };
      check();
    });
  }

  /** 특정 별/천체로 카메라 이동 */
  gotoStar(name: string, duration = 2.0): boolean {
    const api = this.api;
    if (!api) return false;
    try {
      const obj = api.stel.getObj(name);
      if (!obj) { console.warn(`[Stel] 별 없음: ${name}`); return false; }
      api.stel.pointAndLock(obj, duration);
      return true;
    } catch (e) {
      console.error("[Stel] gotoStar 오류:", e);
      return false;
    }
  }

  /** FOV 설정 */
  zoomTo(fovDeg: number, duration = 1.0): void {
    try {
      const api = this.api;
      if (!api) return;
      api.stel.zoomTo((fovDeg * Math.PI) / 180, duration);
    } catch (e) {
      console.error("[Stel] zoomTo 오류:", e);
    }
  }

  /** 별 주변에 빨간 원 강조 */
  highlightStars(
    names: string[],
    color: [number, number, number, number] = [1, 0.2, 0.2, 1],
    radiusDeg = 2.0,
  ): void {
    const api = this.api;
    if (!api) return;
    const { stel, eduLayer } = api;
    const rad = (radiusDeg * Math.PI) / 180;

    for (const name of names) {
      try {
        const obj = stel.getObj(name);
        if (!obj) { console.warn(`[Stel] highlight 대상 없음: ${name}`); continue; }
        const radec = obj.getInfo("radec");
        if (!radec) continue;
        const pos = stel.convertFrame(stel.core.observer, "ICRF", "JNOW", radec);
        const circle = eduLayer.add("circle", {
          pos,
          frame: stel.FRAME_JNOW,
          size: [rad * 2, rad * 2],
          color: [color[0], color[1], color[2], color[3] * 0.12],
          border_color: color,
        });
        if (circle) this.circleHandles.push(circle);
      } catch (e) {
        console.error(`[Stel] highlightStar 오류 (${name}):`, e);
      }
    }
  }

  /** 두 별 사이에 하늘 고정 선 그리기 (native GeoJSON ICRF 대원호) */
  drawLine(
    from: string,
    to: string,
    color: [number, number, number, number] = [0.2, 0.8, 1, 0.9],
    widthPx = 2.0,
  ): boolean {
    const api = this.api;
    if (!api) return false;
    const { stel, eduLayer } = api;

    const getICRFDeg = (name: string): [number, number] | null => {
      try {
        const obj = stel.getObj(name);
        if (!obj) return null;
        const v = obj.getInfo("radec"); // ICRF unit vec [x,y,z,0]
        const raRad = Math.atan2(v[1], v[0]);
        const decRad = Math.asin(Math.min(1, Math.max(-1, v[2])));
        const raDeg = (raRad < 0 ? raRad + 2 * Math.PI : raRad) * (180 / Math.PI);
        return [raDeg, decRad * (180 / Math.PI)];
      } catch { return null; }
    };

    const fromPos = getICRFDeg(from);
    const toPos = getICRFDeg(to);
    if (!fromPos || !toPos) {
      console.warn(`[Stel] drawLine: 별 없음 ${from} → ${to}`);
      return false;
    }

    const hex = "#" + [color[0], color[1], color[2]]
      .map((c) => Math.round(c * 255).toString(16).padStart(2, "0"))
      .join("");

    const geojson = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        geometry: { type: "LineString", coordinates: [fromPos, toPos] },
        properties: {
          "stroke": hex,
          "stroke-opacity": color[3],
          "stroke-width": widthPx,
          "stroke-glow": true,
        },
      }],
    };

    try {
      const handle = eduLayer.add("geojson", { data: geojson });
      if (handle) { this.geojsonHandles.push(handle); return true; }
    } catch (e) {
      console.error("[Stel] drawLine 오류:", e);
    }
    return false;
  }

  /**
   * 하늘(적도좌표)에 고정되는 이미지를 붙인다 — 엔진 네이티브 photo 오브젝트.
   * 엔진은 투영 행렬을 첫 렌더 때 한 번만 계산하므로, 위치·크기를 바꾸려면 새로 만들어야 한다.
   * 엔진 디코더(stb_image)는 JPG/PNG 만 읽는다.
   */
  async addSkyImage(p: SkyImageParams): Promise<boolean> {
    const handle = await this.createPhoto(p);
    if (!handle) return false;
    this.photoHandles.push(handle);
    return true;
  }

  /** 저작 미리보기 — 직전 미리보기를 지우고 새 값으로 다시 붙인다. 빠른 연속 입력에선 마지막 것만 남긴다. */
  async previewSkyImage(p: SkyImageParams | null): Promise<boolean> {
    const seq = ++this.previewSeq;
    if (!p) {
      this.removePreview();
      return true;
    }
    const handle = await this.createPhoto(p);
    if (seq !== this.previewSeq) {
      // 기다리는 사이 더 새로운 미리보기 요청이 왔다 — 이 결과는 버린다
      if (handle) this.removeHandle(handle);
      return false;
    }
    this.removePreview();
    this.previewHandle = handle;
    return !!handle;
  }

  private removePreview(): void {
    if (this.previewHandle) this.removeHandle(this.previewHandle);
    this.previewHandle = null;
  }

  private removeHandle(h: any): void {
    try {
      this.api?.eduLayer.remove(h);
    } catch {
      // 이미 제거된 핸들
    }
  }

  private async createPhoto(p: SkyImageParams): Promise<any | null> {
    if (!this.api || !p.url || !(p.sizeDeg > 0)) return null;
    const url = toEngineImageUrl(p.url);
    if (url.length > 1000) {
      // 엔진의 url 버퍼가 1024바이트다
      console.warn("[Stel] 하늘 이미지 URL 이 너무 깁니다");
      return null;
    }
    const size = await loadImageSize(url);
    if (!size) {
      console.warn(`[Stel] 하늘 이미지 로드 실패: ${url}`);
      return null;
    }
    const api = this.api;
    if (!api) return null;
    try {
      const handle = api.eduLayer.add("photo", {
        url,
        // 배열로 감싸야 한다. 엔진의 photo_fn_calibration 은 인자를 배열로 보고 첫 원소를
        // 읽는데, 객체를 그대로 넘기면 union 을 잘못 해석해 값이 전부 0 이 된다(브라우저 실측).
        calibration: [
          {
            ra: p.ra,
            dec: p.dec,
            orientation: p.rotation ?? 0,
            pixscale: (p.sizeDeg * 3600) / size.w, // 각초/픽셀
          },
        ],
      });
      if (!handle) return null;
      try {
        handle.visible = true; // 페이더가 서서히 나타나게 한다
      } catch {
        // visible 속성이 없는 빌드면 기본값으로 둔다
      }
      return handle;
    } catch (e) {
      console.error("[Stel] 하늘 이미지 추가 오류:", e);
      return null;
    }
  }

  /** 현재 화면 중심의 적경·적위(度, ICRF). 저작 시 "화면 중심에 배치"에 쓴다. */
  getViewCenterRaDec(): { ra: number; dec: number } | null {
    try {
      const api = this.api;
      if (!api) return null;
      const { stel } = api;
      const obs = stel.core.observer;
      const v = stel.s2c(obs.yaw, obs.pitch);
      const icrf = stel.convertFrame(obs, "OBSERVED", "ICRF", v);
      const [theta, phi] = stel.c2s(icrf);
      const R = 180 / Math.PI;
      return { ra: +(stel.anp(theta) * R).toFixed(4), dec: +(phi * R).toFixed(4) };
    } catch (e) {
      console.error("[Stel] getViewCenterRaDec 오류:", e);
      return null;
    }
  }

  /** 천체 이름의 적경·적위(度, ICRF). */
  getObjectRaDec(name: string): { ra: number; dec: number } | null {
    try {
      const api = this.api;
      if (!api) return null;
      const obj = api.stel.getObj(name);
      if (!obj) return null;
      const [theta, phi] = api.stel.c2s(obj.getInfo("radec"));
      const R = 180 / Math.PI;
      return { ra: +(api.stel.anp(theta) * R).toFixed(4), dec: +(phi * R).toFixed(4) };
    } catch {
      return null;
    }
  }

  /** 관측 시각 설정 (JS Date → MJD-UTC). observer.utc가 MJD-UTC 값(sw_helpers:251) */
  setTime(date: Date): void {
    try {
      const api = this.api;
      if (!api) return;
      const mjd = date.getTime() / 86400000 + 40587; // Unix ms → MJD(UTC)
      api.stel.core.observer.utc = mjd;
    } catch (e) {
      console.error("[Stel] setTime 오류:", e);
    }
  }

  /** 시간 흐름 속도 (1=실시간, 0=정지, 3600=1초에 1시간). 미지정 시 정지 */
  setTimeSpeed(speed = 0): void {
    try {
      const api = this.api;
      if (!api) return;
      api.stel.core.time_speed = speed;
    } catch (e) {
      console.error("[Stel] setTimeSpeed 오류:", e);
    }
  }

  /**
   * 현재 화면 시점을 그대로 읽어온다 (감독모드 "이 장면 캡처"의 핵심).
   * 엔진은 observer.yaw(방위각)·observer.pitch(고도)·core.fov 를 라디안으로
   * 읽고 쓸 수 있다(sw_helpers 의 공유링크 생성과 동일한 방식). 저작 편의를 위해 度로 변환해 담는다.
   */
  getCurrentView(): { az: number; alt: number; fov: number; time: string } | null {
    try {
      const api = this.api;
      if (!api) return null;
      const core = api.stel.core;
      const R = 180 / Math.PI;
      // observer.utc 는 MJD-UTC → Unix ms 역변환
      const unixMs = (core.observer.utc - 40587) * 86400000;
      return {
        az: +(core.observer.yaw * R).toFixed(4),
        alt: +(core.observer.pitch * R).toFixed(4),
        fov: +(core.fov * R).toFixed(4),
        time: new Date(unixMs).toISOString(),
      };
    } catch (e) {
      console.error("[Stel] getCurrentView 오류:", e);
      return null;
    }
  }

  /**
   * 캡처해둔 시점으로 이동 (度 입력). 별 이름이 아닌 임의 방향을 가리킬 수 있어
   * gotoStar 로 표현 못 하는 장면(성운 주변·빈 하늘 구도 등)도 재현된다.
   */
  lookAt(view: { az: number; alt: number; fov?: number }): void {
    try {
      const api = this.api;
      if (!api) return;
      const core = api.stel.core;
      const D = Math.PI / 180;
      // gotoStar(pointAndLock)로 대상이 lock 되어 있으면 엔진이 매 프레임 시점을
      // 그 대상으로 되돌려 yaw/pitch 쓰기가 무효화된다. 먼저 lock을 푼다.
      try {
        core.lock = null;
      } catch {
        // lock 속성이 없는 빌드면 무시
      }
      core.observer.yaw = view.az * D;
      core.observer.pitch = view.alt * D;
      if (view.fov !== undefined) core.fov = view.fov * D;
    } catch (e) {
      console.error("[Stel] lookAt 오류:", e);
    }
  }

  /** 별자리 선/이름/그림 on-off */
  toggleConstellations(opts: {
    lines?: boolean;
    labels?: boolean;
    images?: boolean;
  }): void {
    try {
      const api = this.api;
      if (!api) return;
      const c = api.stel.core.constellations;
      if (opts.lines !== undefined) c.lines_visible = opts.lines;
      if (opts.labels !== undefined) c.labels_visible = opts.labels;
      if (opts.images !== undefined) c.images_visible = opts.images;
    } catch (e) {
      console.error("[Stel] toggleConstellations 오류:", e);
    }
  }

  /** 모든 교육용 오버레이 제거 */
  clearOverlays(): void {
    const api = this.api;
    if (!api) return;
    const { eduLayer } = api;
    for (const h of this.circleHandles) {
      try { eduLayer.remove(h); } catch {}
    }
    for (const h of this.geojsonHandles) {
      try { eduLayer.remove(h); } catch {}
    }
    for (const h of this.photoHandles) {
      try { eduLayer.remove(h); } catch {}
    }
    this.circleHandles = [];
    this.geojsonHandles = [];
    this.photoHandles = [];
    this.previewSeq++;
    this.removePreview();
  }

  /** 별 선택 콜백 등록 */
  onStarSelected(callback: (name: string, types: string[]) => void): void {
    const api = this.api;
    if (api) api.onSelect = callback;
  }
}
