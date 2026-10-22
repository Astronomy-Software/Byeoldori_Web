import { test } from "node:test";
import assert from "node:assert/strict";
import { hourlyPrecipLabel } from "./hourly-precip.ts";

test("hourlyPrecipLabel: 단기예보 강수확률은 %로", () => {
  assert.deepEqual(hourlyPrecipLabel({ pop: 30, rainMm: null }), { text: "30%", title: "강수확률" });
  assert.deepEqual(hourlyPrecipLabel({ pop: 0, rainMm: null }), { text: "0%", title: "강수확률" });
});

test("hourlyPrecipLabel: 초단기예보 강수량은 mm로(×10 해서 %로 바꾸지 않는다)", () => {
  assert.deepEqual(hourlyPrecipLabel({ pop: null, rainMm: 3 }), { text: "3mm", title: "1시간 강수량" });
  assert.deepEqual(hourlyPrecipLabel({ pop: null, rainMm: 0.5 }), { text: "0.5mm", title: "1시간 강수량" });
  assert.deepEqual(hourlyPrecipLabel({ pop: null, rainMm: 0 }), { text: "0mm", title: "1시간 강수량" });
});

test("hourlyPrecipLabel: 값이 없으면 대시", () => {
  assert.deepEqual(hourlyPrecipLabel({ pop: null, rainMm: null }), { text: "—", title: "강수 정보 없음" });
});
