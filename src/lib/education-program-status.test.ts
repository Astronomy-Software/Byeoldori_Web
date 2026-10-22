import { test } from "node:test";
import assert from "node:assert/strict";
import {
  authorStage,
  programAuthorHref,
  programStatusLabel,
  reviewWithdrawnBySave,
} from "./education-program-status.ts";

test("programStatusLabel: 반려 사유가 있는 DRAFT는 반려됨", () => {
  assert.equal(programStatusLabel("DRAFT"), "임시저장");
  assert.equal(programStatusLabel("DRAFT", null), "임시저장");
  assert.equal(programStatusLabel("DRAFT", "  "), "임시저장");
  assert.equal(programStatusLabel("DRAFT", "별 이름 오타"), "반려됨");
  assert.equal(programStatusLabel("PREVIEW"), "검수 대기");
  assert.equal(programStatusLabel("PUBLISHED"), "발행됨");
});

test("programAuthorHref: 저작 화면을 id로 다시 연다", () => {
  assert.equal(programAuthorHref("abc123"), "/community/program/author?id=abc123");
  assert.equal(programAuthorHref("a&b"), "/community/program/author?id=a%26b");
});

test("authorStage: 검수가 켜져 있으면 검수 대기 중 발행 버튼은 관리자에게만", () => {
  assert.equal(authorStage(null, false, true), "submit");
  assert.equal(authorStage("DRAFT", false, true), "submit");
  assert.equal(authorStage("PREVIEW", false, true), "waiting");
  assert.equal(authorStage("PREVIEW", true, true), "publish");
  assert.equal(authorStage("PUBLISHED", false, true), "published");
  assert.equal(authorStage("PUBLISHED", true, true), "published");
});

test("authorStage: 검수가 꺼져 있으면 작성자도 PREVIEW 를 발행한다", () => {
  assert.equal(authorStage(null, false, false), "submit");
  assert.equal(authorStage("DRAFT", false, false), "submit");
  assert.equal(authorStage("PREVIEW", false, false), "publish");
  assert.equal(authorStage("PREVIEW", true, false), "publish");
  assert.equal(authorStage("PUBLISHED", false, false), "published");
});

test("reviewWithdrawnBySave: PREVIEW → DRAFT 로 바뀐 저장만 철회로 본다", () => {
  assert.equal(reviewWithdrawnBySave("PREVIEW", "DRAFT"), true);
  assert.equal(reviewWithdrawnBySave("PREVIEW", "PREVIEW"), false);
  assert.equal(reviewWithdrawnBySave("DRAFT", "DRAFT"), false);
  assert.equal(reviewWithdrawnBySave(null, "DRAFT"), false);
});
