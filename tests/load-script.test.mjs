import { test } from "node:test";
import assert from "node:assert/strict";
import { loadScriptOnce } from "../src/lib/load-script.ts";

// 최소한의 가짜 document — EventTarget 기반 script 요소
function fakeDoc() {
  const byId = new Map();
  const appended = [];
  const doc = {
    getElementById: (id) => byId.get(id) ?? null,
    createElement: () => {
      const el = new EventTarget();
      el.remove = () => byId.delete(el.id);
      return el;
    },
    head: {
      appendChild: (el) => {
        byId.set(el.id, el);
        appended.push(el);
        return el;
      },
    },
  };
  return { doc, byId, appended };
}

test("이미 준비됐으면 태그를 넣지 않고 즉시 resolve", async () => {
  const { doc, appended } = fakeDoc();
  await loadScriptOnce("a", "https://x/a.js", () => true, doc);
  assert.equal(appended.length, 0);
});

test("태그가 없으면 한 번만 넣고, 동시 호출은 같은 Promise를 공유한다", async () => {
  const { doc, appended } = fakeDoc();
  const p1 = loadScriptOnce("b", "https://x/b.js", () => false, doc);
  const p2 = loadScriptOnce("b", "https://x/b.js", () => false, doc);
  assert.equal(p1, p2);
  assert.equal(appended.length, 1);
  assert.equal(appended[0].src, "https://x/b.js");
  appended[0].dispatchEvent(new Event("load"));
  await p1;
});

test("다른 페이지가 넣어 둔 태그가 아직 로딩 중이면 그 load를 기다린다", async () => {
  const { doc, byId, appended } = fakeDoc();
  const existing = new EventTarget();
  existing.id = "naver-map-script";
  byId.set(existing.id, existing);
  let done = false;
  const p = loadScriptOnce("naver-map-script", "https://x/maps.js", () => false, doc).then(() => {
    done = true;
  });
  await Promise.resolve();
  assert.equal(done, false);
  assert.equal(appended.length, 0);
  existing.dispatchEvent(new Event("load"));
  await p;
  assert.equal(done, true);
});

test("로드 실패하면 reject하고 태그를 걷어내 다음 시도에서 다시 넣는다", async () => {
  const { doc, byId, appended } = fakeDoc();
  const p = loadScriptOnce("c", "https://x/c.js", () => false, doc);
  appended[0].dispatchEvent(new Event("error"));
  await assert.rejects(p);
  assert.equal(byId.has("c"), false);
  const p2 = loadScriptOnce("c", "https://x/c.js", () => false, doc);
  assert.equal(appended.length, 2);
  appended[1].dispatchEvent(new Event("load"));
  await p2;
});
