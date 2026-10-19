import type { SvgDocument } from "../../../domain/SvgDocument.js";
import { CommandResult } from "../../CommandResult.js";
import type { ShapeAttributes, ShapeFactory } from "../../ShapeFactory.js";
import { UndoableCommand } from "../UndoableCommand.js";

export class CreateCommand extends UndoableCommand {
  readonly #type: string;
  readonly #id: string;
  readonly #attributes: ShapeAttributes;
  readonly #containerId: string | undefined;

  constructor(type: string, id: string, attributes: ShapeAttributes = {}, containerId?: string) {
    super(`create ${id}`);
    this.#type = type;
    this.#id = id;
    this.#attributes = Object.freeze({ ...attributes });
    this.#containerId = containerId;
  }

  protected override apply(document: SvgDocument, factory: ShapeFactory): CommandResult {
    const shape = factory.create(this.#type, this.#id, this.#attributes);
    document.insert(shape, this.#containerId);
    const parent = this.#containerId === undefined ? "" : ` in g#${this.#containerId}`;
    return new CommandResult([`${shape.tagName}#${shape.id} created${parent}`]);
  }
}
