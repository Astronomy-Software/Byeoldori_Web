import { test } from "node:test";
import assert from "node:assert/strict";
import {
  resolveEditedSite,
  SITE_LOOKUP_FAILED_MESSAGE,
  SITE_NAME_NOT_REGISTERED_MESSAGE,
  toReviewPayload,
  toReviewUpdatePayload,
} from "./review-payload.ts";

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

test("toReviewUpdatePayload: clearLocation 이면 빈 이름을 보내 지우고 연결은 보내지 않는다", () => {
  const p = toReviewUpdatePayload({
    title: "t",
    content: "c",
    imageUrls: [],
    siteName: "",
    rating: 3,
    clearLocation: true,
    targets: ["M42"],
  });
  assert.deepEqual(p.review, { location: "", score: 3, targets: ["M42"] });
});

const linked = { location: "천문대 A", observationSiteId: 7 };

test("resolveEditedSite: 이름을 그대로 두면 기존 연결을 유지하고 찾지 않는다", async () => {
  let calls = 0;
  const find = async () => {
    calls++;
    return 99;
  };
  assert.deepEqual(await resolveEditedSite(linked, " 천문대 A ", find), { ok: true, observationSiteId: 7 });
  // 앱에서 쓴 글처럼 이름 없이 연결만 있는 경우도 그대로 둔다
  assert.deepEqual(await resolveEditedSite({ location: null, observationSiteId: 5 }, "", find), {
    ok: true,
    observationSiteId: 5,
  });
  assert.equal(calls, 0);
});

test("resolveEditedSite: 이름을 일부러 비우면 이름과 연결을 함께 지운다", async () => {
  const find = async () => {
    throw new Error("호출되면 안 됨");
  };
  assert.deepEqual(await resolveEditedSite(linked, "  ", find), { ok: true, clearLocation: true });
});

test("resolveEditedSite: 바꾼 이름이 등록된 관측지와 같으면 그 관측지로 연결한다", async () => {
  assert.deepEqual(await resolveEditedSite(linked, "천문대 B", async () => 9), { ok: true, observationSiteId: 9 });
});

test("resolveEditedSite: 연결된 글의 이름을 등록되지 않은 이름으로 바꾸면 저장을 막는다", async () => {
  assert.deepEqual(await resolveEditedSite(linked, "어딘가", async () => undefined), {
    ok: false,
    message: SITE_NAME_NOT_REGISTERED_MESSAGE,
  });
});

test("resolveEditedSite: 원래 연결이 없던 글은 등록되지 않은 이름도 이름만 저장한다", async () => {
  assert.deepEqual(
    await resolveEditedSite({ location: "우리집 옥상", observationSiteId: null }, "우리집 마당", async () => undefined),
    { ok: true },
  );
});

test("resolveEditedSite: 관측지 조회가 실패하면 연결 여부와 상관없이 저장을 막는다", async () => {
  const fail = async (): Promise<number | undefined> => {
    throw new Error("503");
  };
  const blocked = { ok: false, message: SITE_LOOKUP_FAILED_MESSAGE };
  assert.deepEqual(await resolveEditedSite(linked, "천문대 B", fail), blocked);
  assert.deepEqual(await resolveEditedSite({ location: "", observationSiteId: null }, "천문대 B", fail), blocked);
});
