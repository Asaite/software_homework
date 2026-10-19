import type { SvgDocument } from "../../../domain/SvgDocument.js";
import { CommandResult } from "../../CommandResult.js";
import { UndoableCommand } from "../UndoableCommand.js";

export class UngroupCommand extends UndoableCommand {
  readonly #id: string;
  constructor(id: string) { super(`ungroup ${id}`); this.#id = id; }
  protected override apply(document: SvgDocument): CommandResult {
    document.ungroup(this.#id);
    return new CommandResult([`g#${this.#id} ungrouped`]);
  }
}
