"use client";

import { create } from "zustand";
import {
  getAccessToken,
  setTokens,
  clearTokens,
} from "@/lib/auth/token";
import { login as apiLogin } from "@/lib/api/auth";
import { getMyProfile } from "@/lib/api/user";
import type { UserProfile, LoginRequest } from "@/types/api";

interface AuthState {
  user: UserProfile | null;
  isSignedIn: boolean;
  isLoading: boolean;
  error: string | null;

  login: (req: LoginRequest) => Promise<void>;
  logout: () => void;
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
      setTokens(res.accessToken, res.refreshToken);
      set({ isSignedIn: true, isLoading: false });
    } catch (e) {
      set({
        isLoading: false,
        error: e instanceof Error ? e.message : "로그인에 실패했습니다.",
      });
      throw e;
    }
  },

  logout: () => {
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
