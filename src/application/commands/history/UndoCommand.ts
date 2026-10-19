import type { CommandResult } from "../../CommandResult.js";
import type { EditorSession } from "../../EditorSession.js";
import type { Command } from "../Command.js";

export class UndoCommand implements Command {
  async execute(session: EditorSession): Promise<CommandResult> { return session.undo(); }
}
