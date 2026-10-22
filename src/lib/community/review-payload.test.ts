import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveEditedSiteId, toReviewPayload, toReviewUpdatePayload } from "./review-payload.ts";

test("toReviewPayload: siteName·rating을 서버 ReviewDto(location·score)로 중첩 매핑", () => {
  const p = toReviewPayload({
    title: "t",
    content: "c",
    siteName: "천문대 A",
    rating: 4,
    imageUrls: ["u"],
    observationSiteId: 7,
  });
  assert.deepEqual(p, {
    title: "t",
    content: "c",
    imageUrls: ["u"],
    review: { location: "천문대 A", score: 4, observationSiteId: 7 },
  });
  assert.equal("siteName" in p, false);
  assert.equal("rating" in p, false);
});

test("toReviewPayload: 관측지 미연결이면 observationSiteId를 보내지 않음", () => {
  const p = toReviewPayload({ title: "t", content: "c", siteName: "어딘가", rating: 3, imageUrls: [] });
  assert.equal("observationSiteId" in p.review, false);
});

test("toReviewUpdatePayload: 기존 관측지 연결과 대상 천체를 함께 보내 지워지지 않게 한다", () => {
  const p = toReviewUpdatePayload({
    title: "t",
    content: "c",
    imageUrls: [],
    siteName: "천문대 A",
    rating: 2,
    observationSiteId: 7,
    targets: ["M42"],
  });
  assert.deepEqual(p, {
    title: "t",
    content: "c",
    imageUrls: [],
    review: { location: "천문대 A", score: 2, observationSiteId: 7, targets: ["M42"] },
  });
});

test("toReviewUpdatePayload: 비어 있는 관측지 이름·평점은 보내지 않는다(기존 값 유지)", () => {
  const p = toReviewUpdatePayload({
    title: "t",
    content: "c",
    imageUrls: [],
    siteName: "  ",
    rating: null,
    targets: [],
  });
  assert.deepEqual(p.review, { targets: [] });
});

test("resolveEditedSiteId: 이름을 그대로 두거나 비우면 기존 연결을 유지하고 찾지 않는다", async () => {
  let calls = 0;
  const find = async () => {
    calls++;
    return 99;
  };
  const original = { location: "천문대 A", observationSiteId: 7 };
  assert.equal(await resolveEditedSiteId(original, " 천문대 A ", find), 7);
  assert.equal(await resolveEditedSiteId(original, "", find), 7);
  assert.equal(calls, 0);
});

test("resolveEditedSiteId: 이름을 바꾸면 새로 찾고, 못 찾으면 연결하지 않는다", async () => {
  const original = { location: "천문대 A", observationSiteId: 7 };
  assert.equal(await resolveEditedSiteId(original, "천문대 B", async () => 9), 9);
  assert.equal(await resolveEditedSiteId(original, "어딘가", async () => undefined), undefined);
});
