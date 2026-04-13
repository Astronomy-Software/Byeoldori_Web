"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MapPin,
  Users,
  User,
  Star,
} from "lucide-react";

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
      </div>
    </nav>
  );
}
