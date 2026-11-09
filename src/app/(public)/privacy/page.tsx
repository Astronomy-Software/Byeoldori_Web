import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "개인정보처리방침",
  description:
    "별도리(Byeoldori) 서비스가 수집하는 개인정보 항목, 이용 목적, 보유 기간과 이용자의 권리를 안내합니다.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-8 px-4 py-10 text-sm text-foreground">
      <div>
        <h1 className="text-xl font-bold">개인정보처리방침</h1>
        <p className="mt-2 text-muted-foreground">
          별도리(Byeoldori) 서비스(이하 &quot;서비스&quot;)는 이용자의 개인정보를 중요하게 여기며, 관련 법령을 준수합니다.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="font-semibold">1. 수집하는 개인정보 항목</h2>
        <p className="text-muted-foreground">서비스는 다음 정보를 수집해 서버에 저장합니다.</p>
        <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
          <li>
            이메일로 가입할 때: 이메일 주소, 비밀번호(암호화해 저장), 이름, 휴대폰 번호, 닉네임,
            생년월일(선택)
          </li>
          <li>
            Google·카카오·네이버로 로그인할 때: 각 서비스가 제공하는 이메일 주소, 닉네임(이름),
            프로필 사진, 회원 식별값
          </li>
          <li>
            서비스 이용 중 생기는 정보: 프로필 사진, 관측 일정과 관측 사진, 즐겨찾기한 관측지, 알림,
            퀴즈 응시 기록, 게시글·댓글·좋아요, 마지막 로그인 시각과 로그인 유지용 세션 정보
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">2. 개인정보 수집 및 이용 목적</h2>
        <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
          <li>회원 가입 및 계정 식별, 로그인 유지</li>
          <li>이메일(아이디) 찾기와 비밀번호 재설정 시 본인 확인(이름·휴대폰 번호)</li>
          <li>가입 인증·비밀번호 재설정 안내 메일 발송</li>
          <li>서비스 제공(관측 일정, 관측지 리뷰, 커뮤니티, 교육 콘텐츠 등)</li>
          <li>서비스 이용 기록 관리 및 부정 이용 방지</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">3. 개인정보 보유 및 이용 기간</h2>
        <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
          <li>
            회원 탈퇴 시 즉시 계정 정보(이메일·이름·휴대폰 번호·생년월일·닉네임·프로필 사진·로그인 연동
            정보)를 삭제하거나 알아볼 수 없게 바꾸고, 관측 일정·관측 사진·즐겨찾기·알림·퀴즈 기록·로그인
            세션을 삭제합니다.
          </li>
          <li>
            작성한 게시글과 댓글은 다른 이용자의 대화 맥락을 위해 &quot;탈퇴한 사용자&quot;로 표시되어
            남습니다. 삭제를 원하시면 탈퇴 전에 직접 지우거나 아래 연락처로 요청해 주세요.
          </li>
          <li>장애 복구용 백업은 서버에 7일 동안 보관한 뒤 자동으로 삭제합니다.</li>
          <li>서버 처리 기록(로그)은 30일 동안 보관한 뒤 자동으로 삭제합니다.</li>
          <li>관련 법령에 따라 보존 의무가 있는 경우 해당 기간 동안 보관합니다.</li>
        </ul>
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
          <li>Google LLC — 소셜 로그인 인증, 인증·안내 메일 발송(Gmail)</li>
          <li>카카오 — 소셜 로그인 인증</li>
          <li>네이버 — 소셜 로그인 인증</li>
          <li>Oracle Cloud Infrastructure — 서버·데이터베이스 운영, 백업 보관</li>
          <li>Cloudflare — 웹사이트 호스팅·전송, 문의 메일 전달</li>
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
          <li>이메일: <a href="mailto:support@byeoldori.com" className="underline hover:text-foreground">support@byeoldori.com</a></li>
        </ul>
      </section>

      <p className="text-xs text-muted-foreground">시행일: 2026년 11월 6일 (이전: 2026년 5월 1일)</p>
    </article>
  );
}
