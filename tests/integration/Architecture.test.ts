import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

test("production imports follow module rules and do not expose domain internals to outer layers", () => {
  const root = fileURLToPath(new URL("../../src", import.meta.url));
  const allowed: Readonly<Record<string, readonly string[]>> = {
    domain: ["domain"],
    application: ["domain", "application"],
    cli: ["application", "cli"],
    infrastructure: ["domain", "application", "infrastructure"],
  };
  const pending = [root];
  while (pending.length > 0) {
    const directory = pending.pop();
    if (!directory) break;
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) { pending.push(path); continue; }
      if (!entry.name.endsWith(".ts")) continue;
      const source = readFileSync(path, "utf8");
      const module = relative(root, path).split("/")[0] ?? "";
      const imports = source.matchAll(/^import\s+(?:type\s+)?(?:[^;]*?\s+from\s+)?["']([^"']+)["']/gm);
      for (const declaration of imports) {
        const specifier = declaration[1];
        assert.ok(specifier);
        if (module === "Main.ts") continue;
        assert.ok(specifier.startsWith("."), `${path} imports an external dependency: ${specifier}`);
        const target = relative(root, resolve(directory, specifier));
        const targetModule = target.split("/")[0] ?? "";
        assert.ok(allowed[module]?.includes(targetModule), `${path} -> ${specifier}`);
        if (module !== "domain") assert.ok(!target.startsWith("domain/internal/"), `${path} bypasses domain encapsulation`);
      }
      const classes = [...source.matchAll(/^export\s+(?:abstract\s+)?class\s+(\w+)/gm)];
      assert.ok(classes.length <= 1, `${path} contains multiple classes`);
      if (classes[0]) assert.equal(classes[0][1], basename(path, ".ts"));
    }
  }
});
