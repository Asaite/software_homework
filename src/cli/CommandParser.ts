import type { Command } from "../application/commands/Command.js";
import { CommandFactory } from "./CommandFactory.js";
import { CommandTokenizer } from "./CommandTokenizer.js";

export class CommandParser {
  readonly #tokenizer = new CommandTokenizer();
  readonly #factory: CommandFactory;

  constructor(factory = new CommandFactory()) { this.#factory = factory; }

  parse(line: string): Command | null {
    const tokens = this.#tokenizer.tokenize(line);
    return tokens.length === 0 ? null : this.#factory.create(tokens);
  }
}
