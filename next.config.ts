import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// 완만한 CSP — 앱을 깨지 않도록 안전 위주로 구성.
// script: Next 런타임/일부 라이브러리용 inline·eval 허용 + 네이버 지도·Live2D CDN
// img: data/blob 및 https 전반 허용 (네이버 지도 타일·백엔드 썸네일·아바타 등)
// connect: 자체 프록시(/api) 및 백엔드·네이버 지도 API
// frame: 자체 stellarium iframe
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://openapi.map.naver.com https://oapi.map.naver.com https://*.pstatic.net https://navermaps.github.io https://cubism.live2d.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://openapi.map.naver.com https://oapi.map.naver.com https://*.map.naver.com https://*.pstatic.net https://*.navercorp.com https://api.byeoldori.com https://storage.googleapis.com https://navermaps.github.io",
  "frame-src 'self'",
  "worker-src 'self' blob:",
]
  .join("; ")
  .concat(";");

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.byeoldori.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
    ],
  },
  compiler: {
    // 프로덕션 번들에서만 console 제거 (error/warn은 보존)
    removeConsole: isProd ? { exclude: ["error", "warn"] } : false,
  },
  // www → apex(canonical) 영구 리다이렉트. wrangler.jsonc가 www.byeoldori.com도 같은 Worker에 붙이므로
  // 앱에서 처리한다. www에 머물면 OAuth state(sessionStorage, 출처별)가 apex 콜백에서 안 보여
  // 소셜 로그인이 항상 실패하고, 같은 문서가 두 도메인으로 색인된다. 쿼리스트링은 Next가 그대로 넘긴다.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www\\.byeoldori\\.com" }],
        destination: "https://byeoldori.com/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: csp,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
