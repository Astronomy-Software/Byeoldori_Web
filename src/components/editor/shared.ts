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

// content 문자열 판별·요약 함수는 Lexical 의존이 없는 모듈에 두고 재export한다.
// (목록·작성 화면이 이 파일을 import하면 Lexical 코어가 초기 번들에 실리기 때문)
export {
  isSerializedEditorState,
  editorStateHasContent,
  previewSummary,
} from "@/lib/community/content-text";

// 에디터 공통 onError — 콘솔에만 남기고 앱을 죽이지 않는다.
export function onEditorError(error: Error): void {
  console.error("[LexicalEditor]", error);
}
