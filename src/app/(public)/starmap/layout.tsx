import { pageMetadata } from "@/lib/seo";

// starmap/page.tsx는 클라이언트 컴포넌트라 metadata를 둘 수 없어 레이아웃에서 지정한다.
export const metadata = pageMetadata({
  title: "별지도",
  description:
    "지금 보이는 밤하늘을 실시간 별지도로 살펴보고, 별도리와 함께 별자리·천체 교육 프로그램을 따라 해 보세요.",
  path: "/starmap",
});

export default function StarmapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
