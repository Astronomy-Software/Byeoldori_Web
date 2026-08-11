"use client";

import { Component, type ReactNode } from "react";
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

// LexicalComposer 초기화는 렌더 중(useMemo)에 editorState를 파싱한다. 얕은 판정을
// 통과했지만 미등록 노드 등으로 파싱이 비어 setEditorState가 예외를 던지면, 이 글의
// 상세/수정 페이지가 통째로 죽는다. 그 경우 평문 폴백으로 내려 페이지를 살린다.
class ViewerErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function LexicalViewer({ content, fallbackText }: LexicalViewerProps) {
  const plainFallback = (
    <div className="whitespace-pre-wrap text-base leading-relaxed text-text-secondary">
      {fallbackText}
    </div>
  );

  // 유효한 Lexical JSON이 아니면(구버전 평문 등) 기존처럼 평문 렌더.
  if (!isSerializedEditorState(content)) {
    return plainFallback;
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
    <ViewerErrorBoundary fallback={plainFallback}>
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
    </ViewerErrorBoundary>
  );
}

export default LexicalViewer;
