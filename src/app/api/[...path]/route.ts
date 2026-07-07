import { NextRequest } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// 백엔드 응답 대기 타임아웃 (ms)
const TIMEOUT_MS = 15_000;

// 요청 시 백엔드로 통과시킬 헤더 화이트리스트
const REQUEST_HEADER_ALLOWLIST = [
  "content-type",
  "authorization",
  "cookie",
  "accept",
  "accept-language",
];

// 응답 시 클라이언트로 통과시킬 헤더 화이트리스트
const RESPONSE_HEADER_ALLOWLIST = [
  "content-type",
  "content-disposition",
  "cache-control",
  "content-language",
];

async function handler(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  // /api/auth/login → /auth/login
  const backendPath = pathname.replace(/^\/api/, "");
  const url = `${BACKEND_URL}${backendPath}${search}`;

  const headers = new Headers();
  // 필요한 헤더만 전달 (Origin, Host 등 제거)
  for (const name of REQUEST_HEADER_ALLOWLIST) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.arrayBuffer()
      : undefined;

  // 타임아웃 처리
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      method: req.method,
      headers,
      body,
      signal: controller.signal,
    });
  } catch (err) {
    // 백엔드 장애/타임아웃을 502 JSON으로 정규화
    const isTimeout = err instanceof Error && err.name === "AbortError";
    return Response.json(
      {
        success: false,
        message: isTimeout
          ? "Upstream request timed out"
          : "Failed to reach upstream server",
      },
      { status: isTimeout ? 504 : 502 },
    );
  } finally {
    clearTimeout(timeout);
  }

  // 응답 헤더 중 화이트리스트에 해당하는 것만 전달
  const responseHeaders = new Headers();
  for (const name of RESPONSE_HEADER_ALLOWLIST) {
    const value = res.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  // Set-Cookie는 getSetCookie로 개별 처리 (쿠키 인증 대비)
  const getSetCookie = (
    res.headers as Headers & { getSetCookie?: () => string[] }
  ).getSetCookie;
  const setCookies =
    typeof getSetCookie === "function" ? getSetCookie.call(res.headers) : [];
  for (const cookie of setCookies) {
    responseHeaders.append("Set-Cookie", cookie);
  }

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: responseHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
