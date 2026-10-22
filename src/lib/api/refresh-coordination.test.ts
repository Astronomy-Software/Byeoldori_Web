import { test } from "node:test";
import assert from "node:assert/strict";
import {
  coordinatedRefresh,
  tokenRefreshedElsewhere,
} from "./refresh-coordination.ts";

test("tokenRefreshedElsewhere: 저장소 토큰이 바뀌었을 때만 새 토큰을 돌려준다", () => {
  assert.equal(tokenRefreshedElsewhere("old", "old"), null);
  assert.equal(tokenRefreshedElsewhere("old", " old "), null);
  assert.equal(tokenRefreshedElsewhere("old", null), null);
  assert.equal(tokenRefreshedElsewhere("old", ""), null);
  assert.equal(tokenRefreshedElsewhere("old", "new"), "new");
});

// navigator.locks 흉내: 같은 이름의 요청을 순서대로 하나씩 실행한다.
function serialLocks() {
  let tail: Promise<unknown> = Promise.resolve();
  return {
    request<T>(_name: string, cb: () => Promise<T>): Promise<T> {
      const run = tail.then(cb, cb);
      tail = run.catch(() => {});
      return run;
    },
  };
}

test("coordinatedRefresh: 두 탭이 동시에 갱신해도 서버 reissue는 한 번만 일어난다", async () => {
  // 공유 localStorage와 서버(회전: 첫 요청만 성공, 이후 옛 refresh는 401)
  let stored: string | null = "old";
  let serverCalls = 0;
  const refresh = async () => {
    serverCalls += 1;
    await new Promise((r) => setTimeout(r, 5));
    if (serverCalls > 1) return false;
    stored = "new";
    return true;
  };
  const locks = serialLocks();
  const deps = { readToken: () => stored, refresh, locks };

  const [a, b] = await Promise.all([
    coordinatedRefresh("old", deps),
    coordinatedRefresh("old", deps),
  ]);
  assert.equal(a, true);
  assert.equal(b, true);
  assert.equal(serverCalls, 1);
  assert.equal(stored, "new");
});

test("coordinatedRefresh: 잠금이 없으면 바로 갱신하고, 이미 바뀐 토큰이면 요청하지 않는다", async () => {
  let calls = 0;
  const refresh = async () => {
    calls += 1;
    return false;
  };
  assert.equal(await coordinatedRefresh("old", { readToken: () => "old", refresh }), false);
  assert.equal(calls, 1);
  assert.equal(await coordinatedRefresh("old", { readToken: () => "new", refresh }), true);
  assert.equal(calls, 1);
});

test("coordinatedRefresh: 잠금 API가 실패하면 잠금 없이 진행한다", async () => {
  const locks = {
    request<T>(): Promise<T> {
      return Promise.reject(new Error("SecurityError"));
    },
  };
  const ok = await coordinatedRefresh("old", {
    readToken: () => "old",
    refresh: async () => true,
    locks,
  });
  assert.equal(ok, true);
});
