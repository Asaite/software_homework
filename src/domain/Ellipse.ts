import { Geometry } from "./Geometry.js";
import { Shape } from "./Shape.js";
import { ShapeStyle } from "./ShapeStyle.js";
import type { ShapeVisitor } from "./ShapeVisitor.js";

export class Ellipse extends Shape {
  constructor(id: string, cx: number, cy: number, rx: number, ry: number, style = new ShapeStyle()) {
    super(id, new Geometry({ cx, cy, rx, ry }, ["rx", "ry"]), style);
  }
  override get tagName(): string { return "ellipse"; }
  get cx(): number { return this.geometry.get("cx"); }
  get cy(): number { return this.geometry.get("cy"); }
  get rx(): number { return this.geometry.get("rx"); }
  get ry(): number { return this.geometry.get("ry"); }
  override clone(): Ellipse { return new Ellipse(this.id, this.cx, this.cy, this.rx, this.ry, this.style); }
  override accept<R>(visitor: ShapeVisitor<R>): R { return visitor.visitEllipse(this); }
  protected override moveGeometry(dx: number, dy: number): void {
    this.geometry.translate(["cx"], ["cy"], dx, dy);
  }
}
