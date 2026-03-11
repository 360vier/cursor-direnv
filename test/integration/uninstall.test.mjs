import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { installCommand } from "../../src/commands/install.mjs";
import { uninstallCommand } from "../../src/commands/uninstall.mjs";

const quietStdout = { write() {} };
const direnvAvailable = () => true;

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

test("uninstall removes hook file and only its matching preToolUse entry", async () => {
  const projectDir = await mkdtemp(join(tmpdir(), "cursor-direnv-uninstall-"));
  try {
    await installCommand({
      cwd: projectDir,
      stdout: quietStdout,
      isDirenvAvailable: direnvAvailable,
    });
    const hooksJsonPath = join(projectDir, ".cursor", "hooks.json");

    const existing = await readJson(hooksJsonPath);
    existing.hooks.preToolUse.push({ matcher: "Shell", command: "echo keep" });
    await writeFile(hooksJsonPath, JSON.stringify(existing, null, 2), "utf8");

    await uninstallCommand({ cwd: projectDir, stdout: quietStdout });

    const updated = await readJson(hooksJsonPath);
    assert.deepEqual(updated.hooks.preToolUse, [{ matcher: "Shell", command: "echo keep" }]);

    const hookPath = join(projectDir, ".cursor", "hooks", "pretooluse-direnv.mjs");
    await assert.rejects(readFile(hookPath, "utf8"), { code: "ENOENT" });
  } finally {
    await rm(projectDir, { recursive: true, force: true });
  }
});
