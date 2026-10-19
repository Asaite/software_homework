import { DOMImplementation, XMLSerializer } from "@xmldom/xmldom";
import type { SvgDocument } from "../../domain/SvgDocument.js";
import { SvgWriterVisitor } from "./SvgWriterVisitor.js";

export class SvgWriter {
  serialize(document: SvgDocument): string {
    document.assertInvariants();
    const xml = new DOMImplementation().createDocument("http://www.w3.org/2000/svg", "svg", null);
    const root = xml.documentElement!;
    root.setAttribute("width", String(document.width));
    root.setAttribute("height", String(document.height));
    root.setAttribute("viewBox", `0 0 ${document.width} ${document.height}`);
    const visitor = new SvgWriterVisitor(xml);
    for (const shape of document.children) {
      root.appendChild(xml.createTextNode("\n  "));
      root.appendChild(shape.accept(visitor));
    }
    if (document.children.length > 0) root.appendChild(xml.createTextNode("\n"));
    // XML parsers normalize literal CR to LF; character references preserve it.
    const content = new XMLSerializer().serializeToString(xml, { requireWellFormed: true }).replace(/\r/g, "&#13;");
    return `<?xml version="1.0" encoding="UTF-8"?>\n${content}\n`;
  }
}
