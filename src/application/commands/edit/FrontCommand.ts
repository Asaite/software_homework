import type { SvgDocument } from "../../../domain/SvgDocument.js";
import { CommandResult } from "../../CommandResult.js";
import { UndoableCommand } from "../UndoableCommand.js";

export class FrontCommand extends UndoableCommand {
  readonly #id: string;
  constructor(id: string) { super(`front ${id}`); this.#id = id; }
  protected override apply(document: SvgDocument): CommandResult {
    document.bringToFront(this.#id);
    return new CommandResult([`${document.find(this.#id).tagName}#${this.#id} brought to front`]);
  }
}
