import { DomainError } from "./DomainError.js";
import { NumberValidator } from "./internal/NumberValidator.js";

/** Encapsulates numeric fields and validates an entire update before applying it. */
export class Geometry {
  #values: Map<string, number>;
  readonly #nonNegative: ReadonlySet<string>;

  constructor(values: Readonly<Record<string, number>>, nonNegative: readonly string[] = []) {
    this.#values = new Map(Object.entries(values));
    this.#nonNegative = new Set(nonNegative);
    this.validate(this.#values);
  }

  has(name: string): boolean {
    return this.#values.has(name);
  }

  get(name: string): number {
    const value = this.#values.get(name);
    if (value === undefined) throw new DomainError(`unknown attribute: ${name}`);
    return value;
  }

  set(name: string, rawValue: string): void {
    if (!this.has(name)) throw new DomainError(`unknown attribute: ${name}`);
    this.update(new Map([[name, NumberValidator.parse(rawValue, name)]]));
  }

  translate(xNames: readonly string[], yNames: readonly string[], dx: number, dy: number): void {
    const changes = new Map<string, number>();
    for (const name of xNames) changes.set(name, this.get(name) + dx);
    for (const name of yNames) changes.set(name, this.get(name) + dy);
    this.update(changes);
  }

  scale(factor: number): void {
    this.update(new Map([...this.#values].map(([name, value]) => [name, value * factor])));
  }

  get attributes(): Readonly<Record<string, string>> {
    return Object.freeze(Object.fromEntries([...this.#values].map(([name, value]) => [name, String(value)])));
  }

  private update(changes: ReadonlyMap<string, number>): void {
    const next = new Map(this.#values);
    for (const [name, value] of changes) next.set(name, value);
    this.validate(next);
    this.#values = next;
  }

  private validate(values: ReadonlyMap<string, number>): void {
    for (const [name, value] of values) {
      if (this.#nonNegative.has(name)) NumberValidator.nonNegative(value, name);
      else NumberValidator.finite(value, name);
    }
  }
}
