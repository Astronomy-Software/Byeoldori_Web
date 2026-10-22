import { test } from "node:test";
import assert from "node:assert/strict";
import { joinTargets, splitTargets, toEducationUpdatePayload } from "./education-post-payload.ts";

test("splitTargets/joinTargets: 가운뎃점 구분 입력과 목록을 오간다", () => {
  assert.deepEqual(splitTargets("오리온자리 · 시리우스·  "), ["오리온자리", "시리우스"]);
  assert.deepEqual(splitTargets(""), []);
  assert.equal(joinTargets(["오리온자리", "시리우스"]), "오리온자리 · 시리우스");
  assert.equal(joinTargets(undefined), "");
  assert.deepEqual(splitTargets(joinTargets(["M42", "베텔게우스"])), ["M42", "베텔게우스"]);
});

test("toEducationUpdatePayload: 난이도·대상 천체를 education 으로 중첩하고 status·programId는 보내지 않는다", () => {
  const p = toEducationUpdatePayload({
    title: "t",
    content: "c",
    imageUrls: ["a"],
    difficulty: "ADVANCED",
    objectName: "M31 · M33",
  });
  assert.deepEqual(p, {
    title: "t",
    content: "c",
    imageUrls: ["a"],
    education: { difficulty: "ADVANCED", targets: ["M31", "M33"] },
  });
});

test("toEducationUpdatePayload: 난이도가 비어 있으면 보내지 않지만 targets는 빈 목록이라도 보낸다", () => {
  const p = toEducationUpdatePayload({ title: "t", content: "c", imageUrls: [], difficulty: "", objectName: "" });
  assert.deepEqual(p.education, { targets: [] });
});
