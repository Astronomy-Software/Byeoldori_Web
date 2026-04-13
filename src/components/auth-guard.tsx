"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isSignedIn, initAuth, loadUser } = useAuthStore();
  const loadedRef = useRef(false);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (isSignedIn && !loadedRef.current) {
      loadedRef.current = true;
      loadUser();
    }
  }, [isSignedIn, loadUser]);

  // 로그인 여부와 관계없이 항상 렌더링 (개발 편의)
  return <>{children}</>;
}
