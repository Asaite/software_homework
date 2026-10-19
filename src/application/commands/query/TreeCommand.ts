import { CommandResult } from "../../CommandResult.js";
import type { EditorSession } from "../../EditorSession.js";
import { TreeFormatter } from "../../presentation/TreeFormatter.js";
import type { Command } from "../Command.js";

export class TreeCommand implements Command {
  readonly #id: string | undefined;
  constructor(id?: string) { this.#id = id; }
  async execute(session: EditorSession): Promise<CommandResult> {
    return new CommandResult(new TreeFormatter().format(session.requireDocument(), this.#id));
  }
}
