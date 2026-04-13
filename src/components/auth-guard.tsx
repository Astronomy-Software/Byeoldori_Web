"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isSignedIn, initAuth, loadUser } = useAuthStore();
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

  if (!checked || !isSignedIn) return null;

  return <>{children}</>;
}
