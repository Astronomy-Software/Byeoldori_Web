import { redirect } from "next/navigation";

// 웹은 소셜 온리 인증(구글/카카오/네이버). 일반 회원가입 폐지 → 로그인으로 리다이렉트.
// (백엔드 auth/signup 엔드포인트는 안드로이드용으로 유지)
export default function SignupPage() {
  redirect("/login");
}
