import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CLIENT_IP_HEADER,
  PROXY_SECRET_HEADER,
  applyProxyClientIp,
} from "./proxy-client-ip.ts";

const SECRET = "test-proxy-secret";

test("applyProxyClientIp: 비밀이 있으면 CF-Connecting-IP와 비밀을 넣는다", () => {
  const out = new Headers({ "content-type": "application/json" });
  applyProxyClientIp(out, new Headers({ "cf-connecting-ip": "203.0.113.7" }), SECRET);
  assert.equal(out.get(CLIENT_IP_HEADER), "203.0.113.7");
  assert.equal(out.get(PROXY_SECRET_HEADER), SECRET);
  assert.equal(out.get("content-type"), "application/json");
});

test("applyProxyClientIp: 브라우저가 보낸 같은 이름 헤더는 버리고 CF 값으로 덮는다", () => {
  const incoming = new Headers({
    "cf-connecting-ip": "2001:db8::1",
    [CLIENT_IP_HEADER]: "6.6.6.6",
    [PROXY_SECRET_HEADER]: "forged",
  });
  const out = new Headers({ [CLIENT_IP_HEADER]: "6.6.6.6", [PROXY_SECRET_HEADER]: "forged" });
  applyProxyClientIp(out, incoming, SECRET);
  assert.equal(out.get(CLIENT_IP_HEADER), "2001:db8::1");
  assert.equal(out.get(PROXY_SECRET_HEADER), SECRET);
});

test("applyProxyClientIp: 비밀이 없거나 비어 있으면 아무것도 보내지 않는다", () => {
  for (const secret of [undefined, "", "   "]) {
    const out = new Headers({ [CLIENT_IP_HEADER]: "6.6.6.6", [PROXY_SECRET_HEADER]: "forged" });
    applyProxyClientIp(out, new Headers({ "cf-connecting-ip": "203.0.113.7" }), secret);
    assert.equal(out.has(CLIENT_IP_HEADER), false);
    assert.equal(out.has(PROXY_SECRET_HEADER), false);
  }
});

test("applyProxyClientIp: CF-Connecting-IP가 없으면(로컬 개발) 비밀도 보내지 않는다", () => {
  const out = new Headers();
  applyProxyClientIp(out, new Headers({ "x-forwarded-for": "6.6.6.6" }), SECRET);
  assert.equal(out.has(CLIENT_IP_HEADER), false);
  assert.equal(out.has(PROXY_SECRET_HEADER), false);
});
