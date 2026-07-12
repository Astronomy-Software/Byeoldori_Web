import { redirect } from "next/navigation";

// 웹은 소셜 온리 인증. 이메일 찾기 폐지 → 로그인으로 리다이렉트.
export default function FindEmailPage() {
  redirect("/login");
}
