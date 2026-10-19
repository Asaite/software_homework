import { ApplicationError } from "../../ApplicationError.js";
import { CommandResult } from "../../CommandResult.js";
import type { EditorSession } from "../../EditorSession.js";
import type { Command } from "../Command.js";

export class CanvasCommand implements Command {
  readonly #width: number | undefined;
  readonly #height: number | undefined;
  constructor(width?: number, height?: number) { this.#width = width; this.#height = height; }
  async execute(session: EditorSession): Promise<CommandResult> {
    const document = session.requireDocument();
    if (this.#width === undefined && this.#height === undefined) {
      return new CommandResult([`canvas ${document.width}x${document.height}`]);
    }
    if (this.#width === undefined || this.#height === undefined) {
      throw new ApplicationError("usage: canvas [w h]");
    }
    return session.resize(this.#width, this.#height);
  }
}
