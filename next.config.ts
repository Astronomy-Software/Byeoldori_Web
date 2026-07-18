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
  "connect-src 'self' https://openapi.map.naver.com https://oapi.map.naver.com https://*.map.naver.com https://*.pstatic.net https://*.navercorp.com https://api.byeoldori.com https://byeoldori.duckdns.org https://storage.googleapis.com https://navermaps.github.io",
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
        // 전환기 호환 — 구 백엔드 도메인의 기존 이미지 URL
        protocol: "https",
        hostname: "byeoldori.duckdns.org",
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
