import { DomainError } from "./DomainError.js";
import { Geometry } from "./Geometry.js";
import { Shape } from "./Shape.js";
import type { ShapeContainer } from "./ShapeContainer.js";
import { ShapeStyle } from "./ShapeStyle.js";
import type { ShapeVisitor } from "./ShapeVisitor.js";
import { TreeAccess } from "./internal/TreeAccess.js";

export class Group extends Shape implements ShapeContainer {
  readonly #children: Shape[] = [];

  constructor(id: string, style = new ShapeStyle()) {
    super(id, new Geometry({}), style);
  }
  override get tagName(): string { return "g"; }
  get containerId(): string { return this.id; }
  override get children(): readonly Shape[] { return Object.freeze([...this.#children]); }
  override asContainer(): Group { return this; }
  override accept<R>(visitor: ShapeVisitor<R>): R { return visitor.visitGroup(this); }

  override clone(): Group {
    const copy = new Group(this.id, this.style);
    for (const child of this.#children) {
      const clonedChild = child.clone();
      copy[TreeAccess.insertChild](clonedChild, copy.#children.length);
      clonedChild[TreeAccess.setParent](copy);
    }
    return copy;
  }

  [TreeAccess.insertChild](shape: Shape, index: number): void {
    if (!Number.isInteger(index) || index < 0 || index > this.#children.length) {
      throw new DomainError("invalid child position");
    }
    this.#children.splice(index, 0, shape);
  }

  [TreeAccess.removeChild](shape: Shape): void {
    const index = this.#children.indexOf(shape);
    if (index < 0) throw new DomainError(`no such child: ${shape.id}`);
    this.#children.splice(index, 1);
  }

  protected override moveGeometry(dx: number, dy: number): void {
    for (const child of this.#children) child.move(dx, dy);
  }

  protected override scaleGeometry(factor: number): void {
    for (const child of this.#children) child.scale(factor);
  }
}
