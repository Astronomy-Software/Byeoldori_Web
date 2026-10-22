import { test } from "node:test";
import assert from "node:assert/strict";
import { calendarDayLabel } from "./day-label.ts";

test("calendarDayLabel: 날짜만", () => {
  assert.equal(calendarDayLabel(10, 23), "10월 23일");
});

test("calendarDayLabel: 오늘·일정 있음을 글로 덧붙인다", () => {
  assert.equal(calendarDayLabel(10, 23, { hasPlan: true }), "10월 23일, 일정 있음");
  assert.equal(calendarDayLabel(10, 23, { isToday: true }), "10월 23일, 오늘");
  assert.equal(
    calendarDayLabel(1, 5, { isToday: true, hasPlan: true }),
    "1월 5일, 오늘, 일정 있음",
  );
});
