import type { SvgDocument } from "../../../domain/SvgDocument.js";
import { CommandResult } from "../../CommandResult.js";
import { UndoableCommand } from "../UndoableCommand.js";

export class AddToCommand extends UndoableCommand {
  readonly #containerId: string;
  readonly #id: string;
  constructor(containerId: string, id: string) {
    super(`addto ${containerId} ${id}`); this.#containerId = containerId; this.#id = id;
  }
  protected override apply(document: SvgDocument): CommandResult {
    document.addTo(this.#containerId, this.#id);
    const shape = document.find(this.#id);
    return new CommandResult([`${shape.tagName}#${shape.id} moved into g#${this.#containerId}`]);
  }
}
