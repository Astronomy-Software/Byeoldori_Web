import type { Metadata } from "next";

// observatory/page.tsx는 클라이언트 컴포넌트라 metadata를 둘 수 없어 레이아웃에서 탭 제목을 지정한다.
export const metadata: Metadata = { title: "관측지" };

export default function ObservatoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
