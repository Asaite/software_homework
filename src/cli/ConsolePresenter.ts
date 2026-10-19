import type { CommandResult } from "../application/CommandResult.js";

export class ConsolePresenter {
  present(result: CommandResult): void {
    for (const message of result.messages) {
      console.log(message.level === "warning" ? `warning: ${message.text}` : message.text);
    }
  }

  presentError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`error: ${message.replace(/[\r\n]+/g, " ")}`);
  }
}
