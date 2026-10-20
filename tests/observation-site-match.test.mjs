import { test } from "node:test";
import assert from "node:assert/strict";
import { matchSiteByName } from "../src/lib/observation-site-match.ts";

const sites = [
  { id: 1, name: "안반데기" },
  { id: 2, name: "천문대 A" },
  { id: 3, name: "천문대 AB" },
];

test("이름이 같으면 관측지를 찾는다(앞뒤·중복 공백 무시)", () => {
  assert.equal(matchSiteByName("  안반데기 ", sites)?.id, 1);
  assert.equal(matchSiteByName("천문대   A", sites)?.id, 2);
});

test("부분 일치나 빈 입력은 매칭하지 않는다", () => {
  assert.equal(matchSiteByName("안반", sites), undefined);
  assert.equal(matchSiteByName("천문대", sites), undefined);
  assert.equal(matchSiteByName("   ", sites), undefined);
});
