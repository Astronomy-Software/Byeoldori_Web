import Link from "next/link";
import { NavBar } from "@/components/nav-bar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Desktop: 사이드 네비게이션 */}
      <aside className="hidden md:flex md:w-20 md:flex-shrink-0 md:bg-bg-section">
        <NavBar />
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {children}
        <footer className="hidden md:flex justify-center gap-6 py-4 text-xs text-muted-foreground border-t border-border/30">
          <Link href="/privacy" className="hover:text-foreground transition-colors">개인정보처리방침</Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">서비스 이용약관</Link>
        </footer>
      </main>

      {/* Mobile: 하단 네비게이션 */}
      <div className="md:hidden">
        <NavBar />
      </div>
    </div>
  );
}
