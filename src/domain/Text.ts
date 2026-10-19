import { Geometry } from "./Geometry.js";
import { Shape } from "./Shape.js";
import { ShapeStyle } from "./ShapeStyle.js";
import type { ShapeVisitor } from "./ShapeVisitor.js";

export class Text extends Shape {
  #content: string;
  constructor(id: string, x: number, y: number, content: string, style = new ShapeStyle()) {
    super(id, new Geometry({ x, y }), style);
    this.#content = content;
  }
  override get tagName(): string { return "text"; }
  get x(): number { return this.geometry.get("x"); }
  get y(): number { return this.geometry.get("y"); }
  get content(): string { return this.#content; }
  override get attributes(): Readonly<Record<string, string>> {
    return Object.freeze({ ...super.attributes, text: this.content });
  }
  override setAttribute(name: string, value: string): void {
    if (name === "text") this.#content = value;
    else super.setAttribute(name, value);
  }
  override clone(): Text { return new Text(this.id, this.x, this.y, this.content, this.style); }
  override accept<R>(visitor: ShapeVisitor<R>): R { return visitor.visitText(this); }
  protected override moveGeometry(dx: number, dy: number): void {
    this.geometry.translate(["x"], ["y"], dx, dy);
  }
}
