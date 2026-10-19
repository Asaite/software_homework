import type { CommandResult } from "../../CommandResult.js";
import type { EditorSession } from "../../EditorSession.js";
import type { Command } from "../Command.js";

export class ReadCommand implements Command {
  readonly #path: string;
  constructor(path: string) { this.#path = path; }
  async execute(session: EditorSession): Promise<CommandResult> { return session.read(this.#path); }
}
