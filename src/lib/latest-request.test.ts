import { test } from "node:test";
import assert from "node:assert/strict";
import { createLatestRequest } from "./latest-request.ts";

test("createLatestRequest: 나중에 시작한 요청이 있으면 앞선 응답은 버린다", () => {
  const latest = createLatestRequest();
  const isA = latest.begin(); // 날짜 A 선택
  const isB = latest.begin(); // 곧바로 날짜 B 선택
  // A 응답이 B보다 늦게 와도 반영하지 않는다
  assert.equal(isB(), true);
  assert.equal(isA(), false);
});

test("createLatestRequest: 다른 요청이 없으면 응답을 반영한다", () => {
  const latest = createLatestRequest();
  const isOnly = latest.begin();
  assert.equal(isOnly(), true);
});
