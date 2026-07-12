"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, Users, User, Star, Sparkles } from "lucide-react";

const navItems = [
  { href: "/home", label: "홈", icon: Home },
  { href: "/starmap", label: "별지도", icon: Star },
  { href: "/observatory", label: "관측지", icon: MapPin },
  { href: "/community", label: "커뮤니티", icon: Users },
  { href: "/mypage", label: "마이페이지", icon: User },
] as const;

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="glass fixed bottom-0 left-0 right-0 z-50 border-t border-border-default bg-bg-section/80 md:relative md:bottom-auto md:h-full md:border-t-0 md:border-r">
      {/* Desktop: 브랜드 로고 */}
      <Link
        href="/home"
        aria-label="별도리 홈"
        className="hidden md:flex md:items-center md:justify-center md:py-6"
      >
        <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-interactive-primary/15">
          <Sparkles className="h-5 w-5 text-aurora" />
        </span>
      </Link>

      <div className="flex items-center justify-around py-2 md:flex-col md:justify-start md:gap-2 md:px-3 md:py-0">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`group relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors md:w-full md:py-2.5 ${
                isActive
                  ? "bg-surface-2 text-text-primary"
                  : "text-text-tertiary hover:text-text-primary"
              }`}
            >
              {/* 액티브 표시: 오로라 점 (데스크톱) */}
              {isActive && (
                <span className="absolute left-1 top-1/2 hidden h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-aurora md:block" />
              )}
              <Icon className={`h-5 w-5 ${isActive ? "text-aurora" : ""}`} />
              <span className="text-[10px] font-bold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
