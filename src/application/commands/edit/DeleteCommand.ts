import type { SvgDocument } from "../../../domain/SvgDocument.js";
import { CommandResult } from "../../CommandResult.js";
import { UndoableCommand } from "../UndoableCommand.js";

export class DeleteCommand extends UndoableCommand {
  readonly #id: string;
  constructor(id: string) { super(`delete ${id}`); this.#id = id; }
  protected override apply(document: SvgDocument): CommandResult {
    const shape = document.find(this.#id);
    document.delete(this.#id);
    return new CommandResult([`${shape.tagName}#${shape.id} deleted`]);
  }
}
