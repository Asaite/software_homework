export interface OutputMessage {
  readonly level: "info" | "warning";
  readonly text: string;
}

/** An immutable output DTO; no command writes directly to a terminal. */
export class CommandResult {
  readonly #messages: readonly OutputMessage[];

  constructor(lines: readonly string[] = [], warnings: readonly string[] = []) {
    this.#messages = Object.freeze([
      ...warnings.map(text => Object.freeze({ level: "warning" as const, text })),
      ...lines.map(text => Object.freeze({ level: "info" as const, text })),
    ]);
  }

  get messages(): readonly OutputMessage[] { return this.#messages; }
}
