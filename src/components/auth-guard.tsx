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

  // 인증 확인 전이거나 미로그인이면 빈 화면 (리다이렉트 중)
  if (!checked || !isSignedIn) return null;

  return <>{children}</>;
}
