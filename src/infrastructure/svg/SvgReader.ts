import { DOMParser, type Element, type Node } from "@xmldom/xmldom";
import { ApplicationError } from "../../application/ApplicationError.js";
import { ShapeFactory } from "../../application/ShapeFactory.js";
import { ReadDocumentResult } from "../../application/ports/ReadDocumentResult.js";
import { SvgDocument } from "../../domain/SvgDocument.js";

export class SvgReader {
  static readonly namespace = "http://www.w3.org/2000/svg";
  readonly #factory: ShapeFactory;

  constructor(factory = new ShapeFactory()) { this.#factory = factory; }

  parse(source: string): ReadDocumentResult {
    const xml = new DOMParser({ onError: (_level, message) => { throw new Error(message); } })
      .parseFromString(source, "application/xml");
    if (xml.doctype) throw new ApplicationError("unsupported SVG document type declaration");
    const root = xml.documentElement;
    if (!root || root.localName !== "svg") throw new ApplicationError("expected an <svg> root element");
    this.checkNamespace(root);
    for (const node of Array.from(xml.childNodes)) {
      if (node.nodeType === 7 && node.nodeName !== "xml") {
        throw new ApplicationError(`unsupported XML processing instruction: ${node.nodeName}`);
      }
    }
    const document = this.createDocument(root);
    const elements = [...this.descendants(root)];
    const reserved = new Set<string>();
    for (const element of elements) {
      const id = element.getAttribute("id");
      if (id) {
        if (reserved.has(id)) throw new ApplicationError(`id already exists: ${id}`);
        reserved.add(id);
      }
    }
    const assigned = new Map<Element, string>();
    const counters = new Map<string, number>();
    const warnings: string[] = [];
    for (const element of elements) {
      const tag = element.localName ?? element.tagName;
      let id = element.getAttribute("id");
      if (!id) {
        let number = counters.get(tag) ?? 1;
        while (reserved.has(`${tag}${number}`)) number++;
        id = `${tag}${number}`;
        counters.set(tag, number + 1);
        reserved.add(id);
        warnings.push(`assigned id ${id} to unnamed <${tag}>`);
      }
      assigned.set(element, id);
    }
    this.importChildren(root, document, assigned);
    document.assertInvariants();
    return new ReadDocumentResult(document, warnings);
  }

  private createDocument(root: Element): SvgDocument {
    const allowed = new Set(["width", "height", "viewBox", "version"]);
    for (const attribute of Array.from(root.attributes)) {
      if (attribute.namespaceURI === "http://www.w3.org/2000/xmlns/" || attribute.name === "xmlns") continue;
      if (!allowed.has(attribute.name)) throw new ApplicationError(`unsupported svg attribute: ${attribute.name}`);
    }
    const viewBox = root.getAttribute("viewBox");
    const box = viewBox === null ? undefined : viewBox.trim().split(/[\s,]+/).map(value => this.dimension(value));
    if (box && (box.length !== 4 || box[0] !== 0 || box[1] !== 0)) {
      throw new ApplicationError("unsupported viewBox: expected 0 0 width height");
    }
    const width = this.dimension(root.getAttribute("width") ?? String(box?.[2] ?? 800));
    const height = this.dimension(root.getAttribute("height") ?? String(box?.[3] ?? 600));
    if (box && (box[2] !== width || box[3] !== height)) {
      throw new ApplicationError("unsupported viewBox: dimensions must match the canvas");
    }
    return new SvgDocument(width, height);
  }

  private dimension(value: string): number {
    const match = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)(?:px)?$/.exec(value.trim());
    if (!match || !Number.isFinite(Number(match[1]))) throw new ApplicationError(`invalid SVG dimension: ${value}`);
    return Number(match[1]);
  }

  private importChildren(parent: Element, document: SvgDocument, assigned: ReadonlyMap<Element, string>, parentId?: string): void {
    if (parent === parent.ownerDocument?.documentElement && this.directText(parent).trim() !== "") {
      throw new ApplicationError("unexpected text in <svg>");
    }
    for (const node of Array.from(parent.childNodes)) {
      if (node.nodeType === 8 || node.nodeType === 3 || node.nodeType === 4) continue;
      if (node.nodeType !== 1) throw new ApplicationError(`unsupported SVG node: ${node.nodeName}`);
      const element = node as Element;
      this.checkNamespace(element);
      const attributes: Record<string, string> = {};
      for (const attribute of Array.from(element.attributes)) {
        if (attribute.name === "id" || attribute.namespaceURI === "http://www.w3.org/2000/xmlns/") continue;
        attributes[attribute.name] = attribute.value;
      }
      const id = assigned.get(element);
      if (id === undefined) throw new ApplicationError("missing imported shape identity");
      const shape = this.#factory.import(element.localName ?? element.tagName, id, attributes, this.directText(element));
      document.insert(shape, parentId);
      if (Array.from(element.childNodes).some(child => child.nodeType === 1)) shape.asContainer();
      this.importChildren(element, document, assigned, id);
    }
  }

  private directText(element: Element): string {
    return Array.from(element.childNodes)
      .filter(node => node.nodeType === 3 || node.nodeType === 4)
      .map(node => node.nodeValue ?? "").join("");
  }

  private *descendants(parent: Node): IterableIterator<Element> {
    for (const node of Array.from(parent.childNodes)) {
      if (node.nodeType === 1) {
        yield node as Element;
        yield* this.descendants(node);
      }
    }
  }

  private checkNamespace(element: Element): void {
    const expected = element.ownerDocument?.documentElement?.namespaceURI ?? null;
    if ((element.namespaceURI !== null && element.namespaceURI !== SvgReader.namespace) || element.namespaceURI !== expected) {
      throw new ApplicationError(`unsupported SVG namespace: ${element.namespaceURI}`);
    }
  }
}
