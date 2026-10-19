import { ApplicationError } from "../application/ApplicationError.js";
import type { CommandToken } from "./CommandToken.js";

export class CommandArguments {
  readonly #tokens: readonly CommandToken[];

  constructor(tokens: readonly CommandToken[]) { this.#tokens = Object.freeze([...tokens]); }
  get tokens(): readonly CommandToken[] { return this.#tokens; }
  get values(): readonly string[] { return this.#tokens.map(token => token.value); }
  get length(): number { return this.#tokens.length; }

  expect(minimum: number, maximum: number, syntax: string): void {
    if (this.length < minimum || this.length > maximum) throw new ApplicationError(`usage: ${syntax}`);
  }

  value(index: number): string {
    const token = this.#tokens[index];
    if (!token) throw new ApplicationError("missing command argument");
    return token.value;
  }

  number(index: number, name: string): number {
    const value = this.value(index);
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(value) || !Number.isFinite(Number(value))) {
      throw new ApplicationError(`${name} must be a finite number`);
    }
    return Number(value);
  }
}
