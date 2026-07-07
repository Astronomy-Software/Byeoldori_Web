import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://byeoldori-web.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 인증·개인 영역은 크롤링 제외
      disallow: [
        "/login",
        "/signup",
        "/find-email",
        "/reset-password",
        "/onboarding",
        "/mypage",
        "/auth/",
        "/api/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
