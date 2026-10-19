import type { SvgDocument } from "../../../domain/SvgDocument.js";
import { CommandResult } from "../../CommandResult.js";
import { UndoableCommand } from "../UndoableCommand.js";

export class ScaleCommand extends UndoableCommand {
  readonly #id: string;
  readonly #factor: number;
  constructor(id: string, factor: number) { super(`scale ${id}`); this.#id = id; this.#factor = factor; }
  protected override apply(document: SvgDocument): CommandResult {
    document.scale(this.#id, this.#factor);
    const shape = document.find(this.#id);
    return new CommandResult([`${shape.tagName}#${shape.id} scaled by ${this.#factor}`]);
  }
}
