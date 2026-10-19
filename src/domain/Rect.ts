import { Geometry } from "./Geometry.js";
import { Shape } from "./Shape.js";
import { ShapeStyle } from "./ShapeStyle.js";
import type { ShapeVisitor } from "./ShapeVisitor.js";

export class Rect extends Shape {
  constructor(id: string, x: number, y: number, width: number, height: number, style = new ShapeStyle()) {
    super(id, new Geometry({ x, y, width, height }, ["width", "height"]), style);
  }
  override get tagName(): string { return "rect"; }
  get x(): number { return this.geometry.get("x"); }
  get y(): number { return this.geometry.get("y"); }
  get width(): number { return this.geometry.get("width"); }
  get height(): number { return this.geometry.get("height"); }
  override clone(): Rect { return new Rect(this.id, this.x, this.y, this.width, this.height, this.style); }
  override accept<R>(visitor: ShapeVisitor<R>): R { return visitor.visitRect(this); }
  protected override moveGeometry(dx: number, dy: number): void {
    this.geometry.translate(["x"], ["y"], dx, dy);
  }
}
