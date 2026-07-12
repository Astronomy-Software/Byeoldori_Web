import Link from "next/link";
import { Star } from "lucide-react";

export default function NotFound() {
  return (
    <div className="starfield flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="glow-primary flex h-16 w-16 items-center justify-center rounded-2xl bg-interactive-primary/15">
        <Star className="h-8 w-8 text-aurora" />
      </div>
      <h1 className="text-3xl font-bold text-text-primary">404</h1>
      <p className="text-sm text-text-secondary">
        요청하신 페이지를 찾을 수 없습니다.
      </p>
      <Link
        href="/"
        className="glow-primary mt-2 rounded-xl bg-interactive-primary px-6 py-3 text-sm font-semibold text-text-on-primary transition hover:brightness-110"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
