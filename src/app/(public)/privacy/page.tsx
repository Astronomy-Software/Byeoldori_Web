export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-8 px-4 py-10 text-sm text-foreground">
      <div>
        <h1 className="text-xl font-bold">개인정보처리방침</h1>
        <p className="mt-2 text-muted-foreground">
          별도리(Byeoldori) 서비스(이하 "서비스")는 이용자의 개인정보를 중요하게 여기며, 관련 법령을 준수합니다.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="font-semibold">1. 수집하는 개인정보 항목</h2>
        <p className="text-muted-foreground">
          서비스는 Google OAuth 로그인 시 다음 정보를 수집합니다.
        </p>
        <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
          <li>이메일 주소</li>
          <li>닉네임(표시 이름)</li>
          <li>프로필 사진</li>
        </ul>
        <p className="text-muted-foreground">
          위 정보는 Google이 제공하는 값으로, 서비스가 별도로 저장하거나 수집하지 않습니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">2. 개인정보 수집 및 이용 목적</h2>
        <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
          <li>회원 가입 및 계정 식별</li>
          <li>서비스 제공(관측지 리뷰, 커뮤니티, 교육 콘텐츠 등)</li>
          <li>서비스 이용 기록 관리 및 부정 이용 방지</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">3. 개인정보 보유 및 이용 기간</h2>
        <p className="text-muted-foreground">
          이용자가 서비스 탈퇴를 요청하는 즉시 수집된 개인정보를 지체 없이 파기합니다.
          단, 관련 법령에 따라 보존 의무가 있는 경우 해당 기간 동안 보관합니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">4. 개인정보 제3자 제공</h2>
        <p className="text-muted-foreground">
          서비스는 이용자의 개인정보를 외부에 제공하지 않습니다.
          법령에 의해 요구되는 경우에는 예외로 합니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">5. 개인정보 처리 위탁</h2>
        <p className="text-muted-foreground">
          서비스는 원활한 운영을 위해 아래 업체에 개인정보 처리를 위탁합니다.
        </p>
        <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
          <li>Google LLC — 소셜 로그인 인증 처리</li>
          <li>Oracle Cloud Infrastructure — 서버 인프라 운영</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">6. 이용자의 권리</h2>
        <p className="text-muted-foreground">
          이용자는 언제든지 자신의 개인정보 열람, 수정, 삭제를 요청할 수 있습니다.
          계정 삭제는 마이페이지에서 직접 진행하거나 아래 연락처로 요청하실 수 있습니다.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">7. 개인정보 보호 책임자</h2>
        <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
          <li>성명: 서범수</li>
          <li>이메일: <a href="mailto:beom710@gmail.com" className="underline hover:text-foreground">beom710@gmail.com</a></li>
          <li>전화: 010-4740-0710</li>
        </ul>
      </section>

      <p className="text-xs text-muted-foreground">시행일: 2026년 5월 1일</p>
    </article>
  );
}
