"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { rememberReturnPath } from "@/lib/auth/post-login";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isSignedIn, initAuth, loadUser } = useAuthStore();
  // initAuth()는 동기 함수지만 useEffect 안에서 실행되므로
  // 첫 렌더 시 isSignedIn은 항상 false — checked 플래그로 hydration 완료 여부 추적
  const [checked, setChecked] = useState(false);
  const loadedRef = useRef(false);
  // 이 화면에서 로그인 상태였던 적이 있는지 — 로그아웃 직후에는 복귀 경로를 남기지 않는다.
  const wasSignedInRef = useRef(false);

  useEffect(() => {
    initAuth();
    setChecked(true);
  }, [initAuth]);

  useEffect(() => {
    if (!checked) return;
    if (!isSignedIn) {
      // 비로그인으로 바로 들어온 경우(공유받은 글 링크 등) 로그인 후 이 경로로 돌아온다.
      if (!wasSignedInRef.current) {
        rememberReturnPath(window.location.pathname + window.location.search);
      }
      router.replace("/login");
      return;
    }
    wasSignedInRef.current = true;
    if (!loadedRef.current) {
      loadedRef.current = true;
      loadUser();
    }
  }, [checked, isSignedIn, router, loadUser]);

  // 셸/children을 항상 렌더(FCP 개선 — 서버·초기 렌더에서 빈 화면 방지).
  // 미인증이 확인되면 위 effect가 /login으로 리다이렉트한다.
  // (보호 데이터는 백엔드가 인증을 강제하므로 미로그인 시 빈 상태로 표시됨)
  return <>{children}</>;
}
