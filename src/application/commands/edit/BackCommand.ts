import type { SvgDocument } from "../../../domain/SvgDocument.js";
import { CommandResult } from "../../CommandResult.js";
import { UndoableCommand } from "../UndoableCommand.js";

export class BackCommand extends UndoableCommand {
  readonly #id: string;
  constructor(id: string) { super(`back ${id}`); this.#id = id; }
  protected override apply(document: SvgDocument): CommandResult {
    document.sendToBack(this.#id);
    return new CommandResult([`${document.find(this.#id).tagName}#${this.#id} sent to back`]);
  }
}
