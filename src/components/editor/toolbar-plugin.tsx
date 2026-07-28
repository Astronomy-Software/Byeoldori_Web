"use client";

import { useRef, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $insertNodes,
  $createParagraphNode,
  FORMAT_TEXT_COMMAND,
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import {
  $createHeadingNode,
  $createQuoteNode,
  type HeadingTagType,
} from "@lexical/rich-text";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { toast } from "sonner";
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Image as ImageIcon,
  Paperclip,
  Loader2,
} from "lucide-react";
import { uploadImage, uploadFile } from "@/lib/api/files";
import { ApiError } from "@/lib/api/client";
import { $createImageNode } from "./nodes/image-node";
import { $createFileNode } from "./nodes/file-node";

function btn(active = false): string {
  return `flex h-8 w-8 items-center justify-center rounded-md border text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary ${
    active ? "border-interactive-primary" : "border-border-default"
  }`;
}

export function ToolbarPlugin({
  onUploadingChange,
}: {
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function setUploading(v: boolean) {
    setIsUploading(v);
    onUploadingChange?.(v);
  }

  function formatText(format: "bold" | "italic" | "underline") {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  }

  function formatHeading(tag: HeadingTagType) {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(tag));
      }
    });
  }

  function formatParagraph() {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  }

  function formatQuote() {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  }

  function insertLink() {
    const url = window.prompt("링크 URL을 입력하세요");
    if (!url) return;
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
  }

  async function handleImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadImage(file);
      editor.update(() => {
        const node = $createImageNode(res.url, file.name);
        $insertNodes([node]);
      });
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.body : "이미지 업로드에 실패했습니다.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFile(file);
      editor.update(() => {
        const node = $createFileNode(
          res.url,
          res.filename ?? file.name,
          res.size ?? file.size,
          res.contentType ?? file.type,
        );
        $insertNodes([node]);
      });
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.body : "파일 업로드에 실패했습니다.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border-default bg-surface-1 p-2">
      <button type="button" className={btn()} onClick={() => formatText("bold")} title="굵게" aria-label="굵게">
        <Bold className="h-4 w-4" />
      </button>
      <button type="button" className={btn()} onClick={() => formatText("italic")} title="기울임" aria-label="기울임">
        <Italic className="h-4 w-4" />
      </button>
      <button type="button" className={btn()} onClick={() => formatText("underline")} title="밑줄" aria-label="밑줄">
        <Underline className="h-4 w-4" />
      </button>

      <span className="mx-1 h-5 w-px bg-border-default" />

      <button type="button" className={btn()} onClick={() => formatHeading("h1")} title="제목 1" aria-label="제목 1">
        <Heading1 className="h-4 w-4" />
      </button>
      <button type="button" className={btn()} onClick={() => formatHeading("h2")} title="제목 2" aria-label="제목 2">
        <Heading2 className="h-4 w-4" />
      </button>
      <button type="button" className={btn()} onClick={() => formatHeading("h3")} title="제목 3" aria-label="제목 3">
        <Heading3 className="h-4 w-4" />
      </button>
      <button type="button" className={`${btn()} w-auto px-2 text-xs`} onClick={formatParagraph} title="본문" aria-label="본문">
        본문
      </button>

      <span className="mx-1 h-5 w-px bg-border-default" />

      <button type="button" className={btn()} onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)} title="글머리 목록" aria-label="글머리 목록">
        <List className="h-4 w-4" />
      </button>
      <button type="button" className={btn()} onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)} title="번호 목록" aria-label="번호 목록">
        <ListOrdered className="h-4 w-4" />
      </button>
      <button type="button" className={btn()} onClick={formatQuote} title="인용" aria-label="인용">
        <Quote className="h-4 w-4" />
      </button>
      <button type="button" className={btn()} onClick={insertLink} title="링크" aria-label="링크">
        <Link2 className="h-4 w-4" />
      </button>

      <span className="mx-1 h-5 w-px bg-border-default" />

      <button
        type="button"
        className={btn()}
        onClick={() => imageInputRef.current?.click()}
        disabled={isUploading}
        title="이미지"
        aria-label="이미지 삽입"
      >
        <ImageIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn()}
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        title="파일"
        aria-label="파일 첨부"
      >
        <Paperclip className="h-4 w-4" />
      </button>

      {isUploading && (
        <span className="ml-1 flex items-center gap-1 text-xs text-text-tertiary">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> 업로드 중...
        </span>
      )}

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelected}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelected}
        className="hidden"
      />
    </div>
  );
}
