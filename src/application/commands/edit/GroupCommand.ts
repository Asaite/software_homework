import type { SvgDocument } from "../../../domain/SvgDocument.js";
import { CommandResult } from "../../CommandResult.js";
import { UndoableCommand } from "../UndoableCommand.js";

export class GroupCommand extends UndoableCommand {
  readonly #id: string;
  readonly #children: readonly string[];
  constructor(id: string, children: readonly string[]) {
    super(`group ${id}`); this.#id = id; this.#children = Object.freeze([...children]);
  }
  protected override apply(document: SvgDocument): CommandResult {
    const group = document.group(this.#id, this.#children);
    return new CommandResult([`g#${group.id} created with ${group.children.length} children`]);
  }
}
