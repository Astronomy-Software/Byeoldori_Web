import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDateParam, scheduleHrefForDate } from "./date-param.ts";

test("parseDateParam: 올바른 날짜는 연·월과 함께 돌려준다", () => {
  assert.deepEqual(parseDateParam("2026-10-23"), { date: "2026-10-23", year: 2026, month: 10 });
  assert.deepEqual(parseDateParam("2028-02-29"), { date: "2028-02-29", year: 2028, month: 2 });
});

test("parseDateParam: 형식이 틀리거나 없는 날짜는 null", () => {
  assert.equal(parseDateParam(null), null);
  assert.equal(parseDateParam(""), null);
  assert.equal(parseDateParam("2026-1-5"), null);
  assert.equal(parseDateParam("2026-13-01"), null);
  assert.equal(parseDateParam("2026-02-30"), null);
  assert.equal(parseDateParam("2027-02-29"), null);
  assert.equal(parseDateParam("2026-10-00"), null);
  assert.equal(parseDateParam("2026-10-23<script>"), null);
});

test("scheduleHrefForDate: 일정 화면으로 날짜를 넘긴다", () => {
  assert.equal(scheduleHrefForDate("2026-10-23"), "/mypage/schedule?date=2026-10-23");
});
