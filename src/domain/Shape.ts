import { DomainError } from "./DomainError.js";
import type { Geometry } from "./Geometry.js";
import type { Group } from "./Group.js";
import type { ShapeContainer } from "./ShapeContainer.js";
import { ShapeStyle } from "./ShapeStyle.js";
import type { ShapeVisitor } from "./ShapeVisitor.js";
import { NumberValidator } from "./internal/NumberValidator.js";
import { TreeAccess } from "./internal/TreeAccess.js";

export abstract class Shape {
  readonly #id: string;
  #parent: ShapeContainer | null = null;
  protected readonly geometry: Geometry;
  protected readonly style: ShapeStyle;

  protected constructor(id: string, geometry: Geometry, style = new ShapeStyle()) {
    if (id.length === 0 || /\s/.test(id)) throw new DomainError(`invalid id: ${id}`);
    this.#id = id;
    this.geometry = geometry;
    this.style = style.clone();
  }

  get id(): string { return this.#id; }
  get parent(): ShapeContainer | null { return this.#parent; }
  get children(): readonly Shape[] { return Object.freeze([]); }
  get styles(): Readonly<Record<string, string>> { return this.style.attributes; }
  get attributes(): Readonly<Record<string, string>> {
    return Object.freeze({ ...this.geometry.attributes, ...this.styles });
  }

  abstract get tagName(): string;
  abstract clone(): Shape;
  abstract accept<R>(visitor: ShapeVisitor<R>): R;

  move(dx: number, dy: number): void {
    NumberValidator.finite(dx, "dx");
    NumberValidator.finite(dy, "dy");
    this.moveGeometry(dx, dy);
  }

  scale(factor: number): void {
    if (!Number.isFinite(factor) || factor <= 0) {
      throw new DomainError("scale factor must be positive");
    }
    this.scaleGeometry(factor);
  }

  setAttribute(name: string, value: string): void {
    if (this.style.set(name, value)) return;
    this.geometry.set(name, value);
  }

  asContainer(): Group {
    throw new DomainError(`not a container: ${this.id}`);
  }

  *walk(): IterableIterator<Shape> {
    yield this;
    for (const child of this.children) yield* child.walk();
  }

  [TreeAccess.setParent](parent: ShapeContainer | null): void {
    this.#parent = parent;
  }

  protected abstract moveGeometry(dx: number, dy: number): void;

  protected scaleGeometry(factor: number): void {
    this.geometry.scale(factor);
  }
}
