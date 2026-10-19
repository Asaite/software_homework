import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

export interface CliRunResult {
  readonly stdout: string;
  readonly stderr: string;
  readonly code: number | null;
}

export class CliHarness {
  static async run(script: string, cwd: string): Promise<CliRunResult> {
    const main = fileURLToPath(new URL("../../src/Main.ts", import.meta.url));
    const child = spawn(process.execPath, ["--import", import.meta.resolve("tsx"), main], {
      cwd, stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk: string) => { stdout += chunk; });
    child.stderr.setEncoding("utf8").on("data", (chunk: string) => { stderr += chunk; });
    const timeout = setTimeout(() => child.kill("SIGKILL"), 10000);
    try {
      const completed = new Promise<CliRunResult>((resolve, reject) => {
        child.once("error", reject);
        child.once("close", code => resolve({ stdout, stderr, code }));
      });
      child.stdin.end(script);
      return await completed;
    } finally {
      clearTimeout(timeout);
    }
  }
}
