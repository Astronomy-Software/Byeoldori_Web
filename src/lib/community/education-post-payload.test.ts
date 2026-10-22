import { test } from "node:test";
import assert from "node:assert/strict";
import {
  resolveEditedTargets,
  splitTargets,
  targetsToLines,
  toEducationUpdatePayload,
} from "./education-post-payload.ts";

test("splitTargets: 작성 화면의 가운뎃점 구분 입력을 목록으로 나눈다", () => {
  assert.deepEqual(splitTargets("오리온자리 · 시리우스·  "), ["오리온자리", "시리우스"]);
  assert.deepEqual(splitTargets(""), []);
});

test("resolveEditedTargets: 고치지 않으면 처음 목록을 그대로 돌려준다(가운뎃점이 든 이름도 보존)", () => {
  const original = ["알파·센타우리", " M42 "];
  const text = targetsToLines(original);
  assert.equal(text, "알파·센타우리\n M42 ");
  const out = resolveEditedTargets(original, text);
  assert.deepEqual(out, ["알파·센타우리", " M42 "]);
  assert.notEqual(out, original);
  assert.deepEqual(resolveEditedTargets(undefined, targetsToLines(undefined)), []);
});

test("resolveEditedTargets: 고친 입력은 줄 단위로 나누고 가운뎃점은 이름의 일부로 둔다", () => {
  const original = ["알파·센타우리", "M42"];
  assert.deepEqual(resolveEditedTargets(original, "알파·센타우리\r\n\n  베텔게우스 \n"), [
    "알파·센타우리",
    "베텔게우스",
  ]);
  assert.deepEqual(resolveEditedTargets(original, ""), []);
});

test("toEducationUpdatePayload: 난이도·대상 천체를 education 으로 중첩하고 status·programId는 보내지 않는다", () => {
  const p = toEducationUpdatePayload({
    title: "t",
    content: "c",
    imageUrls: ["a"],
    difficulty: "ADVANCED",
    targets: ["M31", "M33"],
  });
  assert.deepEqual(p, {
    title: "t",
    content: "c",
    imageUrls: ["a"],
    education: { difficulty: "ADVANCED", targets: ["M31", "M33"] },
  });
});

test("toEducationUpdatePayload: 난이도가 비어 있으면 보내지 않지만 targets는 빈 목록이라도 보낸다", () => {
  const p = toEducationUpdatePayload({ title: "t", content: "c", imageUrls: [], difficulty: "", targets: [] });
  assert.deepEqual(p.education, { targets: [] });
});
