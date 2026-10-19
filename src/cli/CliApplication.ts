import { createInterface } from "node:readline";
import type { Readable, Writable } from "node:stream";
import type { EditorSession } from "../application/EditorSession.js";
import { CommandParser } from "./CommandParser.js";
import { ConsolePresenter } from "./ConsolePresenter.js";

export class CliApplication {
  readonly #session: EditorSession;
  readonly #parser: CommandParser;
  readonly #presenter: ConsolePresenter;
  readonly #input: Readable;
  readonly #output: Writable;
  readonly #terminal: boolean;

  constructor(
    session: EditorSession,
    parser = new CommandParser(),
    presenter = new ConsolePresenter(),
    input: Readable = process.stdin,
    output: Writable = process.stdout,
    terminal?: boolean,
  ) {
    this.#session = session;
    this.#parser = parser;
    this.#presenter = presenter;
    this.#input = input;
    this.#output = output;
    this.#terminal = terminal ?? ("isTTY" in input && input.isTTY === true && "isTTY" in output && output.isTTY === true);
  }

  async run(): Promise<void> {
    this.#presenter.printLine("svg-editor 0.1 — type 'help' for commands");
    const lines = createInterface({ input: this.#input, output: this.#output, terminal: this.#terminal, crlfDelay: Infinity });
    lines.setPrompt("svg> ");
    if (this.#terminal) lines.prompt();
    try {
      for await (const line of lines) {
        try {
          const command = this.#parser.parse(line);
          if (command !== null) this.#presenter.present(await this.#session.execute(command));
        } catch (error) {
          this.#presenter.presentError(error);
        }
        if (this.#terminal) lines.prompt();
      }
    } finally {
      lines.close();
    }
  }
}
