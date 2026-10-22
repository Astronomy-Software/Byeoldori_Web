import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_AFTER_LOGIN,
  RETURN_PATH_KEY,
  clearReturnPath,
  consumeReturnPath,
  consumeSocialLoginError,
  needsOnboarding,
  rememberReturnPath,
  rememberSocialLoginError,
  sanitizeReturnPath,
  socialLoginErrorCode,
  socialLoginErrorMessage,
} from "./post-login.ts";

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

test("sanitizeReturnPath: 내부 경로는 쿼리·해시까지 그대로 통과", () => {
  assert.equal(sanitizeReturnPath("/community/free/123"), "/community/free/123");
  assert.equal(sanitizeReturnPath("/community?tab=free&q=별"), "/community?tab=free&q=%EB%B3%84");
  assert.equal(sanitizeReturnPath("/observatory/5#reviews"), "/observatory/5#reviews");
});

test("sanitizeReturnPath: 외부로 나가는 경로는 거부(오픈 리다이렉트 방지)", () => {
  for (const bad of [
    "//evil.com",
    "//evil.com/path",
    "/\\evil.com",
    "\\\\evil.com",
    "https://evil.com",
    "javascript:alert(1)",
    "evil.com",
    "/\tevil",
    "/%0a",
    "",
    null,
    undefined,
    42,
    "/" + "a".repeat(3000),
  ]) {
    const r = sanitizeReturnPath(bad);
    if (r !== null) {
      // 퍼센트 인코딩된 제어 문자 등은 경로로 남아도 같은 출처여야 한다.
      assert.ok(r.startsWith("/") && !r.startsWith("//"), `unsafe: ${String(bad)} -> ${r}`);
    }
  }
  assert.equal(sanitizeReturnPath("//evil.com"), null);
  assert.equal(sanitizeReturnPath("/\\evil.com"), null);
  assert.equal(sanitizeReturnPath("https://evil.com"), null);
  assert.equal(sanitizeReturnPath("/\tevil"), null);
});

test("sanitizeReturnPath: 로그인·온보딩 흐름 경로로는 돌아가지 않는다", () => {
  assert.equal(sanitizeReturnPath("/login"), null);
  assert.equal(sanitizeReturnPath("/login?error=social_failed"), null);
  assert.equal(sanitizeReturnPath("/onboarding"), null);
  assert.equal(sanitizeReturnPath("/auth/kakao/callback?code=x"), null);
  assert.equal(sanitizeReturnPath("/loginx"), "/loginx");
});

test("복귀 경로: 저장 후 한 번만 꺼내지고, 없으면 /home", () => {
  const s = memoryStorage();
  rememberReturnPath("/community/review/7", s);
  assert.equal(consumeReturnPath(s), "/community/review/7");
  assert.equal(consumeReturnPath(s), DEFAULT_AFTER_LOGIN);
});

test("복귀 경로: 위험한 값은 저장하지 않고, 저장소가 변조돼도 꺼낼 때 다시 검사", () => {
  const s = memoryStorage();
  rememberReturnPath("//evil.com", s);
  assert.equal(s.map.has(RETURN_PATH_KEY), false);
  s.setItem(RETURN_PATH_KEY, "https://evil.com");
  assert.equal(consumeReturnPath(s), DEFAULT_AFTER_LOGIN);
  rememberReturnPath("/mypage", s);
  clearReturnPath(s);
  assert.equal(consumeReturnPath(s), DEFAULT_AFTER_LOGIN);
});

test("needsOnboarding: 닉네임이 비었을 때만, 프로필 조회 실패면 false", () => {
  assert.equal(needsOnboarding({ nickname: null }), true);
  assert.equal(needsOnboarding({ nickname: "  " }), true);
  assert.equal(needsOnboarding({}), true);
  assert.equal(needsOnboarding({ nickname: "별지기" }), false);
  assert.equal(needsOnboarding(null), false);
});

test("소셜 로그인 오류: 409만 계정 충돌로 구분하고 서버 문구를 전달", () => {
  const conflict = { status: 409, body: "이미 kakao 계정으로 가입된 이메일입니다." };
  assert.equal(socialLoginErrorCode(conflict), "account_conflict");
  assert.equal(socialLoginErrorMessage(conflict), "이미 kakao 계정으로 가입된 이메일입니다.");
  assert.equal(socialLoginErrorCode({ status: 500, body: "x" }), "social_failed");
  assert.equal(socialLoginErrorMessage({ status: 500, body: "x" }), null);
  assert.equal(socialLoginErrorCode(new Error("network")), "social_failed");
  assert.equal(socialLoginErrorMessage({ status: 409, body: "<html>" }), null);
  assert.equal(socialLoginErrorMessage({ status: 409, body: "x".repeat(500) }), null);
});

test("소셜 로그인 오류 문구: 한 번만 꺼내진다", () => {
  const s = memoryStorage();
  rememberSocialLoginError("이미 가입된 이메일", s);
  assert.equal(consumeSocialLoginError(s), "이미 가입된 이메일");
  assert.equal(consumeSocialLoginError(s), null);
});
