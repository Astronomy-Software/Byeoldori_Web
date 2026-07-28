import {
  DecoratorNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from "lexical";
import type { JSX } from "react";

export type SerializedImageNode = Spread<
  {
    src: string;
    altText: string;
  },
  SerializedLexicalNode
>;

// 인라인 이미지 DecoratorNode.
// 외부(백엔드) URL을 단순 <img>로 렌더한다(next/image 미사용).
export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__altText, node.__key);
  }

  constructor(src: string, altText: string, key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__altText = altText;
  }

  static importJSON(serialized: SerializedImageNode): ImageNode {
    return $createImageNode(serialized.src, serialized.altText);
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      type: "image",
      version: 1,
      src: this.__src,
      altText: this.__altText,
    };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: (element: HTMLElement): DOMConversionOutput => {
          const img = element as HTMLImageElement;
          return { node: $createImageNode(img.src, img.alt ?? "") };
        },
        priority: 0,
      }),
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("img");
    element.setAttribute("src", this.__src);
    element.setAttribute("alt", this.__altText);
    return { element };
  }

  createDOM(): HTMLElement {
    const span = document.createElement("span");
    span.style.display = "inline-block";
    return span;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={this.__src}
        alt={this.__altText}
        className="my-2 max-w-full rounded-lg border border-border-default"
      />
    );
  }
}

export function $createImageNode(src: string, altText = ""): ImageNode {
  return new ImageNode(src, altText);
}

export function $isImageNode(
  node: LexicalNode | null | undefined,
): node is ImageNode {
  return node instanceof ImageNode;
}
