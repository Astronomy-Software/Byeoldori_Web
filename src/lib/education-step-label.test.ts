import { test } from "node:test";
import assert from "node:assert/strict";
import { viewerStepLabel } from "./education-step-label.ts";

test("viewerStepLabel: 저작 화면에서 추가한 시점·시간·별자리 스텝도 한글 이름으로 보여준다", () => {
  assert.equal(viewerStepLabel({ type: "look-at", az: 10, alt: 20 }), "📷 시점 이동");
  assert.equal(viewerStepLabel({ type: "set-time", timeSpeed: 0 }), "🕐 시간 설정");
  assert.equal(viewerStepLabel({ type: "toggle-constellation" }), "✨ 별자리 표시");
});

test("viewerStepLabel: 기존 스텝 이름은 그대로", () => {
  assert.equal(viewerStepLabel({ type: "camera-move", target: "Vega" }), "📷 Vega");
  assert.equal(viewerStepLabel({ type: "wait", waitMs: 500 }), "⏸ 대기 500ms");
  assert.equal(viewerStepLabel({ type: "quiz" }), "❓ 퀴즈");
});
