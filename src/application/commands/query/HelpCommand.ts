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
      "  create rect <id> <x> <y> <w> <h> [fill] [in <containerId>]",
      "  create circle <id> <cx> <cy> <r> [fill] [in <containerId>]",
      "  create ellipse <id> <cx> <cy> <rx> <ry> [fill] [in <containerId>]",
      "  create line <id> <x1> <y1> <x2> <y2> [stroke] [in <containerId>]",
      '  create text <id> <x> <y> "content" [in <containerId>]',
      "  create g <id> [in <containerId>]",
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
