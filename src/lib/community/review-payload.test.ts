import { test } from "node:test";
import assert from "node:assert/strict";
import { toReviewPayload } from "./review-payload.ts";

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
