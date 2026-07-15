import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// 이 앱은 ISR을 쓰지 않아(정적 프리렌더 + 동적 SSR) incrementalCache 오버라이드를
// 두지 않는다. 추후 ISR이 필요해지면 R2 버킷을 만들고 r2IncrementalCache를 붙인다.
const config = defineCloudflareConfig();

export default {
  ...config,
  // Next 16은 next build가 기본 Turbopack인데, 그 출력으로 워커를 만들면 런타임에
  // "ChunkLoadError: Failed to load chunk server/chunks/ssr/..."로 SSR이 전부 500난다.
  // (@opennextjs/cloudflare 1.20.1 기준) → CF 빌드만 webpack으로 강제한다.
  // OpenNext는 기본적으로 `npm run build`를 실행하므로, 여기서 덮어써야
  // Vercel 빌드(package.json의 build 스크립트)는 그대로 둘 수 있다.
  buildCommand: "next build --webpack",
};
