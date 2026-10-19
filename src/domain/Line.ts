import { Geometry } from "./Geometry.js";
import { Shape } from "./Shape.js";
import { ShapeStyle } from "./ShapeStyle.js";
import type { ShapeVisitor } from "./ShapeVisitor.js";

export class Line extends Shape {
  constructor(id: string, x1: number, y1: number, x2: number, y2: number, style = new ShapeStyle()) {
    super(id, new Geometry({ x1, y1, x2, y2 }), style);
  }
  override get tagName(): string { return "line"; }
  get x1(): number { return this.geometry.get("x1"); }
  get y1(): number { return this.geometry.get("y1"); }
  get x2(): number { return this.geometry.get("x2"); }
  get y2(): number { return this.geometry.get("y2"); }
  override clone(): Line { return new Line(this.id, this.x1, this.y1, this.x2, this.y2, this.style); }
  override accept<R>(visitor: ShapeVisitor<R>): R { return visitor.visitLine(this); }
  protected override moveGeometry(dx: number, dy: number): void {
    this.geometry.translate(["x1", "x2"], ["y1", "y2"], dx, dy);
  }
}
