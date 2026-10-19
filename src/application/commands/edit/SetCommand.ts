import type { SvgDocument } from "../../../domain/SvgDocument.js";
import { CommandResult } from "../../CommandResult.js";
import { UndoableCommand } from "../UndoableCommand.js";

export class SetCommand extends UndoableCommand {
  readonly #id: string;
  readonly #attribute: string;
  readonly #value: string;
  constructor(id: string, attribute: string, value: string) {
    super(`set ${id}`); this.#id = id; this.#attribute = attribute; this.#value = value;
  }
  protected override apply(document: SvgDocument): CommandResult {
    document.setAttribute(this.#id, this.#attribute, this.#value);
    const shape = document.find(this.#id);
    return new CommandResult([`${shape.tagName}#${shape.id} updated: ${this.#attribute}=${JSON.stringify(this.#value)}`]);
  }
}
