import type { Metadata } from "next";

// community/page.tsx는 클라이언트 컴포넌트라 metadata를 둘 수 없어 레이아웃에서 탭 제목을 지정한다.
export const metadata: Metadata = { title: "커뮤니티" };

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
