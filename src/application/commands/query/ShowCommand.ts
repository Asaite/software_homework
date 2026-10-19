import { CommandResult } from "../../CommandResult.js";
import type { EditorSession } from "../../EditorSession.js";
import { ShowFormatter } from "../../presentation/ShowFormatter.js";
import type { Command } from "../Command.js";

export class ShowCommand implements Command {
  readonly #id: string;
  constructor(id: string) { this.#id = id; }
  async execute(session: EditorSession): Promise<CommandResult> {
    return new CommandResult(new ShowFormatter().format(session.requireDocument(), this.#id));
  }
}
