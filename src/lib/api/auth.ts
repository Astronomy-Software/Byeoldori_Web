import { apiFetch } from "./client";
import type {
  LoginRequest,
  LoginResponse,
  SignUpRequest,
  SignUpResponse,
  FindEmailRequest,
  FindEmailResponse,
  ResetPasswordToEmailRequest,
  SocialLoginRequest,
  ApiResponse,
} from "@/types/api";

export async function login(body: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function signUp(body: SignUpRequest): Promise<SignUpResponse> {
  return apiFetch<SignUpResponse>("auth/signup", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function findEmail(
  body: FindEmailRequest,
): Promise<FindEmailResponse> {
  return apiFetch<FindEmailResponse>("auth/find-email", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function resetPasswordToEmail(
  body: ResetPasswordToEmailRequest,
): Promise<string> {
  return apiFetch<string>("auth/password/reset-request", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function loginWithGoogle(body: SocialLoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("auth/google", { method: "POST", body: JSON.stringify(body) });
}

export async function loginWithKakao(body: SocialLoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("auth/kakao", { method: "POST", body: JSON.stringify(body) });
}

export async function loginWithNaver(body: SocialLoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("auth/naver", { method: "POST", body: JSON.stringify(body) });
}

/**
 * 이메일 인증. 서버 응답은 JSON 래퍼가 아니라 원시 HTML 문자열이다.
 * 성공 시 응답 본문에 "verification-success" 마커가 포함된다.
 */
export async function verifyEmail(token: string): Promise<string> {
  return apiFetch<string>(
    `auth/verify-email?token=${encodeURIComponent(token)}`,
  );
}
