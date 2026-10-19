import type { CommandResult } from "../../CommandResult.js";
import type { EditorSession } from "../../EditorSession.js";
import type { Command } from "../Command.js";

export class InitCommand implements Command {
  readonly #width: number;
  readonly #height: number;
  constructor(width = 800, height = 600) { this.#width = width; this.#height = height; }
  async execute(session: EditorSession): Promise<CommandResult> {
    return session.init(this.#width, this.#height);
  }
}
