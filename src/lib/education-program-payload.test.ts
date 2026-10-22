import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProgramSavePayload } from "./education-program-payload.ts";

const base = { title: "  여름철 대삼각형 ", difficulty: "BEGINNER" as const, steps: [] };

test("buildProgramSavePayload: 수정할 때 비운 부제는 빈 문자열로 보내 서버에서도 지워진다", () => {
  const payload = buildProgramSavePayload({ ...base, subtitle: "   " }, "update");
  assert.equal(payload.subtitle, "");
  // JSON 본문에서 빠지지 않아야 서버가 '변경 없음'으로 보지 않는다
  assert.equal(JSON.parse(JSON.stringify(payload)).subtitle, "");
  assert.equal(payload.title, "여름철 대삼각형");
});

test("buildProgramSavePayload: 새로 만들 때 빈 부제는 보내지 않는다", () => {
  const payload = buildProgramSavePayload({ ...base, subtitle: "" }, "create");
  assert.equal("subtitle" in JSON.parse(JSON.stringify(payload)), false);
});

test("buildProgramSavePayload: 부제가 있으면 앞뒤 공백만 정리해 보낸다", () => {
  assert.equal(buildProgramSavePayload({ ...base, subtitle: " 별 찾기 " }, "update").subtitle, "별 찾기");
  assert.equal(buildProgramSavePayload({ ...base, subtitle: " 별 찾기 " }, "create").subtitle, "별 찾기");
});
