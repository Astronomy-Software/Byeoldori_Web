import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  isSerializedEditorState,
  editorStateHasContent,
  previewSummary,
} from "./content-text.ts";

const lexical = (children: unknown[]) =>
  JSON.stringify({ root: { type: "root", children } });

test("content-text: Lexical 패키지를 import하지 않는다(목록 번들 경량화)", () => {
  const src = readFileSync(new URL("./content-text.ts", import.meta.url), "utf8");
  assert.doesNotMatch(src, /from\s+["'](lexical|@lexical\/)/);
});

test("isSerializedEditorState: 비어 있지 않은 root만 Lexical로 판정", () => {
  assert.equal(isSerializedEditorState(lexical([{ type: "paragraph", children: [] }])), true);
  assert.equal(isSerializedEditorState(lexical([])), false);
  assert.equal(isSerializedEditorState("평문 글"), false);
  assert.equal(isSerializedEditorState(""), false);
});

test("editorStateHasContent: 텍스트·이미지·첨부가 있어야 true", () => {
  assert.equal(
    editorStateHasContent(lexical([{ type: "paragraph", children: [{ text: "  " }] }])),
    false,
  );
  assert.equal(
    editorStateHasContent(lexical([{ type: "paragraph", children: [{ text: "별" }] }])),
    true,
  );
  assert.equal(editorStateHasContent(lexical([{ type: "image" }])), true);
  assert.equal(editorStateHasContent(lexical([{ type: "attachment" }])), true);
  assert.equal(editorStateHasContent("  평문  "), true);
  assert.equal(editorStateHasContent("   "), false);
});

test("previewSummary: Lexical JSON 조각은 대체 문구로", () => {
  assert.equal(previewSummary('{"root":{"children":[{"child'), "리치 텍스트 게시글");
  assert.equal(previewSummary("오늘 본 토성"), "오늘 본 토성");
  assert.equal(previewSummary(null), "");
});
