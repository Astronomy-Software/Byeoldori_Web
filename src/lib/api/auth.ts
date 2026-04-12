import { apiFetch } from "./client";
import type {
  LoginRequest,
  LoginResponse,
  SignUpRequest,
  SignUpResponse,
  FindEmailRequest,
  FindEmailResponse,
  ResetPasswordToEmailRequest,
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
): Promise<ApiResponse<string>> {
  return apiFetch<ApiResponse<string>>("auth/password/reset-request", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function verifyEmail(
  token: string,
): Promise<ApiResponse<string>> {
  return apiFetch<ApiResponse<string>>(`auth/verify-email?token=${token}`);
}
