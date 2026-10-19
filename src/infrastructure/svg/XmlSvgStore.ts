import { constants } from "node:fs";
import { access, lstat, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { ApplicationError } from "../../application/ApplicationError.js";
import { ShapeFactory } from "../../application/ShapeFactory.js";
import type { ReadDocumentResult } from "../../application/ports/ReadDocumentResult.js";
import type { SvgStore } from "../../application/ports/SvgStore.js";
import type { SvgDocument } from "../../domain/SvgDocument.js";
import { SvgReader } from "./SvgReader.js";
import { SvgWriter } from "./SvgWriter.js";

export class XmlSvgStore implements SvgStore {
  readonly #reader: SvgReader;
  readonly #writer = new SvgWriter();

  constructor(factory = new ShapeFactory()) { this.#reader = new SvgReader(factory); }

  async read(path: string): Promise<ReadDocumentResult> {
    let source: string;
    try { source = await readFile(path, "utf8"); }
    catch { throw new ApplicationError(`cannot read file: ${path}`); }
    return this.#reader.parse(source);
  }

  async write(path: string, document: SvgDocument): Promise<void> {
    const content = this.#writer.serialize(document);
    let temporary: string | undefined;
    try {
      const target = resolve(path);
      let mode: number | undefined;
      try {
        const existing = await lstat(target);
        if (!existing.isFile()) throw new ApplicationError(`cannot write file: ${path}`);
        await access(target, constants.W_OK);
        mode = existing.mode & 0o777;
      } catch (error) {
        if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
      }
      temporary = await mkdtemp(join(dirname(target), ".svg-editor-"));
      const candidate = join(temporary, "document.svg");
      await writeFile(candidate, content, { encoding: "utf8", flag: "wx", ...(mode === undefined ? {} : { mode }) });
      await rename(candidate, target);
    } catch {
      throw new ApplicationError(`cannot write file: ${path}`);
    } finally {
      if (temporary !== undefined) await rm(temporary, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}
