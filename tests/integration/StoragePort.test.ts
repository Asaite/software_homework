import assert from "node:assert/strict";
import { test } from "node:test";
import { EditorSession } from "../../src/application/EditorSession.js";
import { ShapeFactory } from "../../src/application/ShapeFactory.js";
import { InitCommand } from "../../src/application/commands/document/InitCommand.js";
import { ReadCommand } from "../../src/application/commands/document/ReadCommand.js";
import { SaveCommand } from "../../src/application/commands/document/SaveCommand.js";
import { CreateCommand } from "../../src/application/commands/edit/CreateCommand.js";
import { MoveCommand } from "../../src/application/commands/edit/MoveCommand.js";
import { RedoCommand } from "../../src/application/commands/history/RedoCommand.js";
import { UndoCommand } from "../../src/application/commands/history/UndoCommand.js";
import { MemorySvgStore } from "../fixtures/MemorySvgStore.js";
import { DeferredSvgStore } from "../fixtures/DeferredSvgStore.js";

test("storage port supports save/read boundaries, warnings and path updates", async () => {
  const store = new MemorySvgStore();
  const session = new EditorSession(new ShapeFactory(), store);
  await session.execute(new InitCommand(400, 300));
  await session.execute(new CreateCommand("rect", "r", { x: 10, width: 20, height: 30 }));
  await session.execute(new SaveCommand("first.svg"));
  assert.equal(session.filePath, "first.svg");
  await assert.rejects(session.execute(new UndoCommand()), /undo not allowed after io command/);
  await assert.rejects(session.execute(new RedoCommand()), /undo not allowed after io command/);
  await session.execute(new MoveCommand("r", 50, 0));
  const result = await session.execute(new ReadCommand("first.svg"));
  assert.equal(session.requireDocument().find("r").attributes["x"], "10");
  assert.equal(result.messages[0]?.level, "warning");
  await session.execute(new SaveCommand());
  await session.execute(new InitCommand());
  assert.equal(session.filePath, undefined);
  await assert.rejects(session.execute(new SaveCommand()), /no file path/);
});

test("failed storage operations preserve the current document, path and redo stack", async () => {
  const store = new MemorySvgStore();
  const session = new EditorSession(new ShapeFactory(), store);
  await session.execute(new InitCommand());
  await session.execute(new CreateCommand("rect", "r", { x: 10 }));
  await session.execute(new SaveCommand("first.svg"));
  await session.execute(new MoveCommand("r", 20, 0));
  await session.execute(new UndoCommand());
  store.failWrites = true;
  await assert.rejects(session.execute(new SaveCommand("failed.svg")), /cannot write file: failed.svg/);
  await assert.rejects(session.execute(new ReadCommand("missing.svg")), /cannot read file: missing.svg/);
  assert.equal(session.filePath, "first.svg");
  assert.equal(session.history.redoCount, 1);
  assert.equal(session.history.ioBlocked, false);
  await session.execute(new RedoCommand());
  assert.equal(session.requireDocument().find("r").attributes["x"], "30");
});

test("an unconfigured storage adapter reports its boundary without altering state", async () => {
  const session = new EditorSession();
  await session.execute(new InitCommand());
  await session.execute(new CreateCommand("g", "g"));
  await assert.rejects(session.execute(new SaveCommand("demo.svg")), /SVG file storage is not configured/);
  await assert.rejects(session.execute(new ReadCommand("demo.svg")), /SVG file storage is not configured/);
  assert.equal(session.history.undoCount, 1);
  assert.equal(session.requireDocument().size, 1);
});

test("edits wait for an asynchronous save and start their history after its barrier", { timeout: 5000 }, async () => {
  const store = new DeferredSvgStore();
  const session = new EditorSession(new ShapeFactory(), store);
  await session.execute(new InitCommand());
  await session.execute(new CreateCommand("rect", "r", { x: 10 }));
  const save = session.execute(new SaveCommand("before.svg"));
  const edit = session.execute(new MoveCommand("r", 20, 0));
  await store.started;
  assert.equal(session.requireDocument().find("r").attributes["x"], "10");
  store.release();
  await save;
  await edit;
  assert.equal(session.requireDocument().find("r").attributes["x"], "30");
  assert.equal(session.history.undoCount, 1);
  assert.equal(session.history.ioBlocked, false);
  assert.equal((await store.read("before.svg")).document.find("r").attributes["x"], "10");
});
