import { ReadDocumentResult } from "../../src/application/ports/ReadDocumentResult.js";
import type { SvgStore } from "../../src/application/ports/SvgStore.js";
import type { SvgDocument } from "../../src/domain/SvgDocument.js";

/** Test adapter, deliberately independent of XML and the filesystem. */
export class MemorySvgStore implements SvgStore {
  readonly #files = new Map<string, SvgDocument>();
  #failWrites = false;

  set failWrites(value: boolean) { this.#failWrites = value; }

  async read(path: string): Promise<ReadDocumentResult> {
    const document = this.#files.get(path);
    if (!document) throw new Error(`cannot read file: ${path}`);
    return new ReadDocumentResult(document.clone(), ["test adapter read"]);
  }

  async write(path: string, document: SvgDocument): Promise<void> {
    if (this.#failWrites) throw new Error(`cannot write file: ${path}`);
    this.#files.set(path, document.clone());
  }
}
