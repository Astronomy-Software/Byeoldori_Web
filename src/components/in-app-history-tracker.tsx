"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { recordPathname } from "@/lib/navigation/in-app-history";

// 앱 안 화면 이동을 기록해 '돌아가기'가 사이트 밖으로 나가지 않게 한다(goBack 참고).
export function InAppHistoryTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname) recordPathname(pathname);
  }, [pathname]);
  return null;
}
