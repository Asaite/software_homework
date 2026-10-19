import type { SvgDocument } from "../../domain/SvgDocument.js";

export class ReadDocumentResult {
  readonly #document: SvgDocument;
  readonly #warnings: readonly string[];

  constructor(document: SvgDocument, warnings: readonly string[] = []) {
    this.#document = document;
    this.#warnings = Object.freeze([...warnings]);
  }

  get document(): SvgDocument { return this.#document; }
  get warnings(): readonly string[] { return this.#warnings; }
}
