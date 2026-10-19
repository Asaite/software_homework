import assert from "node:assert/strict";
import { copyFile, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { Text } from "../../src/domain/Text.js";
import { XmlSvgStore } from "../../src/infrastructure/svg/XmlSvgStore.js";
import { CliHarness } from "../fixtures/CliHarness.js";

test("the assignment transcript runs through a real CLI process and saves the restored document", async t => {
  const directory = await mkdtemp(join(tmpdir(), "svg-cli-transcript-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await copyFile(new URL("../fixtures/other.svg", import.meta.url), join(directory, "other.svg"));
  const script = await readFile(new URL("../fixtures/typical-session.txt", import.meta.url), "utf8");
  const result = await CliHarness.run(script, directory);
  assert.equal(result.code, 0);
  assert.deepEqual(result.stderr.trimEnd().split("\n"), [
    "error: cannot group a container into its own descendant: markers",
    "error: undo not allowed after io command",
  ]);
  assert.match(result.stdout, /warning: assigned id rect1 to unnamed <rect>/);
  assert.match(result.stdout, /read other\.svg \(7 elements\)/);
  assert.match(result.stdout, /ellipse#e1.*rx=3 ry=4/);
  const saved = (await new XmlSvgStore().read(join(directory, "demo.svg"))).document;
  assert.equal(saved.size, 5);
  assert.equal(saved.find("c1").attributes["cx"], "130");
  assert.equal(saved.find("box").parent?.containerId, "markers");
  assert.equal((saved.find("title") as Text).content, "My Diagram");
});

test("the two-node flowchart replays, undoes a group move and saves browser-ready XML", async t => {
  const directory = await mkdtemp(join(tmpdir(), "svg-cli-flowchart-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const script = await readFile(new URL("../../examples/flowchart.txt", import.meta.url), "utf8");
  const result = await CliHarness.run(script, directory);
  assert.equal(result.code, 0);
  assert.equal(result.stderr, "");
  const saved = (await new XmlSvgStore().read(join(directory, "flowchart.svg"))).document;
  assert.equal(saved.size, 8);
  assert.equal(saved.find("process").attributes["y"], "100");
  assert.equal((saved.find("process-label") as Text).content, "处理数据 v2");
  assert.equal(saved.find("arrow1").parent?.containerId, "flowchart");
});

test("CLI errors match required prefixes and do not poison later commands", async t => {
  const directory = await mkdtemp(join(tmpdir(), "svg-cli-errors-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const script = [
    "move r 1 1", "init", "create g scene", "create rect r 0 0 10 20 in scene",
    "create circle r 0 0 1", "delete missing", "create g bad in missing", "create g bad in r",
    "create box n 0 0 1 1", "ungroup scene", "scale r 0", "set r unsupported 1",
    "read missing.svg", "save missing/out.svg", "move r 5 6", "undo", "tree", "redo", "show r", "help",
  ].join("\n");
  const result = await CliHarness.run(script, directory);
  assert.equal(result.code, 0);
  assert.deepEqual(result.stderr.trimEnd().split("\n"), [
    "error: no document. use 'init' or 'read' first",
    "error: id already exists: r",
    "error: no such shape: missing",
    "error: no such container: missing",
    "error: not a container: r",
    "error: unknown shape type: box (is the plugin loaded?)",
    "error: cannot ungroup top-level container: scene",
    "error: scale factor must be positive",
    "error: unknown attribute: unsupported",
    "error: cannot read file: missing.svg",
    "error: cannot write file: missing/out.svg",
  ]);
  assert.match(result.stdout, /  x=5/);
  assert.match(result.stdout, /  y=6/);
  assert.match(result.stdout, /create ellipse <id>/);
});

test("piped commands wait for save/read, preserve quoted file names and consume the final line at EOF", async t => {
  const directory = await mkdtemp(join(tmpdir(), "svg-cli-pipe-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const result = await CliHarness.run([
    "init", 'create text t 1 2 "in"', 'save "图 with spaces.svg"', "set t text \"changed\"",
    'read "图 with spaces.svg"', "show t",
  ].join("\n"), directory);
  assert.equal(result.code, 0);
  assert.equal(result.stderr, "");
  assert.match(result.stdout, /  text="in"/);
  assert.doesNotMatch(result.stdout, /svg> /);
});
