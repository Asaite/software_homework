import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { test } from "node:test";
import { EditorSession } from "../../src/application/EditorSession.js";
import { CliApplication } from "../../src/cli/CliApplication.js";
import { CommandParser } from "../../src/cli/CommandParser.js";
import { ConsolePresenter } from "../../src/cli/ConsolePresenter.js";

test("REPL continues after syntax and domain errors and processes every piped line through EOF", async () => {
  const input = new PassThrough();
  const output = new PassThrough();
  const errors = new PassThrough();
  let stdout = "";
  let stderr = "";
  output.setEncoding("utf8").on("data", (chunk: string) => { stdout += chunk; });
  errors.setEncoding("utf8").on("data", (chunk: string) => { stderr += chunk; });
  const session = new EditorSession();
  const app = new CliApplication(session, new CommandParser(), new ConsolePresenter(output, errors), input, output, false);
  const running = app.run();
  input.end('tree\r\ninit\r\n# ignored\r\ncreate rect r 0 0 10 20 #fff\r\nset r fill "unfinished\r\nmove r 5 6\r\nshow r');
  await running;
  assert.match(stdout, /svg-editor 0\.1/);
  assert.match(stdout, /rect#r.*created/);
  assert.match(stdout, /x=5/);
  assert.match(stdout, /y=6/);
  assert.doesNotMatch(stdout, /svg> /);
  assert.deepEqual(stderr.trimEnd().split("\n"), [
    "error: no document. use 'init' or 'read' first",
    "error: unterminated double-quoted argument",
  ]);
  assert.equal(session.history.undoCount, 2);
});

test("terminal mode exposes svg> prompts and blank lines do not alter history", async () => {
  const input = new PassThrough();
  const output = new PassThrough();
  const errors = new PassThrough();
  let stdout = "";
  output.setEncoding("utf8").on("data", (chunk: string) => { stdout += chunk; });
  const session = new EditorSession();
  const running = new CliApplication(session, new CommandParser(), new ConsolePresenter(output, errors), input, output, true).run();
  input.end("init\n\n# comment\n");
  await running;
  assert.match(stdout, /svg> /);
  assert.equal(session.history.undoCount, 0);
  assert.equal(session.history.ioBlocked, true);
});

test("errors are emitted with one prefix on one physical line", () => {
  const output = new PassThrough();
  let stderr = "";
  output.setEncoding("utf8").on("data", (chunk: string) => { stderr += chunk; });
  new ConsolePresenter(new PassThrough(), output).presentError(new Error("invalid XML\r\nline 2\nline 3"));
  assert.equal(stderr, "error: invalid XML line 2 line 3\n");
});
