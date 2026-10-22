import { test } from "node:test";
import assert from "node:assert/strict";
import { canGoBackInApp, goBack, installInAppHistory } from "./in-app-history.ts";

function fakeRouter() {
  const calls: string[] = [];
  return {
    calls,
    back: () => calls.push("back"),
    replace: (href: string) => calls.push(`replace:${href}`),
  };
}

// 브라우저 세션 기록 흉내. 첫 항목은 공유 링크를 연 사이트 밖 화면이다.
function fakeHistory(entryPath: string) {
  const entries: { path: string; state: unknown }[] = [
    { path: "external", state: null },
    // Next.js 가 첫 화면에 남기는 state(우리 표시 없음)
    { path: entryPath, state: { __NA: true } },
  ];
  let index = 1;
  const history = {
    get state() {
      return entries[index].state;
    },
    pushState(data: unknown, _unused: string, url?: string | URL | null) {
      entries.splice(index + 1);
      entries.push({ path: String(url ?? entries[index].path), state: data });
      index += 1;
    },
    replaceState(data: unknown, _unused: string, url?: string | URL | null) {
      entries[index] = { path: String(url ?? entries[index].path), state: data };
    },
  };
  installInAppHistory(history);
  return {
    history,
    // Next.js 라우터 이동은 pushState(router.push)·replaceState(router.replace)로 남는다
    push: (path: string) => history.pushState({ __NA: true }, "", path),
    replace: (path: string) => history.replaceState({ __NA: true }, "", path),
    back: () => {
      index -= 1;
    },
    forward: () => {
      index += 1;
    },
    path: () => entries[index].path,
    canGoBack: () => canGoBackInApp(history.state),
  };
}

test("공유 링크로 바로 들어온 화면은 대체 경로로 간다", () => {
  const h = fakeHistory("/community/free/12");
  assert.equal(h.canGoBack(), false);
  assert.equal(canGoBackInApp(null), false);
  const r = fakeRouter();
  goBack(r, "/community?tab=FREE"); // 서버(window 없음)에서도 안전하게 대체 경로
  assert.deepEqual(r.calls, ["replace:/community?tab=FREE"]);
});

test("A → B 로 이동하면 B 에서 앱 안으로 돌아갈 수 있다", () => {
  const h = fakeHistory("/community");
  h.push("/community/free/12");
  assert.equal(h.canGoBack(), true);
});

test("A → B → 브라우저 뒤로 A 에서는 앱 안 뒤로 가기가 없다", () => {
  const h = fakeHistory("/community/free/12");
  h.push("/observatory/3");
  h.back();
  assert.equal(h.path(), "/community/free/12");
  assert.equal(h.canGoBack(), false);
  h.forward();
  assert.equal(h.canGoBack(), true);
});

test("A → B → C → 뒤로 → 뒤로 는 B 까지만 앱 안 뒤로 가기가 있다", () => {
  const h = fakeHistory("/a");
  h.push("/b");
  h.push("/c");
  assert.equal(h.canGoBack(), true);
  h.back();
  assert.equal(h.path(), "/b");
  assert.equal(h.canGoBack(), true);
  h.back();
  assert.equal(h.path(), "/a");
  assert.equal(h.canGoBack(), false);
});

test("뒤로 간 뒤 새로 이동하면 그 위치에서 다시 센다", () => {
  const h = fakeHistory("/a");
  h.push("/b");
  h.back();
  h.push("/c");
  assert.equal(h.canGoBack(), true);
  h.back();
  assert.equal(h.path(), "/a");
  assert.equal(h.canGoBack(), false);
});

test("replace 는 현재 위치를 바꾸지 않는다(쿼리 갱신·state 덮어쓰기 포함)", () => {
  const h = fakeHistory("/a");
  h.replace("/a?id=1");
  assert.equal(h.canGoBack(), false);
  h.push("/b");
  h.replace("/b?tab=2");
  h.history.replaceState(null, "");
  assert.equal(h.canGoBack(), true);
});
