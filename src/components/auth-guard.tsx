"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isSignedIn, initAuth, loadUser } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isSignedIn) {
      router.replace("/login");
    } else {
      loadUser();
    }
  }, [isSignedIn, router, loadUser]);

  if (!isSignedIn) return null;

  return <>{children}</>;
}
