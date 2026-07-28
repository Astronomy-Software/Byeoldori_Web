"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import {
  editorNodes,
  editorTheme,
  isSerializedEditorState,
  onEditorError,
} from "./shared";

export interface LexicalViewerProps {
  // 저장된 content. Lexical editorState JSON이거나(신규) 평문(구버전)일 수 있다.
  content: string;
  // Lexical JSON이 아닐 때 평문으로 렌더할 텍스트.
  fallbackText: string;
}

export function LexicalViewer({ content, fallbackText }: LexicalViewerProps) {
  // 유효한 Lexical JSON이 아니면(구버전 평문 등) 기존처럼 평문 렌더.
  if (!isSerializedEditorState(content)) {
    return (
      <div className="whitespace-pre-wrap text-base leading-relaxed text-text-secondary">
        {fallbackText}
      </div>
    );
  }

  const initialConfig: InitialConfigType = {
    namespace: "byeoldori-post-viewer",
    theme: editorTheme,
    nodes: [...editorNodes],
    onError: onEditorError,
    editable: false,
    editorState: content,
  };

  return (
    <div className="text-base leading-relaxed text-text-secondary">
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="outline-none [&_a]:cursor-pointer" />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
      </LexicalComposer>
    </div>
  );
}

export default LexicalViewer;
