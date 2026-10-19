import type { DocumentSnapshot } from "../../domain/DocumentSnapshot.js";
import { SvgDocument } from "../../domain/SvgDocument.js";
import { ApplicationError } from "../ApplicationError.js";
import { CommandResult } from "../CommandResult.js";
import type { EditorSession } from "../EditorSession.js";
import type { ShapeFactory } from "../ShapeFactory.js";
import type { Command } from "./Command.js";

export abstract class UndoableCommand implements Command {
  readonly #description: string;
  #before: DocumentSnapshot | undefined;
  #after: DocumentSnapshot | undefined;

  protected constructor(description: string) { this.#description = description; }

  async execute(session: EditorSession): Promise<CommandResult> {
    if (this.#after !== undefined) throw new ApplicationError("command has already been executed");
    const document = session.requireDocument();
    const before = document.createSnapshot();
    const draft = SvgDocument.fromSnapshot(before);
    const result = this.apply(draft, session.shapeFactory);
    draft.assertInvariants();
    const after = draft.createSnapshot();
    document.restore(after);
    this.#before = before;
    this.#after = after;
    session.history.record(this);
    return result;
  }

  undo(document: SvgDocument): CommandResult {
    if (this.#before === undefined) throw new ApplicationError("command has not been executed");
    document.restore(this.#before);
    return new CommandResult([`${this.#description} undone`]);
  }

  redo(document: SvgDocument): CommandResult {
    if (this.#after === undefined) throw new ApplicationError("command has not been executed");
    document.restore(this.#after);
    return new CommandResult([`${this.#description} redone`]);
  }

  protected abstract apply(document: SvgDocument, factory: ShapeFactory): CommandResult;
}
