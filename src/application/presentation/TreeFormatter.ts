import type { Shape } from "../../domain/Shape.js";
import type { SvgDocument } from "../../domain/SvgDocument.js";
import { ShapeTextVisitor } from "./ShapeTextVisitor.js";

export class TreeFormatter {
  readonly #visitor = new ShapeTextVisitor();

  format(document: SvgDocument, id?: string): readonly string[] {
    if (id !== undefined) {
      const shape = document.find(id);
      return [shape.accept(this.#visitor), ...this.children(shape.children, "")];
    }
    return [`svg (${document.width}x${document.height})`, ...this.children(document.children, "")];
  }

  private children(shapes: readonly Shape[], prefix: string): string[] {
    const lines: string[] = [];
    for (const [index, shape] of shapes.entries()) {
      const last = index === shapes.length - 1;
      lines.push(`${prefix}${last ? "└── " : "├── "}${shape.accept(this.#visitor)}`);
      lines.push(...this.children(shape.children, `${prefix}${last ? "    " : "│   "}`));
    }
    return lines;
  }
}
