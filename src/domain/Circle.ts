import { Geometry } from "./Geometry.js";
import { Shape } from "./Shape.js";
import { ShapeStyle } from "./ShapeStyle.js";
import type { ShapeVisitor } from "./ShapeVisitor.js";

export class Circle extends Shape {
  constructor(id: string, cx: number, cy: number, r: number, style = new ShapeStyle()) {
    super(id, new Geometry({ cx, cy, r }, ["r"]), style);
  }
  override get tagName(): string { return "circle"; }
  get cx(): number { return this.geometry.get("cx"); }
  get cy(): number { return this.geometry.get("cy"); }
  get r(): number { return this.geometry.get("r"); }
  override clone(): Circle { return new Circle(this.id, this.cx, this.cy, this.r, this.style); }
  override accept<R>(visitor: ShapeVisitor<R>): R { return visitor.visitCircle(this); }
  protected override moveGeometry(dx: number, dy: number): void {
    this.geometry.translate(["cx"], ["cy"], dx, dy);
  }
}
