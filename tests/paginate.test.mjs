import { test } from "node:test";
import assert from "node:assert/strict";
import { collectPages } from "../src/lib/api/paginate.ts";

function pager(all, size) {
  const calls = [];
  const fetchPage = async (page) => {
    calls.push(page);
    const content = all.slice(page * size, page * size + size);
    return { content, page, size, totalElements: all.length, totalPages: Math.ceil(all.length / size) };
  };
  return { fetchPage, calls };
}

test("20개 넘는 관측지도 마지막 페이지까지 모두 합친다", async () => {
  const all = Array.from({ length: 45 }, (_, i) => ({ id: i }));
  const { fetchPage, calls } = pager(all, 20);
  const { items, complete } = await collectPages(fetchPage);
  assert.equal(items.length, 45);
  assert.deepEqual(calls, [0, 1, 2]);
  assert.equal(complete, true);
});

test("빈 결과면 한 번만 요청한다", async () => {
  const { fetchPage, calls } = pager([], 20);
  const { items, complete } = await collectPages(fetchPage);
  assert.deepEqual(items, []);
  assert.deepEqual(calls, [0]);
  assert.equal(complete, true);
});

test("keep으로 거르고 enough를 만족하면 더 요청하지 않는다", async () => {
  const all = Array.from({ length: 100 }, (_, i) => ({ id: i, siteId: i % 10 === 3 ? 7 : 1 }));
  const { fetchPage, calls } = pager(all, 10);
  const { items, complete } = await collectPages(fetchPage, {
    keep: (p) => p.siteId === 7,
    enough: (kept) => kept.length >= 2,
  });
  assert.deepEqual(items.map((p) => p.id), [3, 13]);
  assert.deepEqual(calls, [0, 1]);
  assert.equal(complete, true);
});

test("maxPages에 걸리면 complete=false", async () => {
  const all = Array.from({ length: 100 }, (_, i) => ({ id: i }));
  const { fetchPage, calls } = pager(all, 10);
  const { items, complete } = await collectPages(fetchPage, { maxPages: 3 });
  assert.equal(items.length, 30);
  assert.deepEqual(calls, [0, 1, 2]);
  assert.equal(complete, false);
});
