"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isSignedIn, initAuth, loadUser } = useAuthStore();
  // initAuth()는 동기 함수지만 useEffect 안에서 실행되므로
  // 첫 렌더 시 isSignedIn은 항상 false — checked 플래그로 hydration 완료 여부 추적
  const [checked, setChecked] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    initAuth();
    setChecked(true);
  }, [initAuth]);

  useEffect(() => {
    if (!checked) return;
    if (!isSignedIn) {
      router.replace("/login");
    } else if (!loadedRef.current) {
      loadedRef.current = true;
      loadUser();
    }
  }, [checked, isSignedIn, router, loadUser]);

  // 셸/children을 항상 렌더(FCP 개선 — 서버·초기 렌더에서 빈 화면 방지).
  // 미인증이 확인되면 위 effect가 /login으로 리다이렉트한다.
  // (보호 데이터는 백엔드가 인증을 강제하므로 미로그인 시 빈 상태로 표시됨)
  return <>{children}</>;
}
