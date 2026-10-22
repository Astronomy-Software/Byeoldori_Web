import { test } from "node:test";
import assert from "node:assert/strict";
import { homeSectionPlaceholder } from "./home-section.ts";

test("homeSectionPlaceholder: 로딩 중엔 스켈레톤, 성공했는데 비면 '없음'", () => {
  assert.equal(homeSectionPlaceholder("loading", 0), "skeleton");
  assert.equal(homeSectionPlaceholder("loaded", 0), "empty");
});

test("homeSectionPlaceholder: 실패 시 빈 상태 문구를 띄우지 않는다", () => {
  assert.equal(homeSectionPlaceholder("error", 0), null);
});

test("homeSectionPlaceholder: 글이 있으면 상태와 무관하게 목록을 보여준다", () => {
  assert.equal(homeSectionPlaceholder("loading", 3), null);
  assert.equal(homeSectionPlaceholder("loaded", 3), null);
  assert.equal(homeSectionPlaceholder("error", 3), null);
});
