import assert from "node:assert/strict";
import { test } from "node:test";
import { CommandTokenizer } from "../../src/cli/CommandTokenizer.js";

test("only comment lines are ignored; hex colors and hash marks in content remain arguments", () => {
  const tokenizer = new CommandTokenizer();
  assert.deepEqual(tokenizer.tokenize("  # ignored create rect r"), []);
  assert.deepEqual(tokenizer.tokenize(" \t "), []);
  assert.deepEqual(tokenizer.tokenize("create rect r 0 0 10 20 #ffffff").map(token => token.value),
    ["create", "rect", "r", "0", "0", "10", "20", "#ffffff"]);
  assert.equal(tokenizer.tokenize('set t text "# label"')[3]?.value, "# label");
});

test("quoted tokens preserve spaces, empty strings and explicit quoting information", () => {
  const tokens = new CommandTokenizer().tokenize('create text t 1 2 "开始 in 结束" in "parent"');
  assert.equal(tokens[5]?.value, "开始 in 结束");
  assert.equal(tokens[5]?.quoted, true);
  assert.equal(tokens[6]?.quoted, false);
  assert.equal(new CommandTokenizer().tokenize('set t text ""')[3]?.value, "");
});

test("escaped quotes and backslashes are decoded, while unrelated backslashes stay literal", () => {
  const tokenizer = new CommandTokenizer();
  const content = 'A "quoted" label \\ 中文';
  assert.equal(tokenizer.tokenize(`set t text ${JSON.stringify(content)}`)[3]?.value, content);
  assert.equal(tokenizer.tokenize('read "C:\\new folder\\diagram.svg"')[1]?.value, "C:\\new folder\\diagram.svg");
});

test("unterminated or concatenated quoted arguments are rejected", () => {
  const tokenizer = new CommandTokenizer();
  assert.throws(() => tokenizer.tokenize('set t text "unfinished'), /unterminated/);
  assert.throws(() => tokenizer.tokenize('set t text "a"b'), /followed by whitespace/);
  assert.throws(() => tokenizer.tokenize('set t text a"b"'), /must start an argument/);
});
