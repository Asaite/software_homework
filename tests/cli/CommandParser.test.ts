import assert from "node:assert/strict";
import { test } from "node:test";
import { EditorSession } from "../../src/application/EditorSession.js";
import { ShapeFactory } from "../../src/application/ShapeFactory.js";
import { CommandParser } from "../../src/cli/CommandParser.js";
import { Text } from "../../src/domain/Text.js";
import { MemorySvgStore } from "../fixtures/MemorySvgStore.js";

test("the parser creates all six shape types with optional styles and parent suffixes", async () => {
  const parser = new CommandParser();
  const session = new EditorSession();
  for (const line of [
    "init 400", "create g scene", "create g inner in scene",
    "create rect r -1.5 2e1 10 20 #ffffff in inner",
    "create circle c 10 20 5 red in inner",
    "create ellipse e 10 20 5 6 in inner",
    "create line l 0 0 10 20 black in inner",
    'create text t 10 20 "in" in inner',
    'create text empty 10 20 ""',
  ]) {
    const command = parser.parse(line);
    assert.ok(command);
    await session.execute(command);
  }
  assert.equal(session.requireDocument().height, 600);
  assert.equal(session.requireDocument().width, 400);
  assert.equal(session.requireDocument().find("r").attributes["x"], "-1.5");
  assert.equal(session.requireDocument().find("r").styles["fill"], "#ffffff");
  assert.deepEqual(session.requireDocument().find("e").styles, {});
  assert.equal(session.requireDocument().find("l").styles["stroke"], "black");
  assert.equal((session.requireDocument().find("t") as Text).content, "in");
  assert.equal(session.requireDocument().find("t").parent?.containerId, "inner");
  assert.equal((session.requireDocument().find("empty") as Text).content, "");
});

test("every command name reaches its use case with semantic history and file boundaries", async () => {
  const parser = new CommandParser();
  const session = new EditorSession(new ShapeFactory(), new MemorySvgStore());
  for (const line of [
    "init 400 300", "canvas", "canvas 500 400", "create g scene",
    "create rect a 0 0 10 20 in scene", "create circle b 10 20 5 in scene",
    "group pair b a", "move pair 2 3", "scale pair 2", "set a fill red",
    "undo", "redo", "front a", "back a", "ungroup pair",
    "create g target in scene", "addto target a", "tree scene", "show a", "help",
    "delete target", "undo", 'save "diagram with spaces.svg"',
    'read "diagram with spaces.svg"', "save",
  ]) {
    const command = parser.parse(line);
    assert.ok(command);
    await session.execute(command);
  }
  assert.equal(session.requireDocument().find("a").parent?.containerId, "target");
  assert.equal(session.requireDocument().find("a").styles["fill"], "red");
  assert.equal(session.filePath, "diagram with spaces.svg");
  assert.equal(session.history.ioBlocked, true);
  assert.equal(session.requireDocument().width, 500);
});

test("wrong argument counts, missing IDs and malformed numeric values are rejected", () => {
  const parser = new CommandParser();
  for (const line of [
    "init 1 2 3", "read", "save a b", "canvas 1", "canvas 1 2 3", "create rect",
    "create rect r 0 0 10", "create circle c 0 0", "create ellipse e 0 0 1",
    "create line l 0 0 1", 'create text t 0 0 "hello" extra', "create g g extra",
    "create g g in", "create g g in parent extra", "delete", "move r 1", "move r NaN 0",
    "move r 0x10 0", "move r 1e309 0", "scale r", "set r fill", "group g a",
    "ungroup", "addto g", "front", "back", "tree a b", "show", "help extra", "undo extra", "redo extra",
  ]) assert.throws(() => parser.parse(line), Error, line);
  assert.throws(() => parser.parse("create text t 0 0 hello"), /text content must be enclosed/);
  assert.throws(() => parser.parse("create box n 0 0 1 1"), /unknown shape type: box/);
  assert.throws(() => parser.parse("unknown"), /unknown command: unknown/);
});

test("parse failures, blank lines and comments cannot change document or history", async () => {
  const parser = new CommandParser();
  const session = new EditorSession();
  for (const line of ["init", "create rect r 10 20 30 40", "move r 5 0", "undo"]) {
    await session.execute(parser.parse(line)!);
  }
  assert.equal(parser.parse("# move r 100 100"), null);
  assert.equal(parser.parse(""), null);
  assert.throws(() => parser.parse('set r fill "unterminated'), /unterminated/);
  assert.equal(session.history.redoCount, 1);
  assert.equal(session.requireDocument().find("r").attributes["x"], "10");
});
