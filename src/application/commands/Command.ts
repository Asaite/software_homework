import type { CommandResult } from "../CommandResult.js";
import type { EditorSession } from "../EditorSession.js";

export interface Command {
  execute(session: EditorSession): Promise<CommandResult>;
}
