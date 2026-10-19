import { Circle } from "../domain/Circle.js";
import { DomainError } from "../domain/DomainError.js";
import { Ellipse } from "../domain/Ellipse.js";
import { Group } from "../domain/Group.js";
import { Line } from "../domain/Line.js";
import { Rect } from "../domain/Rect.js";
import type { Shape } from "../domain/Shape.js";
import { Text } from "../domain/Text.js";
import { ShapeDefinition } from "./ShapeDefinition.js";

export type ShapeAttributes = Readonly<Record<string, string | number>>;

export class ShapeFactory {
  // The only shape-type dispatch point; all input channels share these definitions.
  readonly #definitions: ReadonlyMap<string, ShapeDefinition> = new Map([
    ["rect", new ShapeDefinition(id => new Rect(id, 0, 0, 0, 0), ["x", "y", "width", "height"], "fill")],
    ["circle", new ShapeDefinition(id => new Circle(id, 0, 0, 0), ["cx", "cy", "r"], "fill")],
    ["ellipse", new ShapeDefinition(id => new Ellipse(id, 0, 0, 0, 0), ["cx", "cy", "rx", "ry"], "fill")],
    ["line", new ShapeDefinition(id => new Line(id, 0, 0, 0, 0), ["x1", "y1", "x2", "y2"], "stroke")],
    ["text", new ShapeDefinition(id => new Text(id, 0, 0, ""), ["x", "y", "text"])],
    ["g", new ShapeDefinition(id => new Group(id), [])],
  ]);

  create(type: string, id: string, attributes: ShapeAttributes = {}): Shape {
    return this.definitionFor(type).create(id, attributes);
  }

  import(type: string, id: string, attributes: ShapeAttributes, textContent: string): Shape {
    return this.definitionFor(type).create(id, attributes, textContent);
  }

  definitionFor(type: string): ShapeDefinition {
    const definition = this.#definitions.get(type);
    if (!definition) throw new DomainError(`unknown shape type: ${type} (is the plugin loaded?)`);
    return definition;
  }
}
