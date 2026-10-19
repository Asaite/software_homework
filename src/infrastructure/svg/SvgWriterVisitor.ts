import type { Document, Element } from "@xmldom/xmldom";
import type { Circle } from "../../domain/Circle.js";
import type { Ellipse } from "../../domain/Ellipse.js";
import type { Group } from "../../domain/Group.js";
import type { Line } from "../../domain/Line.js";
import type { Rect } from "../../domain/Rect.js";
import type { Shape } from "../../domain/Shape.js";
import type { ShapeVisitor } from "../../domain/ShapeVisitor.js";
import type { Text } from "../../domain/Text.js";

export class SvgWriterVisitor implements ShapeVisitor<Element> {
  readonly #document: Document;
  #depth = 1;

  constructor(document: Document) { this.#document = document; }
  visitRect(shape: Rect): Element { return this.element(shape); }
  visitCircle(shape: Circle): Element { return this.element(shape); }
  visitEllipse(shape: Ellipse): Element { return this.element(shape); }
  visitLine(shape: Line): Element { return this.element(shape); }

  visitText(shape: Text): Element {
    const element = this.element(shape);
    element.appendChild(this.#document.createTextNode(shape.content));
    return element;
  }

  visitGroup(shape: Group): Element {
    const element = this.element(shape);
    this.#depth++;
    try {
      for (const child of shape.children) {
        element.appendChild(this.#document.createTextNode(`\n${"  ".repeat(this.#depth)}`));
        element.appendChild(child.accept(this));
      }
    } finally {
      this.#depth--;
    }
    if (shape.children.length > 0) element.appendChild(this.#document.createTextNode(`\n${"  ".repeat(this.#depth)}`));
    return element;
  }

  private element(shape: Shape): Element {
    const element = this.#document.createElementNS("http://www.w3.org/2000/svg", shape.tagName);
    element.setAttribute("id", shape.id);
    for (const [name, value] of Object.entries(shape.attributes)) {
      if (name !== "text") element.setAttribute(name, value);
    }
    return element;
  }
}
