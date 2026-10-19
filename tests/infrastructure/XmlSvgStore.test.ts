import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { EditorSession } from "../../src/application/EditorSession.js";
import { ShapeFactory } from "../../src/application/ShapeFactory.js";
import { CanvasCommand } from "../../src/application/commands/document/CanvasCommand.js";
import { InitCommand } from "../../src/application/commands/document/InitCommand.js";
import { ReadCommand } from "../../src/application/commands/document/ReadCommand.js";
import { SaveCommand } from "../../src/application/commands/document/SaveCommand.js";
import { CreateCommand } from "../../src/application/commands/edit/CreateCommand.js";
import { MoveCommand } from "../../src/application/commands/edit/MoveCommand.js";
import { RedoCommand } from "../../src/application/commands/history/RedoCommand.js";
import { UndoCommand } from "../../src/application/commands/history/UndoCommand.js";
import { CommandParser } from "../../src/cli/CommandParser.js";
import { Rect } from "../../src/domain/Rect.js";
import { SvgDocument } from "../../src/domain/SvgDocument.js";
import { XmlSvgStore } from "../../src/infrastructure/svg/XmlSvgStore.js";

test("real file save/read preserves canvas and supports saving back to the current path", async t => {
  const directory = await mkdtemp(join(tmpdir(), "svg-store-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const path = join(directory, "diagram 中文.svg");
  const factory = new ShapeFactory();
  const session = new EditorSession(factory, new XmlSvgStore(factory));
  await session.execute(new InitCommand(400, 300));
  await session.execute(new CreateCommand("rect", "r", { x: 10, width: 20, height: 30 }));
  await session.execute(new SaveCommand(path));
  await session.execute(new MoveCommand("r", 50, 0));
  await session.execute(new ReadCommand(path));
  assert.equal(session.requireDocument().find("r").attributes["x"], "10");
  await session.execute(new MoveCommand("r", 5, 0));
  await session.execute(new SaveCommand());
  assert.equal((await new XmlSvgStore().read(path)).document.find("r").attributes["x"], "15");
  assert.deepEqual(await readdir(directory), ["diagram 中文.svg"]);
  await assert.rejects(session.execute(new UndoCommand()), /undo not allowed after io command/);
});

test("failed file reads and writes preserve document, redo and the last path", async t => {
  const directory = await mkdtemp(join(tmpdir(), "svg-store-failure-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const factory = new ShapeFactory();
  const session = new EditorSession(factory, new XmlSvgStore(factory));
  const saved = join(directory, "valid.svg");
  const invalid = join(directory, "invalid.svg");
  const invalidEncoding = join(directory, "invalid-encoding.svg");
  await writeFile(invalid, '<svg><rect id="r"/><circle id="r"/></svg>');
  await writeFile(invalidEncoding, Buffer.from([0xff, 0xfe, 0x3c]));
  await session.execute(new InitCommand());
  await session.execute(new CreateCommand("rect", "r", { x: 10 }));
  await session.execute(new SaveCommand(saved));
  await session.execute(new MoveCommand("r", 20, 0));
  await session.execute(new UndoCommand());
  await assert.rejects(session.execute(new ReadCommand(join(directory, "missing.svg"))), /cannot read file:/);
  await assert.rejects(session.execute(new ReadCommand(invalid)), /id already exists: r/);
  await assert.rejects(session.execute(new ReadCommand(invalidEncoding)), /cannot read file:/);
  await assert.rejects(session.execute(new SaveCommand(directory)), /cannot write file:/);
  await assert.rejects(session.execute(new SaveCommand(join(directory, "missing", "out.svg"))), /cannot write file:/);
  assert.equal(session.filePath, saved);
  assert.equal(session.history.redoCount, 1);
  assert.equal(session.requireDocument().find("r").attributes["x"], "10");
  await session.execute(new RedoCommand());
  assert.equal(session.requireDocument().find("r").attributes["x"], "30");
  assert.match(await readFile(saved, "utf8"), /x="10"/);
});

test("serialization failures leave an existing destination untouched", async t => {
  const directory = await mkdtemp(join(tmpdir(), "svg-serialize-failure-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const path = join(directory, "keep.svg");
  await writeFile(path, "original bytes");
  const document = new SvgDocument();
  document.insert(new Rect("r", 0, 0, 1, 1));
  document.insert(new ShapeFactory().create("text", "bad", { text: "invalid\u0001character" }));
  await assert.rejects(new XmlSvgStore().write(path, document));
  assert.equal(await readFile(path, "utf8"), "original bytes");
  assert.deepEqual(await readdir(directory), ["keep.svg"]);
});

test("each document mutation blocks both history directions until the next successful edit", async t => {
  const directory = await mkdtemp(join(tmpdir(), "svg-io-barriers-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const path = join(directory, "source.svg");
  await writeFile(path, '<svg width="400" height="300"><rect id="r" x="10" y="20" width="30" height="40"/></svg>');
  const parser = new CommandParser();
  const operations = [
    new InitCommand(400, 300), new ReadCommand(path), new SaveCommand(path), new CanvasCommand(400, 300),
  ];
  for (const operation of operations) {
    const session = new EditorSession(new ShapeFactory(), new XmlSvgStore());
    for (const line of ["init 400 300", "create rect r 10 20 30 40", "move r 5 6", "undo"]) {
      await session.execute(parser.parse(line)!);
    }
    assert.equal(session.history.redoCount, 1);
    await session.execute(operation);
    await session.execute(parser.parse("canvas")!);
    await session.execute(parser.parse("tree")!);
    await session.execute(parser.parse("help")!);
    await assert.rejects(session.execute(parser.parse("delete missing")!), /no such shape: missing/);
    for (const command of [new UndoCommand(), new RedoCommand()]) {
      await assert.rejects(session.execute(command), { message: "undo not allowed after io command" });
    }
    assert.equal(session.history.undoCount, 0);
    assert.equal(session.history.redoCount, 0);
    await session.execute(parser.parse("create g next")!);
    await session.execute(new UndoCommand());
    assert.equal(session.requireDocument().has("next"), false);
    await assert.rejects(session.execute(new UndoCommand()), { message: "nothing to undo" });
    await session.execute(new RedoCommand());
    assert.equal(session.requireDocument().has("next"), true);
    assert.equal(session.requireDocument().width, 400);
    assert.equal(session.requireDocument().height, 300);
  }
});
