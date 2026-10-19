import type { SvgDocument } from "../domain/SvgDocument.js";
import { ApplicationError } from "./ApplicationError.js";
import type { CommandResult } from "./CommandResult.js";
import type { UndoableCommand } from "./commands/UndoableCommand.js";

export class CommandHistory {
  readonly #undoStack: UndoableCommand[] = [];
  readonly #redoStack: UndoableCommand[] = [];
  #ioBlocked = false;

  get undoCount(): number { return this.#undoStack.length; }
  get redoCount(): number { return this.#redoStack.length; }
  get ioBlocked(): boolean { return this.#ioBlocked; }

  record(command: UndoableCommand): void {
    this.#undoStack.push(command);
    this.#redoStack.length = 0;
    this.#ioBlocked = false;
  }

  blockAfterIo(): void {
    this.#undoStack.length = 0;
    this.#redoStack.length = 0;
    this.#ioBlocked = true;
  }

  undo(document: SvgDocument): CommandResult {
    this.requireAllowed();
    const command = this.#undoStack.at(-1);
    if (!command) throw new ApplicationError("nothing to undo");
    const result = command.undo(document);
    this.#undoStack.pop();
    this.#redoStack.push(command);
    return result;
  }

  redo(document: SvgDocument): CommandResult {
    this.requireAllowed();
    const command = this.#redoStack.at(-1);
    if (!command) throw new ApplicationError("nothing to redo");
    const result = command.redo(document);
    this.#redoStack.pop();
    this.#undoStack.push(command);
    return result;
  }

  private requireAllowed(): void {
    if (this.#ioBlocked) throw new ApplicationError("undo not allowed after io command");
  }
}
