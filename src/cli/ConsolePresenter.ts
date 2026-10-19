import type { Writable } from "node:stream";
import type { CommandResult } from "../application/CommandResult.js";

export class ConsolePresenter {
  readonly #output: Writable;
  readonly #errors: Writable;

  constructor(output: Writable = process.stdout, errors: Writable = process.stderr) {
    this.#output = output;
    this.#errors = errors;
  }

  printLine(text: string): void { this.#output.write(`${text}\n`); }

  present(result: CommandResult): void {
    for (const message of result.messages) {
      this.printLine(message.level === "warning" ? `warning: ${message.text}` : message.text);
    }
  }

  presentError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.#errors.write(`error: ${message.replace(/[\r\n]+/g, " ")}\n`);
  }
}
