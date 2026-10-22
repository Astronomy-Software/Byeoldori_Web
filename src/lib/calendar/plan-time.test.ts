import { test } from "node:test";
import assert from "node:assert/strict";
import { formatPlanTimeRange } from "./plan-time.ts";

test("formatPlanTimeRange: 시작만 있으면 시작 시각", () => {
  assert.equal(formatPlanTimeRange("2026-10-23T21:00"), "21:00");
  assert.equal(formatPlanTimeRange("2026-10-23T21:30:00", null), "21:30");
});

test("formatPlanTimeRange: 같은 날 종료는 시각만, 다른 날 종료는 날짜를 붙인다", () => {
  assert.equal(formatPlanTimeRange("2026-10-23T21:00", "2026-10-23T23:30"), "21:00 ~ 23:30");
  assert.equal(
    formatPlanTimeRange("2026-10-23T22:00:00", "2026-10-24T02:00:00"),
    "22:00 ~ 10-24 02:00",
  );
});

test("formatPlanTimeRange: 형식이 다르면 보여주지 않는다", () => {
  assert.equal(formatPlanTimeRange(""), null);
  assert.equal(formatPlanTimeRange(undefined), null);
  assert.equal(formatPlanTimeRange("내일 밤"), null);
  assert.equal(formatPlanTimeRange("2026-10-23T21:00", "모름"), "21:00");
});
