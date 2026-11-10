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
  return (
    <>
      {children}
      {/* 별지도는 전체 화면 iframe 앱이라 검색엔진이 읽을 본문이 거의 없어 '크롤링됨 - 색인 안 됨' 상태였다.
          서버에서 렌더링되는 소개 문단을 지도(h-screen) 아래에 둔다 — 지도 화면 배치는 그대로다.
          고정된 마스코트 캔버스(z-40)가 스크롤한 글을 가리지 않게 배경을 채워 그 위(z-45)에 둔다. */}
      <section
        aria-labelledby="starmap-intro-title"
        className="relative z-[45] bg-background"
      >
        <div className="mx-auto max-w-2xl space-y-3 px-4 pb-28 pt-10 text-sm leading-relaxed text-muted-foreground md:pb-12">
          <h1 id="starmap-intro-title" className="text-lg font-semibold text-foreground">
            별도리 실시간 별지도
          </h1>
          <p>
            별도리 별지도는 지금 이 시각의 밤하늘을 브라우저에서 바로 보여 주는 실시간 별지도입니다. 별자리 선과
            이름, 행성과 달의 위치가 함께 표시되고, 화면을 끌거나 확대해 원하는 방향의 하늘을 살펴볼 수 있습니다.
            찾고 싶은 별이나 천체 이름을 검색하면 그 자리로 바로 이동합니다.
          </p>
          <p>
            교육 모드를 켜면 별도리 캐릭터가 &quot;북두칠성 찾기&quot;, &quot;오리온자리 이야기&quot; 같은 프로그램을
            따라 별지도를 직접 움직이며 설명해 줍니다. 처음 별을 보는 사람도 어느 방향에서 무엇을 찾으면 되는지
            단계별로 익힐 수 있습니다.
          </p>
          <p>
            관측을 나가기 전에는 관측지 메뉴에서 장소별 날씨와 관측 적합도를 함께 확인해 보세요. 별지도는 오픈소스
            Stellarium Web Engine을 바탕으로 만들었습니다.
          </p>
        </div>
      </section>
    </>
  );
}
