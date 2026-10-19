import assert from "node:assert/strict";
import { test } from "node:test";
import { Circle } from "../../src/domain/Circle.js";
import { Group } from "../../src/domain/Group.js";
import { Rect } from "../../src/domain/Rect.js";
import type { Shape } from "../../src/domain/Shape.js";
import { SvgDocument } from "../../src/domain/SvgDocument.js";
import { Text } from "../../src/domain/Text.js";

test("document enforces global case-sensitive IDs and container lookups", () => {
  const document = new SvgDocument();
  document.insert(new Group("g"));
  document.insert(new Rect("r", 0, 0, 1, 1), "g");
  document.insert(new Rect("R", 0, 0, 1, 1));
  assert.throws(() => document.insert(new Circle("r", 0, 0, 1)), /id already exists: r/);
  assert.throws(() => document.insert(new Group("other"), "missing"), /no such container: missing/);
  assert.throws(() => document.insert(new Group("other"), "r"), /not a container: r/);
  assert.equal(document.size, 3);
  document.assertInvariants();
});

test("nested groups recursively move and scale while group styles remain inherited", () => {
  const document = new SvgDocument();
  document.insert(new Group("outer"));
  document.insert(new Group("inner"), "outer");
  document.insert(new Rect("r", 1, 2, 3, 4), "inner");
  document.insert(new Text("t", 4, 5, "hello"), "outer");
  document.setAttribute("outer", "fill", "red");
  document.setAttribute("r", "fill", "blue");
  document.move("outer", 10, 20);
  document.scale("outer", 2);
  assert.deepEqual(document.find("r").attributes, { x: "22", y: "44", width: "6", height: "8", fill: "blue" });
  assert.deepEqual(document.find("t").attributes, { x: "28", y: "50", text: "hello" });
  assert.deepEqual(document.find("outer").styles, { fill: "red" });
  document.assertInvariants();
});

test("grouping across parents uses the common ancestor and original document order", () => {
  const document = new SvgDocument();
  document.insert(new Group("scene"));
  document.insert(new Group("left"), "scene");
  document.insert(new Group("right"), "scene");
  document.insert(new Rect("a", 1, 0, 1, 1), "left");
  document.insert(new Circle("keep", 2, 0, 1), "left");
  document.insert(new Rect("b", 3, 0, 1, 1), "right");
  const group = document.group("merged", ["b", "a"]);
  assert.equal(group.parent?.containerId, "scene");
  assert.deepEqual(group.children.map(shape => shape.id), ["a", "b"]);
  assert.deepEqual(document.find("scene").children.map(shape => shape.id), ["merged", "left", "right"]);
  assert.deepEqual(document.find("left").children.map(shape => shape.id), ["keep"]);
  assert.equal(document.find("a").attributes["x"], "1");
  document.assertInvariants();
});

test("group rejects ancestor selections and duplicate operands before any tree change", () => {
  const document = new SvgDocument();
  document.insert(new Group("g"));
  document.insert(new Rect("r", 0, 0, 1, 1), "g");
  assert.throws(() => document.group("bad", ["r", "g"]), /cannot group a container into its own descendant: g/);
  assert.throws(() => document.group("bad", ["r", "r"]), /duplicate shape/);
  assert.equal(document.has("bad"), false);
  assert.equal(document.find("r").parent?.containerId, "g");
  document.assertInvariants();
});

test("ungroup replaces a nested group in place and rejects a top-level group", () => {
  const document = new SvgDocument();
  document.insert(new Group("scene"));
  document.insert(new Circle("before", 0, 0, 1), "scene");
  document.insert(new Group("g"), "scene");
  document.insert(new Circle("after", 0, 0, 1), "scene");
  document.insert(new Circle("a", 0, 0, 1), "g");
  document.insert(new Circle("b", 0, 0, 1), "g");
  document.ungroup("g");
  assert.deepEqual(document.find("scene").children.map(shape => shape.id), ["before", "a", "b", "after"]);
  assert.equal(document.has("g"), false);
  assert.throws(() => document.ungroup("scene"), /cannot ungroup top-level container: scene/);
  document.assertInvariants();
});

test("reparenting rejects cycles and appends within an existing parent", () => {
  const document = new SvgDocument();
  document.insert(new Group("outer"));
  document.insert(new Group("inner"), "outer");
  document.insert(new Rect("r", 0, 0, 1, 1), "outer");
  assert.throws(() => document.addTo("inner", "outer"), /cannot move a container into its own descendant: outer/);
  assert.throws(() => document.addTo("outer", "outer"), /cannot move a container into its own descendant: outer/);
  document.addTo("outer", "inner");
  assert.deepEqual(document.find("outer").children.map(shape => shape.id), ["r", "inner"]);
  document.assertInvariants();
});

test("z-order is local to siblings and deleting a group removes every descendant from the index", () => {
  const document = new SvgDocument();
  document.insert(new Group("g"));
  for (const id of ["a", "b", "c"]) document.insert(new Circle(id, 0, 0, 1), "g");
  document.bringToFront("a");
  assert.deepEqual(document.find("g").children.map(shape => shape.id), ["b", "c", "a"]);
  document.sendToBack("a");
  assert.deepEqual(document.find("g").children.map(shape => shape.id), ["a", "b", "c"]);
  document.delete("g");
  assert.equal(document.size, 0);
  for (const id of ["g", "a", "b", "c"]) assert.equal(document.has(id), false);
  document.assertInvariants();
});

test("snapshots isolate graphs, preserve runtime classes, dimensions and parent links", () => {
  const document = new SvgDocument(400, 300);
  document.insert(new Group("g"));
  document.insert(new Rect("r", 0.1, 2, 3, 4), "g");
  const snapshot = document.createSnapshot();
  snapshot.copyRoots()[0]?.move(500, 500);
  document.move("g", 100, 100);
  document.resize(900, 700);
  document.restore(snapshot);
  assert.equal(document.width, 400);
  assert.equal(document.height, 300);
  const restored = document.find("r");
  assert.ok(restored instanceof Rect);
  assert.equal(restored.x, 0.1);
  assert.equal(document.find("g").parent, document);
  assert.equal(restored.parent, document.find("g"));
  restored.move(10, 0);
  document.restore(snapshot);
  assert.equal(document.find("r").attributes["x"], "0.1");
  document.assertInvariants();
});

test("invalid dimensions or tree positions preserve the document", () => {
  const document = new SvgDocument(400, 300);
  assert.throws(() => document.resize(800, 0), /canvas height must be positive/);
  assert.equal(document.width, 400);
  const shape = new Rect("r", 0, 0, 1, 1);
  assert.throws(() => document.insert(shape, undefined, 2), /invalid child position/);
  assert.equal(shape.parent, null);
  assert.equal(document.size, 0);
  assert.throws(() => (document.children as Shape[]).push(shape), TypeError);
  document.assertInvariants();
});
