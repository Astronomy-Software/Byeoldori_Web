import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  canGoBackInApp,
  goBack,
  recordPathname,
  resetInAppHistoryForTest,
} from "./in-app-history.ts";

function fakeRouter() {
  const calls: string[] = [];
  return {
    calls,
    back: () => calls.push("back"),
    replace: (href: string) => calls.push(`replace:${href}`),
  };
}

beforeEach(() => resetInAppHistoryForTest());

test("공유 링크로 바로 들어온 화면(앱 안 이동 없음)은 대체 경로로 간다", () => {
  recordPathname("/community/free/12");
  assert.equal(canGoBackInApp(1), false);
  assert.equal(canGoBackInApp(5), false); // 인앱 브라우저·OAuth 복귀: 앞 기록이 사이트 밖
  const r = fakeRouter();
  goBack(r, "/community?tab=FREE");
  assert.deepEqual(r.calls, ["replace:/community?tab=FREE"]);
});

test("같은 경로가 다시 기록되는 것은 이동으로 세지 않는다", () => {
  recordPathname("/observatory/3");
  recordPathname("/observatory/3");
  assert.equal(canGoBackInApp(3), false);
});

test("앱 안에서 이동한 뒤에는 브라우저 기록으로 돌아간다", () => {
  recordPathname("/community");
  recordPathname("/community/free/12");
  assert.equal(canGoBackInApp(2), true);
  assert.equal(canGoBackInApp(1), false);
});
