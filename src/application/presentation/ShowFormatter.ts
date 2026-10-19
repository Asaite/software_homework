import type { SvgDocument } from "../../domain/SvgDocument.js";

export class ShowFormatter {
  format(document: SvgDocument, id: string): readonly string[] {
    const shape = document.find(id);
    const parentId = shape.parent?.containerId;
    const parent = parentId === null || parentId === undefined ? "svg" : `g#${parentId}`;
    const attributes = Object.entries(shape.attributes).map(([name, value]) =>
      `  ${name}=${name === "text" ? JSON.stringify(value) : value}`,
    );
    return [`${shape.tagName}#${shape.id}  parent=${parent}`, ...attributes];
  }
}
