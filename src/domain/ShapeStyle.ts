import { DomainError } from "./DomainError.js";
import { NumberValidator } from "./internal/NumberValidator.js";

export class ShapeStyle {
  readonly #values = new Map<string, string>();

  constructor(attributes: Readonly<Record<string, string | number>> = {}) {
    for (const [name, value] of Object.entries(attributes)) {
      if (!this.set(name, String(value))) throw new DomainError(`unknown attribute: ${name}`);
    }
  }

  /** Returns false for a field belonging to the shape rather than its style. */
  set(name: string, value: string): boolean {
    if (name === "fill" || name === "stroke") {
      if (value.trim() === "") throw new DomainError(`${name} must not be empty`);
      this.#values.set(name, value);
      return true;
    }
    if (name === "stroke-width") {
      const width = NumberValidator.nonNegative(NumberValidator.parse(value, name), name);
      this.#values.set(name, String(width));
      return true;
    }
    return false;
  }

  get attributes(): Readonly<Record<string, string>> {
    return Object.freeze(Object.fromEntries(this.#values));
  }

  clone(): ShapeStyle {
    return new ShapeStyle(this.attributes);
  }
}
