import type { Klass, LexicalNode } from "lexical";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";
import { ImageNode } from "./nodes/image-node";
import { FileNode } from "./nodes/file-node";

// 에디터/뷰어 공통 노드 등록 목록.
// 커스텀 이미지·파일 노드가 양쪽에서 동일하게 렌더되도록 한 곳에서 관리한다.
export const editorNodes: ReadonlyArray<Klass<LexicalNode>> = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  ImageNode,
  FileNode,
];

// Tailwind 디자인 토큰 기반 테마. 에디터/뷰어가 동일 클래스를 공유한다.
export const editorTheme = {
  paragraph: "mb-2 leading-relaxed",
  heading: {
    h1: "mt-4 mb-2 text-2xl font-bold text-text-primary",
    h2: "mt-3 mb-2 text-xl font-bold text-text-primary",
    h3: "mt-2 mb-1 text-lg font-semibold text-text-primary",
  },
  quote:
    "my-2 border-l-2 border-border-strong pl-3 italic text-text-tertiary",
  list: {
    ul: "my-2 list-disc pl-6",
    ol: "my-2 list-decimal pl-6",
    listitem: "mb-1",
    nested: {
      listitem: "list-none",
    },
  },
  link: "text-interactive-link underline",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
  },
};

// content 문자열이 Lexical editorState JSON인지 판별.
// 유효하면 Lexical로 렌더, 아니면(평문 등) 폴백 처리한다.
export function isSerializedEditorState(value: string): boolean {
  if (!value) return false;
  try {
    const parsed = JSON.parse(value);
    return (
      parsed != null &&
      typeof parsed === "object" &&
      typeof parsed.root === "object" &&
      parsed.root != null &&
      parsed.root.type === "root" &&
      Array.isArray(parsed.root.children) &&
      // 빈 root(children:[]) 는 Lexical setEditorState 가 렌더 중 예외를 던진다.
      // 이 얕은 판정을 통과시키면 평문 폴백이 아니라 페이지 크래시로 이어지므로 제외.
      parsed.root.children.length > 0
    );
  } catch {
    return false;
  }
}

// content에 실제 내용이 있는지 검사(빈 에디터 제출 방지용).
// - Lexical JSON: 텍스트가 있거나 이미지/첨부 노드가 있으면 true.
// - 평문: 공백 제거 후 길이로 판단.
export function editorStateHasContent(value: string): boolean {
  if (!value) return false;
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return value.trim().length > 0;
  }
  const root = (parsed as { root?: unknown })?.root;
  if (!root || typeof root !== "object") return value.trim().length > 0;

  let has = false;
  const walk = (node: unknown): void => {
    if (has || node == null || typeof node !== "object") return;
    const n = node as {
      text?: unknown;
      type?: unknown;
      children?: unknown;
    };
    if (typeof n.text === "string" && n.text.trim().length > 0) {
      has = true;
      return;
    }
    if (n.type === "image" || n.type === "attachment") {
      has = true;
      return;
    }
    if (Array.isArray(n.children)) n.children.forEach(walk);
  };
  walk(root);
  return has;
}

// 목록/홈 미리보기용 요약 텍스트.
// 백엔드는 content 앞 30자를 그대로 자르는데, Lexical 게시글이면 그 조각이
// `{"root":{"children":[{"child` 같은 JSON 쓰레기가 된다. 이를 감지해 사람이 읽을
// 문구로 대체한다. (근본 해결은 백엔드가 텍스트 노드만 추출해 요약하는 것)
export function previewSummary(
  summary: string | null | undefined,
  fallback = "리치 텍스트 게시글",
): string {
  const s = (summary ?? "").trim();
  if (!s) return "";
  // Lexical JSON 요약은 항상 `{"root"` 또는 최소한 `{"` 로 시작한다.
  if (/^\{\s*"(root|")/.test(s)) return fallback;
  return s;
}

// 에디터 공통 onError — 콘솔에만 남기고 앱을 죽이지 않는다.
export function onEditorError(error: Error): void {
  console.error("[LexicalEditor]", error);
}
