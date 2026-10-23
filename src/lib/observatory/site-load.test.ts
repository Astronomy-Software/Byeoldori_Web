import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSiteId, siteLoadErrorKind } from "./site-load.ts";

test("parseSiteId: 양의 정수 경로만 id로 본다", () => {
  assert.equal(parseSiteId("12"), 12);
  assert.equal(parseSiteId("abc"), null);
  assert.equal(parseSiteId("0"), null);
  assert.equal(parseSiteId("-3"), null);
  assert.equal(parseSiteId("1.5"), null);
  assert.equal(parseSiteId("12abc"), null);
  assert.equal(parseSiteId(""), null);
  assert.equal(parseSiteId(undefined), null);
  assert.equal(parseSiteId(["1"]), null);
  assert.equal(parseSiteId("99999999999999999999"), null);
});

test("siteLoadErrorKind: 404만 없는 관측지, 나머지는 다시 시도할 오류", () => {
  assert.equal(siteLoadErrorKind({ status: 404, body: "not found" }), "notFound");
  assert.equal(siteLoadErrorKind({ status: 502, body: "Failed to reach upstream server" }), "failed");
  assert.equal(siteLoadErrorKind({ status: 504, body: "Upstream request timed out" }), "failed");
  assert.equal(siteLoadErrorKind(new TypeError("Failed to fetch")), "failed");
  assert.equal(siteLoadErrorKind(null), "failed");
});
