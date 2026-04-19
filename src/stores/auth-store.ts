"use client";

import { create } from "zustand";
import {
  getAccessToken,
  setTokens,
  clearTokens,
} from "@/lib/auth/token";
import { login as apiLogin } from "@/lib/api/auth";
import { getMyProfile, logOut as logoutOnServer } from "@/lib/api/user";
import { ApiError } from "@/lib/api/client";
import type { UserProfile, LoginRequest } from "@/types/api";

interface AuthState {
  user: UserProfile | null;
  isSignedIn: boolean;
  isLoading: boolean;
  error: string | null;

  login: (req: LoginRequest) => Promise<void>;
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

  login: async (req: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiLogin(req);
      setTokens(res.data.accessToken, res.data.refreshToken);
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
    set({ user: null, isSignedIn: false });
  },

  loadUser: async () => {
    try {
      const res = await getMyProfile();
      set({ user: res.data, isSignedIn: true });
    } catch {
      clearTokens();
      set({ user: null, isSignedIn: false });
    }
  },
}));
