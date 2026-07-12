import { redirect } from "next/navigation";

// 웹은 소셜 온리 인증. 비밀번호 재설정 폐지 → 로그인으로 리다이렉트.
export default function ResetPasswordPage() {
  redirect("/login");
}
