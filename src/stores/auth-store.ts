"use client";

import { create } from "zustand";
import {
  getAccessToken,
  setAccessToken,
  clearTokens,
  SESSION_EXPIRED_EVENT,
} from "@/lib/auth/token";
import { login as apiLogin } from "@/lib/api/auth";
import { getMyProfile, logOut as logoutOnServer } from "@/lib/api/user";
import { ApiError } from "@/lib/api/client";
import { clearReturnPath, rememberReturnPath } from "@/lib/auth/post-login";
import type { UserProfile, LoginRequest, AuthTokens } from "@/types/api";

interface AuthState {
  user: UserProfile | null;
  isSignedIn: boolean;
  isLoading: boolean;
  error: string | null;

  login: (req: LoginRequest) => Promise<void>;
  loginWithSocial: (tokens: AuthTokens) => void;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isSignedIn: false,
  isLoading: false,
  error: null,

  initAuth: () => {
    const token = getAccessToken();
    if (token) {
      set({ isSignedIn: true });
    }
  },

  loginWithSocial: (tokens: AuthTokens) => {
    // refresh는 httpOnly 쿠키로 세팅되므로 body의 refreshToken은 무시하고 access만 저장한다.
    setAccessToken(tokens.accessToken);
    set({ isSignedIn: true });
  },

  login: async (req: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiLogin(req);
      // refresh는 httpOnly 쿠키로 세팅되므로 body의 refreshToken은 무시하고 access만 저장한다.
      setAccessToken(res.accessToken);
      set({ isSignedIn: true, isLoading: false });
    } catch (e) {
      set({
        isLoading: false,
        error: e instanceof ApiError ? e.body : "로그인에 실패했습니다.",
      });
      throw e;
    }
  },

  logout: async () => {
    // 서버의 refreshToken 무효화 시도 (실패해도 클라이언트 토큰은 지운다)
    try {
      await logoutOnServer();
    } catch {
      // 이미 만료된 토큰 등 — 로컬 정리만 진행
    }
    clearTokens();
    // 직접 로그아웃했다면 다음 로그인은 /home에서 시작한다.
    clearReturnPath();
    set({ user: null, isSignedIn: false });
  },

  loadUser: async () => {
    try {
      const res = await getMyProfile();
      set({ user: res, isSignedIn: true });
    } catch (e) {
      // 401만 실제 세션 만료 — 네트워크 오류·5xx는 로그아웃하지 않는다
      if (e instanceof ApiError && e.status === 401) {
        rememberCurrentPath();
        clearTokens();
        set({ user: null, isSignedIn: false });
      }
    }
  },
}));

// 세션이 만료되면 다시 로그인한 뒤 보던 화면으로 돌아온다.
function rememberCurrentPath() {
  if (typeof window === "undefined") return;
  rememberReturnPath(window.location.pathname + window.location.search);
}

// apiFetch에서 refresh가 실패하면(세션 만료) 로그인 상태를 내린다.
// AuthGuard는 isSignedIn=false를 보고 /login으로 이동한다.
if (typeof window !== "undefined") {
  window.addEventListener(SESSION_EXPIRED_EVENT, () => {
    rememberCurrentPath();
    useAuthStore.setState({ user: null, isSignedIn: false });
  });
}
