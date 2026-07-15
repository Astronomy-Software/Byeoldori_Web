import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// 이 앱은 ISR을 쓰지 않아(정적 프리렌더 + 동적 SSR) incrementalCache 오버라이드를
// 두지 않는다. 추후 ISR이 필요해지면 R2 버킷을 만들고 r2IncrementalCache를 붙인다.
export default defineCloudflareConfig();
