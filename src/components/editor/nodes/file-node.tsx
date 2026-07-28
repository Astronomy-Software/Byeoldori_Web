import {
  DecoratorNode,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from "lexical";
import type { JSX } from "react";
import { Paperclip, Download } from "lucide-react";

export type SerializedFileNode = Spread<
  {
    url: string;
    fileName: string;
    fileSize: number;
    contentType: string;
  },
  SerializedLexicalNode
>;

// 사람이 읽기 쉬운 파일 크기 표기
function formatSize(bytes: number): string {
  if (!bytes || bytes < 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

// 첨부 파일 DecoratorNode — 다운로드 링크 카드로 렌더.
export class FileNode extends DecoratorNode<JSX.Element> {
  __url: string;
  __fileName: string;
  __fileSize: number;
  __contentType: string;

  static getType(): string {
    return "attachment";
  }

  static clone(node: FileNode): FileNode {
    return new FileNode(
      node.__url,
      node.__fileName,
      node.__fileSize,
      node.__contentType,
      node.__key,
    );
  }

  constructor(
    url: string,
    fileName: string,
    fileSize: number,
    contentType: string,
    key?: NodeKey,
  ) {
    super(key);
    this.__url = url;
    this.__fileName = fileName;
    this.__fileSize = fileSize;
    this.__contentType = contentType;
  }

  static importJSON(serialized: SerializedFileNode): FileNode {
    return $createFileNode(
      serialized.url,
      serialized.fileName,
      serialized.fileSize,
      serialized.contentType,
    );
  }

  exportJSON(): SerializedFileNode {
    return {
      ...super.exportJSON(),
      type: "attachment",
      version: 1,
      url: this.__url,
      fileName: this.__fileName,
      fileSize: this.__fileSize,
      contentType: this.__contentType,
    };
  }

  createDOM(): HTMLElement {
    const div = document.createElement("div");
    div.style.display = "block";
    return div;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <a
        href={this.__url}
        target="_blank"
        rel="noopener noreferrer"
        download={this.__fileName}
        className="my-2 flex max-w-md items-center gap-3 rounded-lg border border-border-default bg-surface-1 p-3 no-underline transition-colors hover:border-interactive-primary"
      >
        <Paperclip className="h-5 w-5 shrink-0 text-text-tertiary" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-text-primary">
            {this.__fileName}
          </span>
          {this.__fileSize > 0 && (
            <span className="block text-xs text-text-tertiary">
              {formatSize(this.__fileSize)}
            </span>
          )}
        </span>
        <Download className="h-4 w-4 shrink-0 text-text-tertiary" />
      </a>
    );
  }
}

export function $createFileNode(
  url: string,
  fileName: string,
  fileSize: number,
  contentType: string,
): FileNode {
  return new FileNode(url, fileName, fileSize, contentType);
}

export function $isFileNode(
  node: LexicalNode | null | undefined,
): node is FileNode {
  return node instanceof FileNode;
}
