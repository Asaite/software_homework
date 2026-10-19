import { EditorSession } from "./application/EditorSession.js";
import { ShapeFactory } from "./application/ShapeFactory.js";
import { CliApplication } from "./cli/CliApplication.js";
import { CommandFactory } from "./cli/CommandFactory.js";
import { CommandParser } from "./cli/CommandParser.js";
import { ConsolePresenter } from "./cli/ConsolePresenter.js";
import { XmlSvgStore } from "./infrastructure/svg/XmlSvgStore.js";

/** Composition root: no editing or XML rules belong in the entry point. */
export class Main {
  async run(): Promise<void> {
    const presenter = new ConsolePresenter();
    const shapes = new ShapeFactory();
    const session = new EditorSession(shapes, new XmlSvgStore(shapes));
    const parser = new CommandParser(new CommandFactory(shapes));
    try {
      await new CliApplication(session, parser, presenter).run();
    } catch (error) {
      presenter.presentError(error);
      process.exitCode = 1;
    }
  }
}

await new Main().run();
