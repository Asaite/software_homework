import type { SvgDocument } from "../../domain/SvgDocument.js";
import type { ReadDocumentResult } from "./ReadDocumentResult.js";

export interface SvgStore {
  read(path: string): Promise<ReadDocumentResult>;
  write(path: string, document: SvgDocument): Promise<void>;
}
