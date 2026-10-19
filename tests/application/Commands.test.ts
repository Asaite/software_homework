import assert from "node:assert/strict";
import { test } from "node:test";
import { EditorSession } from "../../src/application/EditorSession.js";
import { ShapeFactory } from "../../src/application/ShapeFactory.js";
import { CanvasCommand } from "../../src/application/commands/document/CanvasCommand.js";
import { InitCommand } from "../../src/application/commands/document/InitCommand.js";
import { AddToCommand } from "../../src/application/commands/edit/AddToCommand.js";
import { BackCommand } from "../../src/application/commands/edit/BackCommand.js";
import { CreateCommand } from "../../src/application/commands/edit/CreateCommand.js";
import { DeleteCommand } from "../../src/application/commands/edit/DeleteCommand.js";
import { FrontCommand } from "../../src/application/commands/edit/FrontCommand.js";
import { GroupCommand } from "../../src/application/commands/edit/GroupCommand.js";
import { MoveCommand } from "../../src/application/commands/edit/MoveCommand.js";
import { ScaleCommand } from "../../src/application/commands/edit/ScaleCommand.js";
import { SetCommand } from "../../src/application/commands/edit/SetCommand.js";
import { UngroupCommand } from "../../src/application/commands/edit/UngroupCommand.js";
import { RedoCommand } from "../../src/application/commands/history/RedoCommand.js";
import { UndoCommand } from "../../src/application/commands/history/UndoCommand.js";
import { HelpCommand } from "../../src/application/commands/query/HelpCommand.js";
import { ShowCommand } from "../../src/application/commands/query/ShowCommand.js";
import { TreeCommand } from "../../src/application/commands/query/TreeCommand.js";
import { TreeFormatter } from "../../src/application/presentation/TreeFormatter.js";
import { Rect } from "../../src/domain/Rect.js";

test("session requires a document and init sets default dimensions and an IO barrier", async () => {
  const session = new EditorSession();
  await assert.rejects(session.execute(new CreateCommand("g", "g")), /no document. use 'init' or 'read' first/);
  await session.execute(new InitCommand());
  assert.equal(session.requireDocument().width, 800);
  assert.equal(session.requireDocument().height, 600);
  await assert.rejects(session.execute(new UndoCommand()), /undo not allowed after io command/);
  await assert.rejects(session.execute(new RedoCommand()), /undo not allowed after io command/);
});

test("factory creates all six types, preserves missing styles and rejects unknown types", () => {
  const factory = new ShapeFactory();
  for (const type of ["rect", "circle", "ellipse", "line", "text", "g"]) {
    const shape = factory.create(type, `${type}1`);
    assert.equal(shape.tagName, type);
    assert.deepEqual(shape.styles, {});
  }
  assert.throws(() => factory.create("box", "n1"), /unknown shape type: box \(is the plugin loaded\?\)/);
});

test("container edits are single undo units and redo restores exact post-edit values", async () => {
  const session = new EditorSession();
  await session.execute(new InitCommand());
  await session.execute(new CreateCommand("g", "g"));
  await session.execute(new CreateCommand("rect", "r", { x: 0.1, y: 2, width: 3, height: 4 }, "g"));
  await session.execute(new CreateCommand("text", "t", { x: 5, y: 6, text: "开始" }, "g"));
  const document = session.requireDocument();
  const before = new TreeFormatter().format(document);
  const count = session.history.undoCount;
  await session.execute(new ScaleCommand("g", 0.3));
  const after = new TreeFormatter().format(document);
  assert.equal(session.history.undoCount, count + 1);
  for (let iteration = 0; iteration < 5; iteration++) {
    await session.execute(new UndoCommand());
    assert.deepEqual(new TreeFormatter().format(document), before);
    assert.ok(document.find("r") instanceof Rect);
    await session.execute(new RedoCommand());
    assert.deepEqual(new TreeFormatter().format(document), after);
  }
  assert.equal(session.requireDocument(), document);
  document.assertInvariants();
});

test("an error after a partial draft mutation leaves live geometry and history unchanged", async () => {
  const session = new EditorSession();
  await session.execute(new InitCommand());
  await session.execute(new CreateCommand("g", "g"));
  await session.execute(new CreateCommand("rect", "first", { x: 1, width: 1, height: 1 }, "g"));
  await session.execute(new CreateCommand("rect", "overflow", { x: Number.MAX_VALUE, width: 1, height: 1 }, "g"));
  const before = new TreeFormatter().format(session.requireDocument());
  const count = session.history.undoCount;
  await assert.rejects(session.execute(new MoveCommand("g", Number.MAX_VALUE, 0)), /must be a finite number/);
  assert.deepEqual(new TreeFormatter().format(session.requireDocument()), before);
  assert.equal(session.history.undoCount, count);
  assert.equal(session.history.redoCount, 0);
  session.requireDocument().assertInvariants();
});

test("queries and failed edits preserve redo, while a successful new edit clears it", async () => {
  const session = new EditorSession();
  await session.execute(new InitCommand());
  await session.execute(new CreateCommand("rect", "r", { x: 10 }));
  await session.execute(new MoveCommand("r", 20, 0));
  await session.execute(new UndoCommand());
  await session.execute(new TreeCommand());
  await session.execute(new ShowCommand("r"));
  await session.execute(new HelpCommand());
  await session.execute(new CanvasCommand());
  assert.equal(session.history.redoCount, 1);
  await assert.rejects(session.execute(new CreateCommand("circle", "r")), /id already exists: r/);
  await assert.rejects(session.execute(new SetCommand("r", "r", "5")), /unknown attribute: r/);
  assert.equal(session.history.redoCount, 1);
  await session.execute(new SetCommand("r", "fill", "red"));
  assert.equal(session.history.redoCount, 0);
  await assert.rejects(session.execute(new RedoCommand()), /nothing to redo/);
});

test("group, ungroup and subtree deletion restore structure, IDs and original order", async () => {
  const session = new EditorSession();
  await session.execute(new InitCommand());
  await session.execute(new CreateCommand("g", "scene"));
  await session.execute(new CreateCommand("circle", "a", { r: 1 }, "scene"));
  await session.execute(new CreateCommand("rect", "b", { width: 10, height: 20 }, "scene"));
  const formatter = new TreeFormatter();
  const original = formatter.format(session.requireDocument());
  await session.execute(new GroupCommand("g", ["b", "a"]));
  const grouped = formatter.format(session.requireDocument());
  await session.execute(new UndoCommand());
  assert.deepEqual(formatter.format(session.requireDocument()), original);
  await session.execute(new RedoCommand());
  assert.deepEqual(formatter.format(session.requireDocument()), grouped);
  await session.execute(new UngroupCommand("g"));
  assert.deepEqual(formatter.format(session.requireDocument()), original);
  await session.execute(new UndoCommand());
  assert.deepEqual(formatter.format(session.requireDocument()), grouped);
  await session.execute(new DeleteCommand("g"));
  assert.equal(session.requireDocument().size, 1);
  await session.execute(new UndoCommand());
  assert.deepEqual(formatter.format(session.requireDocument()), grouped);
  session.requireDocument().assertInvariants();
});

test("reparenting and z-order are reversible without disturbing other siblings", async () => {
  const session = new EditorSession();
  await session.execute(new InitCommand());
  await session.execute(new CreateCommand("g", "g"));
  await session.execute(new CreateCommand("circle", "a"));
  await session.execute(new CreateCommand("circle", "b", {}, "g"));
  await session.execute(new AddToCommand("g", "a"));
  await session.execute(new FrontCommand("b"));
  assert.deepEqual(session.requireDocument().find("g").children.map(shape => shape.id), ["a", "b"]);
  await session.execute(new BackCommand("b"));
  assert.deepEqual(session.requireDocument().find("g").children.map(shape => shape.id), ["b", "a"]);
  await session.execute(new UndoCommand());
  await session.execute(new UndoCommand());
  await session.execute(new UndoCommand());
  assert.equal(session.requireDocument().find("a").parent, session.requireDocument());
  session.requireDocument().assertInvariants();
});

test("IO barriers survive queries and failures, and new edits start a fresh history", async () => {
  const session = new EditorSession();
  await session.execute(new InitCommand());
  await session.execute(new CreateCommand("g", "g"));
  await assert.rejects(session.execute(new CanvasCommand(900, -1)), /canvas height must be positive/);
  assert.equal(session.history.undoCount, 1);
  await session.execute(new CanvasCommand(900, 700));
  assert.equal(session.history.undoCount, 0);
  await session.execute(new TreeCommand());
  await assert.rejects(session.execute(new CreateCommand("box", "bad")), /unknown shape type/);
  assert.equal(session.history.ioBlocked, true);
  await assert.rejects(session.execute(new UndoCommand()), /undo not allowed after io command/);
  await session.execute(new MoveCommand("g", 1, 2));
  await session.execute(new UndoCommand());
  await assert.rejects(session.execute(new UndoCommand()), /nothing to undo/);
  assert.equal(session.requireDocument().width, 900);
});

test("query formatting uses visitor summaries and supports a subtree and parent details", async () => {
  const session = new EditorSession();
  await session.execute(new InitCommand());
  await session.execute(new CreateCommand("g", "g"));
  await session.execute(new CreateCommand("text", "t", { x: 10, y: 20, text: '中文 "label"' }, "g"));
  const tree = await session.execute(new TreeCommand("g"));
  assert.deepEqual(tree.messages.map(message => message.text), ["g#g", `└── text#t  (10,20) ${JSON.stringify('中文 "label"')}`]);
  const show = await session.execute(new ShowCommand("t"));
  assert.equal(show.messages[0]?.text, "text#t  parent=g#g");
  assert.ok(show.messages.some(message => message.text === `  text=${JSON.stringify('中文 "label"')}`));
});

test("command queue remains ordered and keeps working after a rejection", async () => {
  const session = new EditorSession();
  const outcomes = await Promise.allSettled([
    session.execute(new InitCommand()),
    session.execute(new CreateCommand("box", "bad")),
    session.execute(new CreateCommand("rect", "r", { x: 10 })),
    session.execute(new MoveCommand("r", 20, 0)),
  ]);
  assert.deepEqual(outcomes.map(outcome => outcome.status), ["fulfilled", "rejected", "fulfilled", "fulfilled"]);
  assert.equal(session.requireDocument().find("r").attributes["x"], "30");
});

test("a command object is single-use and cannot overwrite its existing undo snapshots", async () => {
  const session = new EditorSession();
  await session.execute(new InitCommand());
  const command = new CreateCommand("g", "g");
  await session.execute(command);
  await assert.rejects(session.execute(command), /command has already been executed/);
  assert.equal(session.history.undoCount, 1);
  await session.execute(new UndoCommand());
  assert.equal(session.requireDocument().size, 0);
});
