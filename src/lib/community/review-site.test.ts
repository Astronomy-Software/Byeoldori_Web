import { test } from "node:test";
import assert from "node:assert/strict";
import { findSiteByExactName } from "./review-site.ts";

const sites = [
  { id: 1, name: "천문대 A" },
  { id: 2, name: "천문대 AB" },
  { id: 3, name: "Star Hill" },
];

test("findSiteByExactName: 공백·대소문자만 다른 정확 일치는 연결", () => {
  assert.equal(findSiteByExactName(sites, "천문대 A")?.id, 1);
  assert.equal(findSiteByExactName(sites, "  천문대   A ")?.id, 1);
  assert.equal(findSiteByExactName(sites, "star hill")?.id, 3);
});

test("findSiteByExactName: 부분 일치·빈 값·중복 이름은 연결하지 않음", () => {
  assert.equal(findSiteByExactName(sites, "천문대"), undefined);
  assert.equal(findSiteByExactName(sites, ""), undefined);
  assert.equal(
    findSiteByExactName([...sites, { id: 9, name: "Star Hill" }], "Star Hill"),
    undefined,
  );
});
