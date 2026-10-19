import { EditorSession } from "./application/EditorSession.js";
import { InitCommand } from "./application/commands/document/InitCommand.js";
import { CreateCommand } from "./application/commands/edit/CreateCommand.js";
import { MoveCommand } from "./application/commands/edit/MoveCommand.js";
import { UndoCommand } from "./application/commands/history/UndoCommand.js";
import { RedoCommand } from "./application/commands/history/RedoCommand.js";
import { TreeCommand } from "./application/commands/query/TreeCommand.js";
import { ConsolePresenter } from "./cli/ConsolePresenter.js";

/** Retains the first increment's deterministic demonstration independently of the REPL. */
export class Demo {
  async run(): Promise<void> {
    const presenter = new ConsolePresenter();
    const session = new EditorSession();
    try {
      for (const command of [
        new InitCommand(),
        new CreateCommand("g", "scene"),
        new CreateCommand("rect", "node", { x: 20, y: 30, width: 120, height: 60, fill: "#4a90d9" }, "scene"),
        new CreateCommand("text", "label", { x: 40, y: 65, text: "开始" }, "scene"),
        new MoveCommand("scene", 100, 50), new TreeCommand(),
        new UndoCommand(), new TreeCommand(), new RedoCommand(), new TreeCommand(),
      ]) presenter.present(await session.execute(command));
    } catch (error) {
      presenter.presentError(error);
      process.exitCode = 1;
    }
  }
}

await new Demo().run();
