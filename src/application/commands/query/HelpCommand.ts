import { CommandResult } from "../../CommandResult.js";
import type { EditorSession } from "../../EditorSession.js";
import type { Command } from "../Command.js";

export class HelpCommand implements Command {
  async execute(session: EditorSession): Promise<CommandResult> {
    session.requireDocument();
    return new CommandResult([
      "init [w] [h]",
      "read <file.svg>",
      "save [file.svg]",
      "canvas [w] [h]",
      "create <type> <id> [params...] [in <containerId>]",
      "delete <id>",
      "move <id> <dx> <dy>",
      "scale <id> <factor>",
      "set <id> <attr> <value>",
      "group <newGid> <id1> <id2>...",
      "ungroup <gid>",
      "addto <gid> <id>",
      "front <id>",
      "back <id>",
      "tree [id]",
      "show <id>",
      "help",
      "undo",
      "redo",
    ]);
  }
}
