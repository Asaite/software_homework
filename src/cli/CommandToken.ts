export class CommandToken {
  readonly #value: string;
  readonly #quoted: boolean;

  constructor(value: string, quoted = false) { this.#value = value; this.#quoted = quoted; }
  get value(): string { return this.#value; }
  get quoted(): boolean { return this.#quoted; }
}
