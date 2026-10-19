import assert from "node:assert/strict";
import { test } from "node:test";
import { Circle } from "../../src/domain/Circle.js";
import { Ellipse } from "../../src/domain/Ellipse.js";
import { Group } from "../../src/domain/Group.js";
import { Line } from "../../src/domain/Line.js";
import { Rect } from "../../src/domain/Rect.js";
import { ShapeStyle } from "../../src/domain/ShapeStyle.js";
import { Text } from "../../src/domain/Text.js";

test("leaf polymorphism moves and scales every position and dimension", () => {
  const shapes = [
    new Rect("r", 1, 2, 3, 4),
    new Circle("c", 1, 2, 3),
    new Ellipse("e", 1, 2, 3, 4),
    new Line("l", 1, 2, 3, 4),
    new Text("t", 1, 2, "开始"),
  ];
  for (const shape of shapes) { shape.move(10, 20); shape.scale(2); }
  assert.deepEqual(shapes.map(shape => shape.attributes), [
    { x: "22", y: "44", width: "6", height: "8" },
    { cx: "22", cy: "44", r: "6" },
    { cx: "22", cy: "44", rx: "6", ry: "8" },
    { x1: "22", y1: "44", x2: "26", y2: "48" },
    { x: "22", y: "44", text: "开始" },
  ]);
});

test("styles are optional, detached from constructor inputs, and validated", () => {
  const style = new ShapeStyle({ fill: "red" });
  const shape = new Rect("r", 0, 0, 10, 20, style);
  style.set("fill", "blue");
  assert.deepEqual(new Circle("c", 0, 0, 1).styles, {});
  assert.equal(shape.styles["fill"], "red");
  shape.setAttribute("stroke-width", "0.5");
  assert.equal(shape.styles["stroke-width"], "0.5");
  assert.throws(() => shape.setAttribute("stroke-width", "-1"), /must be non-negative/);
  assert.equal(shape.styles["stroke-width"], "0.5");
});

test("attribute white lists are specific to each shape", () => {
  const text = new Text("t", 0, 0, "old");
  text.setAttribute("text", "new words 中文");
  text.setAttribute("x", "1.25e2");
  assert.equal(text.content, "new words 中文");
  assert.equal(text.x, 125);
  assert.throws(() => text.setAttribute("r", "2"), /unknown attribute: r/);
  assert.throws(() => new Group("g").setAttribute("x", "2"), /unknown attribute: x/);
  assert.throws(() => new Rect("r", 0, 0, 1, 1).setAttribute("text", "bad"), /unknown attribute: text/);
  assert.throws(() => text.setAttribute("id", "other"), /unknown attribute: id/);
});

test("invalid geometry and scale factors are rejected without changing a leaf", () => {
  assert.throws(() => new Circle("c", 0, 0, -1), /r must be non-negative/);
  assert.throws(() => new Rect("r", NaN, 0, 1, 1), /x must be a finite number/);
  const rect = new Rect("r", 1, 2, 3, 4);
  for (const factor of [0, -1, NaN, Infinity]) {
    assert.throws(() => rect.scale(factor), /scale factor must be positive/);
  }
  assert.throws(() => rect.setAttribute("width", "0x10"), /must be a finite number/);
  assert.throws(() => rect.setAttribute("width", ""), /must be a finite number/);
  assert.deepEqual(rect.attributes, { x: "1", y: "2", width: "3", height: "4" });
  const large = new Rect("large", Number.MAX_VALUE, 0, 1, 1);
  assert.throws(() => large.scale(2), /must be a finite number/);
  assert.equal(large.width, 1);
});

test("public attribute views cannot mutate a shape", () => {
  const shape = new Rect("r", 1, 2, 3, 4);
  assert.throws(() => { (shape.attributes as Record<string, string>)["x"] = "100"; }, TypeError);
  assert.equal(shape.x, 1);
});
