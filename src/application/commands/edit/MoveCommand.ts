import type { SvgDocument } from "../../../domain/SvgDocument.js";
import { CommandResult } from "../../CommandResult.js";
import { UndoableCommand } from "../UndoableCommand.js";

export class MoveCommand extends UndoableCommand {
  readonly #id: string;
  readonly #dx: number;
  readonly #dy: number;
  constructor(id: string, dx: number, dy: number) {
    super(`move ${id}`); this.#id = id; this.#dx = dx; this.#dy = dy;
  }
  protected override apply(document: SvgDocument): CommandResult {
    document.move(this.#id, this.#dx, this.#dy);
    const shape = document.find(this.#id);
    return new CommandResult([`${shape.tagName}#${shape.id} moved by (${this.#dx},${this.#dy})`]);
  }
}
