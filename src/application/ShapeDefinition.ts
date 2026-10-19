import { DomainError } from "../domain/DomainError.js";
import type { Shape } from "../domain/Shape.js";
import type { ShapeAttributes } from "./ShapeFactory.js";

/** Built-in construction metadata, shared by command parsing and SVG import. */
export class ShapeDefinition {
  readonly #construct: (id: string) => Shape;
  readonly #parameters: readonly string[];
  readonly #optionalStyle: string | undefined;

  constructor(construct: (id: string) => Shape, parameters: readonly string[], optionalStyle?: string) {
    this.#construct = construct;
    this.#parameters = Object.freeze([...parameters]);
    this.#optionalStyle = optionalStyle;
  }

  get textArgumentIndex(): number { return this.#parameters.indexOf("text"); }

  create(id: string, attributes: ShapeAttributes, textContent?: string): Shape {
    const shape = this.#construct(id);
    for (const [name, value] of Object.entries(attributes)) shape.setAttribute(name, String(value));
    if (textContent !== undefined) {
      if (this.textArgumentIndex >= 0) shape.setAttribute("text", textContent);
      else if (textContent.trim() !== "") throw new DomainError(`unexpected text in <${shape.tagName}>`);
    }
    return shape;
  }

  attributesFromArguments(values: readonly string[], type: string): ShapeAttributes {
    const required = this.#parameters.length;
    const maximum = required + (this.#optionalStyle === undefined ? 0 : 1);
    if (values.length < required || values.length > maximum) {
      const parameters = this.#parameters.map(name => name === "text" ? '"content"' : `<${name}>`).join(" ");
      const optional = this.#optionalStyle === undefined ? "" : ` [${this.#optionalStyle}]`;
      throw new DomainError(`usage: create ${type} <id>${parameters ? ` ${parameters}` : ""}${optional} [in <containerId>]`);
    }
    const attributes: Record<string, string> = {};
    for (const [index, name] of this.#parameters.entries()) attributes[name] = values[index]!;
    if (this.#optionalStyle !== undefined && values[required] !== undefined) {
      attributes[this.#optionalStyle] = values[required];
    }
    return Object.freeze(attributes);
  }
}
