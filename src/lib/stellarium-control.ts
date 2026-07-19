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

export class StellariumControl {
  private iframe: HTMLIFrameElement;
  private circleHandles: any[] = [];
  private geojsonHandles: any[] = [];

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
    this.circleHandles = [];
    this.geojsonHandles = [];
  }

  /** 별 선택 콜백 등록 */
  onStarSelected(callback: (name: string, types: string[]) => void): void {
    const api = this.api;
    if (api) api.onSelect = callback;
  }
}
