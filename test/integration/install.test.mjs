import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { installCommand } from "../../src/commands/install.mjs";

const quietStdout = { write() {} };

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

test("install creates local hook script and hooks.json entry", async () => {
  const projectDir = await mkdtemp(join(tmpdir(), "cursor-direnv-install-local-"));
  try {
    await installCommand({ cwd: projectDir, stdout: quietStdout });

    const hookPath = join(projectDir, ".cursor", "hooks", "pretooluse-direnv.mjs");
    const hooksJsonPath = join(projectDir, ".cursor", "hooks.json");

    const hookScript = await readFile(hookPath, "utf8");
    assert.match(hookScript, /rewritePayload/);

    const hooksJson = await readJson(hooksJsonPath);
    assert.equal(hooksJson.version, 1);
    assert.deepEqual(hooksJson.hooks.preToolUse, [
      {
        matcher: "Shell",
        command: "node .cursor/hooks/pretooluse-direnv.mjs",
      },
    ]);
  } finally {
    await rm(projectDir, { recursive: true, force: true });
  }
});

test("install merges existing hooks.json without duplicates", async () => {
  const projectDir = await mkdtemp(join(tmpdir(), "cursor-direnv-install-merge-"));
  try {
    const hooksJsonPath = join(projectDir, ".cursor", "hooks.json");
    await mkdir(join(projectDir, ".cursor"), { recursive: true });
    await writeFile(
      hooksJsonPath,
      JSON.stringify(
        {
          version: 1,
          hooks: {
            postToolUse: [{ matcher: "ReadFile", command: "echo post" }],
            preToolUse: [{ matcher: "Shell", command: "echo keep" }],
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    await installCommand({ cwd: projectDir, stdout: quietStdout });
    await installCommand({ cwd: projectDir, stdout: quietStdout });

    const hooksJson = await readJson(hooksJsonPath);
    assert.deepEqual(hooksJson.hooks.postToolUse, [
      { matcher: "ReadFile", command: "echo post" },
    ]);

    const matching = hooksJson.hooks.preToolUse.filter(
      (entry) => entry.command === "node .cursor/hooks/pretooluse-direnv.mjs",
    );
    assert.equal(matching.length, 1);
    assert.equal(hooksJson.hooks.preToolUse.some((entry) => entry.command === "echo keep"), true);
  } finally {
    await rm(projectDir, { recursive: true, force: true });
  }
});

test("install -g writes into test-controlled HOME", async () => {
  const projectDir = await mkdtemp(join(tmpdir(), "cursor-direnv-install-project-"));
  const fakeHome = await mkdtemp(join(tmpdir(), "cursor-direnv-install-home-"));
  try {
    await installCommand({
      global: true,
      cwd: projectDir,
      homeDir: fakeHome,
      stdout: quietStdout,
    });

    const hookPath = join(fakeHome, ".cursor", "hooks", "pretooluse-direnv.mjs");
    const hooksJsonPath = join(fakeHome, ".cursor", "hooks.json");
    const hooksJson = await readJson(hooksJsonPath);

    await readFile(hookPath, "utf8");
    assert.deepEqual(hooksJson.hooks.preToolUse, [
      {
        matcher: "Shell",
        command: "node hooks/pretooluse-direnv.mjs",
      },
    ]);
  } finally {
    await rm(projectDir, { recursive: true, force: true });
    await rm(fakeHome, { recursive: true, force: true });
  }
});
