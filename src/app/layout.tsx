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

// 컷오버(byeoldori.com) 시 NEXT_PUBLIC_SITE_URL 환경변수로 교체한다.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://byeoldori-web.vercel.app";

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
    google: "Ym-2QxytT69t-FAy10lptmLTYqScPCKQINN9o1f0oUE",
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
