import { SvgDocument } from "../domain/SvgDocument.js";
import { ApplicationError } from "./ApplicationError.js";
import { CommandHistory } from "./CommandHistory.js";
import { CommandResult } from "./CommandResult.js";
import { ShapeFactory } from "./ShapeFactory.js";
import type { Command } from "./commands/Command.js";
import type { SvgStore } from "./ports/SvgStore.js";

export class EditorSession {
  #document: SvgDocument | undefined;
  #filePath: string | undefined;
  #pending: Promise<void> = Promise.resolve();
  readonly #history = new CommandHistory();
  readonly #shapeFactory: ShapeFactory;
  readonly #store: SvgStore | undefined;

  constructor(shapeFactory = new ShapeFactory(), store?: SvgStore) {
    this.#shapeFactory = shapeFactory;
    this.#store = store;
  }

  get history(): CommandHistory { return this.#history; }
  get shapeFactory(): ShapeFactory { return this.#shapeFactory; }
  get filePath(): string | undefined { return this.#filePath; }

  /** Serializes commands, including asynchronous file operations; a failure does not stop the queue. */
  execute(command: Command): Promise<CommandResult> {
    const result = this.#pending.then(() => command.execute(this));
    this.#pending = result.then(() => undefined, () => undefined);
    return result;
  }

  requireDocument(): SvgDocument {
    if (!this.#document) throw new ApplicationError("no document. use 'init' or 'read' first");
    return this.#document;
  }

  init(width = 800, height = 600): CommandResult {
    const next = new SvgDocument(width, height);
    this.#document = next;
    this.#filePath = undefined;
    this.#history.blockAfterIo();
    return new CommandResult([`canvas ${width}x${height} created`]);
  }

  resize(width: number, height: number): CommandResult {
    this.requireDocument().resize(width, height);
    this.#history.blockAfterIo();
    return new CommandResult([`canvas resized to ${width}x${height}`]);
  }

  async read(path: string): Promise<CommandResult> {
    const loaded = await this.requireStore().read(path);
    const next = loaded.document.clone();
    next.assertInvariants();
    const result = new CommandResult([`read ${path} (${next.size} elements)`], loaded.warnings);
    this.#document = next;
    this.#filePath = path;
    this.#history.blockAfterIo();
    return result;
  }

  async save(path?: string): Promise<CommandResult> {
    const document = this.requireDocument();
    const target = path ?? this.#filePath;
    if (!target) throw new ApplicationError("no file path. use 'save <file.svg>'");
    await this.requireStore().write(target, document.clone());
    this.#filePath = target;
    this.#history.blockAfterIo();
    return new CommandResult([`saved to ${target} (${document.size} elements)`]);
  }

  undo(): CommandResult { return this.#history.undo(this.requireDocument()); }
  redo(): CommandResult { return this.#history.redo(this.requireDocument()); }

  private requireStore(): SvgStore {
    if (!this.#store) throw new ApplicationError("SVG file storage is not configured");
    return this.#store;
  }
}
