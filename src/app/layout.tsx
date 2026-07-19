import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 프로덕션 정식 도메인. 프리뷰 등에서만 NEXT_PUBLIC_SITE_URL로 오버라이드한다.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://byeoldori.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "별도리 - 천체 관측 교육 플랫폼",
    template: "%s | 별도리",
  },
  description:
    "천체 관측 초보자를 위한 교육 플랫폼. 별지도, 관측지 추천, 커뮤니티를 제공합니다.",
  openGraph: {
    type: "website",
    siteName: "별도리",
    title: "별도리 - 천체 관측 교육 플랫폼",
    description:
      "천체 관측 초보자를 위한 교육 플랫폼. 별지도, 관측지 추천, 커뮤니티를 제공합니다.",
    url: siteUrl,
    locale: "ko_KR",
    images: [
      {
        url: "/byeoldori.png",
        width: 1200,
        height: 630,
        alt: "별도리",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    // 도메인 변경(byeoldori.com)으로 새로 발급받은 토큰과 기존 토큰을 함께 둔다.
    // 구글은 한 페이지에 여러 소유확인 토큰을 허용하므로, 기존 속성이
    // 소유확인 해제되는 일 없이 새 속성을 추가로 확인할 수 있다.
    google: [
      "yD5fFcSPnA2UZWNdT9V8NYt5v3MrlCwZw3smKXTNPyY",
      "Ym-2QxytT69t-FAy10lptmLTYqScPCKQINN9o1f0oUE",
    ],
    other: {
      "naver-site-verification": "425432fa0bbb7c7a48d0e9088f3d22a0c188585b",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
