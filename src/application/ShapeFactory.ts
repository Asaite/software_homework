import { Circle } from "../domain/Circle.js";
import { DomainError } from "../domain/DomainError.js";
import { Ellipse } from "../domain/Ellipse.js";
import { Group } from "../domain/Group.js";
import { Line } from "../domain/Line.js";
import { Rect } from "../domain/Rect.js";
import type { Shape } from "../domain/Shape.js";
import { Text } from "../domain/Text.js";

export type ShapeAttributes = Readonly<Record<string, string | number>>;

export class ShapeFactory {
  // The only shape-type dispatch point. CLI arity validation will live in CommandFactory.
  readonly #constructors: ReadonlyMap<string, (id: string) => Shape> = new Map<string, (id: string) => Shape>([
    ["rect", (id: string) => new Rect(id, 0, 0, 0, 0)],
    ["circle", (id: string) => new Circle(id, 0, 0, 0)],
    ["ellipse", (id: string) => new Ellipse(id, 0, 0, 0, 0)],
    ["line", (id: string) => new Line(id, 0, 0, 0, 0)],
    ["text", (id: string) => new Text(id, 0, 0, "")],
    ["g", (id: string) => new Group(id)],
  ]);

  create(type: string, id: string, attributes: ShapeAttributes = {}): Shape {
    const construct = this.#constructors.get(type);
    if (!construct) throw new DomainError(`unknown shape type: ${type} (is the plugin loaded?)`);
    const shape = construct(id);
    for (const [name, value] of Object.entries(attributes)) shape.setAttribute(name, String(value));
    return shape;
  }
}
