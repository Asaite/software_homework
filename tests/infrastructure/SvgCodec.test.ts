import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { ShapeFactory } from "../../src/application/ShapeFactory.js";
import { TreeFormatter } from "../../src/application/presentation/TreeFormatter.js";
import { Group } from "../../src/domain/Group.js";
import { SvgDocument } from "../../src/domain/SvgDocument.js";
import { Text } from "../../src/domain/Text.js";
import { SvgReader } from "../../src/infrastructure/svg/SvgReader.js";
import { SvgWriter } from "../../src/infrastructure/svg/SvgWriter.js";

test("the assignment SVG imports all six types and emits the exact missing-ID warning", async () => {
  const source = await readFile(new URL("../fixtures/other.svg", import.meta.url), "utf8");
  const result = new SvgReader().parse(source);
  assert.deepEqual(result.warnings, ["assigned id rect1 to unnamed <rect>"]);
  assert.equal(result.document.size, 7);
  assert.equal(result.document.width, 400);
  assert.equal(result.document.find("r2").parent?.containerId, "g1");
  const restored = new SvgReader().parse(new SvgWriter().serialize(result.document));
  assert.deepEqual(new TreeFormatter().format(restored.document), new TreeFormatter().format(result.document));
  assert.deepEqual(restored.warnings, []);
});

test("missing IDs skip explicit IDs appearing later and remain globally unique", () => {
  const result = new SvgReader().parse('<svg><rect/><g><rect/><circle/></g><rect id="rect1"/><g id="g1"/></svg>');
  assert.deepEqual([...result.document.walk()].map(shape => shape.id), ["rect2", "g2", "rect3", "circle1", "rect1", "g1"]);
  assert.deepEqual(result.warnings, [
    "assigned id rect2 to unnamed <rect>",
    "assigned id g2 to unnamed <g>",
    "assigned id rect3 to unnamed <rect>",
    "assigned id circle1 to unnamed <circle>",
  ]);
  assert.equal(result.document.width, 800);
  assert.equal(result.document.height, 600);
  result.document.assertInvariants();
});

test("text whitespace, entities, CDATA and Unicode survive a save/read round-trip", () => {
  const result = new SvgReader().parse('<svg><text id="t" x=".5" y="-2">  中文 &amp; &lt;tag&gt;<![CDATA[ "in" ]]> &#13; </text></svg>');
  const text = result.document.find("t");
  assert.ok(text instanceof Text);
  assert.equal(text.content, '  中文 & <tag> "in"  \r ');
  const xml = new SvgWriter().serialize(result.document);
  assert.match(xml, /&amp;/);
  assert.match(xml, /&lt;tag/);
  assert.doesNotMatch(xml, / text=/);
  assert.equal((new SvgReader().parse(xml).document.find("t") as Text).content, text.content);
});

test("all shape geometry, styles and sibling order survive serialization", () => {
  const factory = new ShapeFactory();
  const document = new SvgDocument(420.5, 240);
  document.insert(new Group("scene"));
  const definitions = [
    ["rect", "r", { x: -1.2, y: 3, width: 20, height: 10, fill: "#fff" }],
    ["circle", "c", { cx: 2, cy: 4, r: 3 }],
    ["ellipse", "e", { cx: 2, cy: 4, rx: 3, ry: 5 }],
    ["line", "l", { x1: 1, y1: 2, x2: 8, y2: 9, stroke: "black", "stroke-width": 2 }],
    ["text", "t", { x: 5, y: 7, text: "A & B" }],
  ] as const;
  for (const [type, id, attributes] of definitions) document.insert(factory.create(type, id, attributes), "scene");
  document.setAttribute("scene", "fill", "red");
  const xml = new SvgWriter().serialize(document);
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
  assert.match(xml, /xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  assert.doesNotMatch(xml, /<circle[^>]*fill=/);
  assert.deepEqual(new TreeFormatter().format(new SvgReader().parse(xml).document), new TreeFormatter().format(document));
});

test("matching viewBox, px canvas dimensions and SVG namespace prefixes are normalized", () => {
  const result = new SvgReader().parse('<s:svg xmlns:s="http://www.w3.org/2000/svg" width="400px" height="300" viewBox="0,0,400,300"><s:rect id="r"/></s:svg>');
  assert.equal(result.document.width, 400);
  assert.equal(result.document.find("r").tagName, "rect");
  const viewBoxOnly = new SvgReader().parse('<svg viewBox="0 0 100 50"/>');
  assert.equal(viewBoxOnly.document.height, 50);
});

test("malformed XML is rejected rather than repaired silently", () => {
  const reader = new SvgReader();
  for (const source of ["", "<svg><rect></svg>", "<svg/><svg/>", '<svg><rect x="1" x="2"/></svg>', '<svg><text>&unknown;</text></svg>']) {
    assert.throws(() => reader.parse(source));
  }
});

test("duplicate IDs and unsupported content are rejected explicitly", () => {
  const reader = new SvgReader();
  const cases = [
    ['<svg><rect id="same"/><circle id="same"/></svg>', /id already exists: same/],
    ['<svg><path id="p"/></svg>', /unknown shape type: path/],
    ['<svg><g transform="translate(1,2)"/></svg>', /unknown attribute: transform/],
    ['<svg><text><tspan>label</tspan></text></svg>', /not a container/],
    ['<svg><text text="attribute is not content"/></svg>', /must be a child text node/],
    ['<svg><rect>unexpected</rect></svg>', /unexpected text/],
    ['<svg>unexpected</svg>', /unexpected text/],
    ['<svg><g><?instruction value?></g></svg>', /unsupported SVG node/],
    ['<svg fill="red"/>', /unsupported svg attribute: fill/],
    ['<svg width="100%"/>', /invalid SVG dimension/],
    ['<svg width="0"/>', /canvas width must be positive/],
    ['<svg viewBox="10 0 100 100"/>', /unsupported viewBox/],
    ['<svg width="200" height="100" viewBox="0 0 100 100"/>', /unsupported viewBox/],
    ['<svg xmlns="urn:wrong"/>', /unsupported SVG namespace/],
    ['<svg xmlns="http://www.w3.org/2000/svg"><rect xmlns=""/></svg>', /unsupported SVG namespace/],
    ['<!DOCTYPE svg><svg/>', /unsupported SVG document type/],
  ] as const;
  for (const [source, expected] of cases) assert.throws(() => reader.parse(source), expected);
});
