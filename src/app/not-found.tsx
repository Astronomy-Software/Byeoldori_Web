import Link from "next/link";
import { Star } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/20">
        <Star className="h-8 w-8 text-purple-400" />
      </div>
      <h1 className="text-3xl font-bold text-foreground">404</h1>
      <p className="text-sm text-muted-foreground">
        요청하신 페이지를 찾을 수 없습니다.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-500"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
