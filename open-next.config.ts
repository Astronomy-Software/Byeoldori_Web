import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// 이 앱은 ISR을 쓰지 않는다(정적 프리렌더 + 동적 SSR). 기본값("dummy" 캐시)은 아무것도 읽지 못해
// 빌드 때 프리렌더한 /, /starmap, /privacy, /terms, sitemap.xml 까지 매 요청 Worker에서 다시 렌더링한다.
// → 읽기 전용 정적 자산 캐시로 프리렌더 결과(assets/cdn-cgi/_next_cache)를 그대로 서빙한다. R2 불필요.
//   채우기는 `opennextjs-cloudflare deploy`(wrangler deploy가 OpenNext 프로젝트면 자동 위임)가 한다.
// 추후 ISR이 필요해지면 R2 버킷을 만들고 r2IncrementalCache로 바꾼다.
const config = defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  // 프리렌더 페이지는 NextServer를 거치지 않고 캐시에서 바로 응답(라우팅·헤더·리다이렉트는 그 전에 적용됨).
  enableCacheInterception: true,
});

export default {
  ...config,
  // Next 16은 next build가 기본 Turbopack인데, 그 출력으로 워커를 만들면 런타임에
  // "ChunkLoadError: Failed to load chunk server/chunks/ssr/..."로 SSR이 전부 500난다.
  // (@opennextjs/cloudflare 1.20.1 기준) → CF 빌드만 webpack으로 강제한다.
  // OpenNext는 기본적으로 `npm run build`를 실행하므로, 여기서 덮어써야
  // Vercel 빌드(package.json의 build 스크립트)는 그대로 둘 수 있다.
  buildCommand: "next build --webpack",
};
