"use client";

import { useEffect, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  $insertNodes,
  COMMAND_PRIORITY_LOW,
  PASTE_COMMAND,
  DROP_COMMAND,
  type EditorState,
} from "lexical";
import { toast } from "sonner";
import { uploadImage } from "@/lib/api/files";
import { ApiError } from "@/lib/api/client";
import { $createImageNode } from "./nodes/image-node";
import { isSafeUrl } from "./url-safe";
import { ToolbarPlugin } from "./toolbar-plugin";
import {
  editorNodes,
  editorTheme,
  isSerializedEditorState,
  onEditorError,
} from "./shared";

// 초기 content 문자열 → Lexical 초기 상태.
// - 유효한 editorState JSON: 문자열 그대로 넘긴다.
// - 평문(구버전 게시글 등): 줄 단위로 문단을 만들어 초기화한다.
function makeInitialEditorState(
  value?: string,
): InitialConfigType["editorState"] {
  if (!value) return undefined;
  if (isSerializedEditorState(value)) return value;
  return () => {
    const root = $getRoot();
    if (root.getFirstChild() !== null) return;
    for (const line of value.split("\n")) {
      const paragraph = $createParagraphNode();
      if (line.length > 0) paragraph.append($createTextNode(line));
      root.append(paragraph);
    }
  };
}

// 붙여넣기/드롭으로 들어온 이미지 파일을 업로드해 삽입하는 플러그인.
function ImagePasteDropPlugin({
  onUploadingChange,
}: {
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    async function uploadAndInsert(files: File[]) {
      const images = files.filter((f) => f.type.startsWith("image/"));
      if (images.length === 0) return;
      onUploadingChange?.(true);
      try {
        for (const file of images) {
          const res = await uploadImage(file);
          editor.update(() => {
            $insertNodes([$createImageNode(res.url, file.name)]);
          });
        }
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.body : "이미지 업로드에 실패했습니다.",
        );
      } finally {
        onUploadingChange?.(false);
      }
    }

    const unregisterPaste = editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const files = event.clipboardData?.files;
        if (files && files.length > 0) {
          const images = Array.from(files).filter((f) =>
            f.type.startsWith("image/"),
          );
          if (images.length > 0) {
            event.preventDefault();
            void uploadAndInsert(images);
            return true;
          }
        }
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );

    const unregisterDrop = editor.registerCommand(
      DROP_COMMAND,
      (event: DragEvent) => {
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
          const images = Array.from(files).filter((f) =>
            f.type.startsWith("image/"),
          );
          if (images.length > 0) {
            event.preventDefault();
            void uploadAndInsert(images);
            return true;
          }
        }
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );

    return () => {
      unregisterPaste();
      unregisterDrop();
    };
  }, [editor, onUploadingChange]);

  return null;
}

export interface LexicalEditorProps {
  value?: string;
  onChange: (serialized: string) => void;
  placeholder?: string;
}

export default function LexicalEditor({
  value,
  onChange,
  placeholder = "내용을 입력하세요...",
}: LexicalEditorProps) {
  const [isUploading, setIsUploading] = useState(false);

  const initialConfig: InitialConfigType = {
    namespace: "byeoldori-post-editor",
    theme: editorTheme,
    nodes: [...editorNodes],
    onError: onEditorError,
    editorState: makeInitialEditorState(value),
  };

  function handleChange(editorState: EditorState) {
    // editorState.toJSON()을 직렬화 문자열로 상위에 전달(= content에 저장).
    onChange(JSON.stringify(editorState.toJSON()));
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border-default bg-surface-1">
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin onUploadingChange={setIsUploading} />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="min-h-[220px] px-3 py-3 text-base leading-relaxed text-text-primary outline-none [&_a]:cursor-pointer"
                aria-placeholder={placeholder}
                placeholder={
                  <div className="pointer-events-none absolute left-3 top-3 text-text-tertiary">
                    {placeholder}
                  </div>
                }
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin validateUrl={isSafeUrl} />
        <OnChangePlugin onChange={handleChange} />
        <ImagePasteDropPlugin onUploadingChange={setIsUploading} />
      </LexicalComposer>
      {isUploading && (
        <div className="border-t border-border-default px-3 py-1.5 text-xs text-text-tertiary">
          업로드 중...
        </div>
      )}
    </div>
  );
}
