import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COMMUNITY_TAB_LABELS,
  buildCommunityQuery,
  communityHref,
  parseCommunityQuery,
  routeTypeToTab,
} from "./board-query.ts";

const parse = (qs: string) => parseCommunityQuery(new URLSearchParams(qs));

test("parseCommunityQuery: 기본값은 리뷰 탭 첫 페이지", () => {
  assert.deepEqual(parse(""), { tab: "review", page: 0, keyword: "" });
});

test("parseCommunityQuery: URL page는 1-based, 잘못된 값은 0", () => {
  assert.deepEqual(parse("tab=free&page=3&q=%20달%20"), {
    tab: "free",
    page: 2,
    keyword: "달",
  });
  assert.equal(parse("page=0").page, 0);
  assert.equal(parse("page=-2").page, 0);
  assert.equal(parse("page=abc").page, 0);
  assert.equal(parse("page=1.5").page, 0);
  assert.equal(parse("tab=evil").tab, "review");
});

test("buildCommunityQuery: 기본값은 생략하고 왕복 시 같은 값", () => {
  assert.equal(buildCommunityQuery({ tab: "review", page: 0, keyword: "" }), "");
  const q = { tab: "program" as const, page: 4, keyword: "목성 관측" };
  assert.deepEqual(parse(buildCommunityQuery(q)), q);
});

test("communityHref: 홈 '더보기' 링크가 해당 탭을 연다", () => {
  assert.equal(communityHref("review"), "/community");
  assert.equal(communityHref("free"), "/community?tab=free");
  assert.equal(communityHref("program"), "/community?tab=program");
});

test("routeTypeToTab: 라우트 세그먼트를 탭으로(교육 글 수정 제목·삭제 후 목록 이동)", () => {
  assert.equal(routeTypeToTab("program"), "program");
  assert.equal(routeTypeToTab("PROGRAM"), "program");
  assert.equal(routeTypeToTab("education"), "program");
  assert.equal(routeTypeToTab("review"), "review");
  assert.equal(routeTypeToTab("free"), "free");
  assert.equal(routeTypeToTab("unknown"), "free");
  assert.equal(COMMUNITY_TAB_LABELS[routeTypeToTab("program")], "교육 프로그램");
  assert.equal(communityHref(routeTypeToTab("program")), "/community?tab=program");
});
