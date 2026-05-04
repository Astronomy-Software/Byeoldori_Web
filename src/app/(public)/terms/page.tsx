export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-8 px-4 py-10 text-sm text-foreground">
      <div>
        <h1 className="text-xl font-bold">서비스 이용약관</h1>
        <p className="mt-2 text-muted-foreground">
          별도리(Byeoldori) 서비스(이하 "서비스")를 이용하기 전에 아래 약관을 읽고 동의해 주세요.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="font-semibold">1. 서비스 이용 조건</h2>
        <p className="text-muted-foreground">
          서비스는 천체 관측 정보 공유, 교육 콘텐츠 제공, 커뮤니티 활동을 위한 플랫폼입니다.
          이 약관에 동의함으로써 이용자는 서비스의 모든 기능을 이용할 수 있습니다.
          만 14세 미만은 서비스를 이용할 수 없습니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">2. 계정 생성 및 관리</h2>
        <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
          <li>계정은 Google 소셜 로그인을 통해 생성됩니다.</li>
          <li>계정 정보는 정확하게 유지할 책임이 이용자에게 있습니다.</li>
          <li>타인의 계정을 무단으로 사용하는 것은 금지됩니다.</li>
          <li>계정 삭제는 마이페이지에서 직접 요청할 수 있습니다.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">3. 금지 행위</h2>
        <p className="text-muted-foreground">이용자는 다음 행위를 해서는 안 됩니다.</p>
        <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
          <li>타인의 권리를 침해하는 콘텐츠 업로드</li>
          <li>허위 정보 또는 부적절한 콘텐츠(음란물, 혐오 표현 등) 게시</li>
          <li>서비스의 정상적인 운영을 방해하는 행위</li>
          <li>다른 이용자의 개인정보 수집 또는 이용</li>
          <li>상업적 목적의 무단 광고 또는 스팸 행위</li>
        </ul>
        <p className="text-muted-foreground">
          금지 행위 적발 시 사전 통보 없이 계정이 제한 또는 삭제될 수 있습니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">4. 콘텐츠 책임</h2>
        <p className="text-muted-foreground">
          이용자가 게시한 콘텐츠(리뷰, 게시글, 사진 등)에 대한 법적 책임은 해당 이용자에게 있습니다.
          서비스는 이용자가 게시한 콘텐츠를 서비스 운영 및 홍보 목적으로 활용할 수 있습니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">5. 서비스 변경 및 중단</h2>
        <p className="text-muted-foreground">
          서비스는 운영상 필요에 따라 서비스 내용을 변경하거나 일시적으로 중단할 수 있습니다.
          중요한 변경 사항은 이메일 또는 서비스 내 공지를 통해 사전 안내합니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">6. 면책 조항</h2>
        <p className="text-muted-foreground">
          서비스는 천재지변, 시스템 장애 등 불가항력적 사유로 발생한 손해에 대해 책임지지 않습니다.
          기상 데이터 및 관측 정보는 참고용이며, 해당 정보를 기반으로 한 판단의 결과에 대해
          서비스는 책임지지 않습니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">7. 문의</h2>
        <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
          <li>담당자: 서범수</li>
          <li>이메일: <a href="mailto:beom710@gmail.com" className="underline hover:text-foreground">beom710@gmail.com</a></li>
          <li>전화: 010-4740-0710</li>
        </ul>
      </section>

      <p className="text-xs text-muted-foreground">시행일: 2026년 5월 1일</p>
    </article>
  );
}
