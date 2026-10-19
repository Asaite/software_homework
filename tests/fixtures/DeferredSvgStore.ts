import type { SvgDocument } from "../../src/domain/SvgDocument.js";
import { MemorySvgStore } from "./MemorySvgStore.js";

/** Gives the test explicit control over the completion of an asynchronous write. */
export class DeferredSvgStore extends MemorySvgStore {
  #resume: (() => void) | undefined;
  #notifyStarted: (() => void) | undefined;
  readonly #gate = new Promise<void>(resolve => { this.#resume = resolve; });
  readonly #started = new Promise<void>(resolve => { this.#notifyStarted = resolve; });

  get started(): Promise<void> { return this.#started; }

  release(): void { this.#resume?.(); }

  override async write(path: string, document: SvgDocument): Promise<void> {
    this.#notifyStarted?.();
    await this.#gate;
    await super.write(path, document);
  }
}
