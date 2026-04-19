"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, Users, User, Star, Bell } from "lucide-react";
import { getUnreadCount } from "@/lib/api/notification";
import { useAuthStore } from "@/stores/auth-store";

const navItems = [
  { href: "/home", label: "홈", icon: Home },
  { href: "/starmap", label: "별지도", icon: Star },
  { href: "/observatory", label: "관측지", icon: MapPin },
  { href: "/community", label: "커뮤니티", icon: Users },
  { href: "/mypage", label: "마이페이지", icon: User },
] as const;

export function NavBar() {
  const pathname = usePathname();
  const { isSignedIn } = useAuthStore();
  const [unread, setUnread] = useState(0);

  // 로그인 상태에서 30초마다 미읽은 알림 수 폴링
  useEffect(() => {
    if (!isSignedIn) return;

    function fetchUnread() {
      getUnreadCount()
        .then((r) => setUnread(r.count))
        .catch(() => {});
    }

    fetchUnread();
    const timer = setInterval(fetchUnread, 30_000);
    return () => clearInterval(timer);
  }, [isSignedIn]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-purple-800 md:relative md:bottom-auto md:border-t-0 md:border-r">
      <div className="flex items-center justify-around py-2 md:flex-col md:gap-2 md:px-3 md:py-6">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 transition-colors ${
                isActive
                  ? "bg-purple-500 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-bold">{label}</span>
            </Link>
          );
        })}

        {/* 알림 벨 (로그인 시) */}
        {isSignedIn && (
          <Link
            href="/notifications"
            className={`relative flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 transition-colors ${
              pathname === "/notifications"
                ? "bg-purple-500 text-white"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[9px] text-white font-bold">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
            <span className="text-[10px] font-bold">알림</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
