import { AuthGuard } from "@/components/auth-guard";
import { NavBar } from "@/components/nav-bar";
import { Live2DCharacter } from "@/components/live2d-character";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col md:flex-row">
        {/* Desktop: 사이드 네비게이션 */}
        <aside className="hidden md:flex md:w-20 md:flex-shrink-0 md:bg-purple-800">
          <NavBar />
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>

        {/* Mobile: 하단 네비게이션 */}
        <div className="md:hidden">
          <NavBar />
        </div>
      </div>

      {/* Live2D 마스코트 오버레이 */}
      <Live2DCharacter />
    </AuthGuard>
  );
}
