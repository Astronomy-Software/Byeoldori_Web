import type { Metadata } from "next";

// 프로덕션 정식 도메인. 프리뷰 등에서만 NEXT_PUBLIC_SITE_URL로 오버라이드한다.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://byeoldori.com";

export const SITE_NAME = "별도리";

// 공유 미리보기용 1200x630 이미지(public/og-image.jpg).
export const OG_IMAGE = {
  url: "/og-image.jpg",
  width: 1200,
  height: 630,
  alt: SITE_NAME,
} as const;

// Next metadata는 openGraph를 통째로 덮어쓰므로(필드 병합 없음),
// 하위 페이지가 og:image·siteName을 잃지 않게 공통 값을 여기서 함께 만든다.
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: `/${string}`;
}): Metadata {
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: opts.path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "ko_KR",
      title: `${opts.title} | ${SITE_NAME}`,
      description: opts.description,
      url: opts.path,
      images: [OG_IMAGE],
    },
  };
}
