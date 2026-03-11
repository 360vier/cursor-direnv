import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { rewritePayload } from "../../src/hooks/pretooluse-direnv.mjs";

const makePayload = (command = "npm test") => ({
  tool_name: "Shell",
  tool_input: { command },
});

test("rewritePayload ignores non-Shell tools", () => {
  const result = rewritePayload({ tool_name: "ReadFile", tool_input: { command: "x" } });
  assert.deepEqual(result, {});
});

test("rewritePayload ignores when already in direnv context", async () => {
  const projectDir = await mkdtemp(join(tmpdir(), "cursor-direnv-hook-"));
  try {
    await writeFile(join(projectDir, ".envrc"), "use nix\n", "utf8");
    const result = rewritePayload(makePayload("echo hi"), {
      env: { DIRENV_DIR: "/tmp/direnv", CURSOR_PROJECT_DIR: projectDir },
      cwd: projectDir,
    });
    assert.deepEqual(result, {});
  } finally {
    await rm(projectDir, { recursive: true, force: true });
  }
});

test("rewritePayload ignores when .envrc is missing", async () => {
  const projectDir = await mkdtemp(join(tmpdir(), "cursor-direnv-hook-"));
  try {
    const result = rewritePayload(makePayload("echo hi"), {
      env: { CURSOR_PROJECT_DIR: projectDir },
      cwd: projectDir,
    });
    assert.deepEqual(result, {});
  } finally {
    await rm(projectDir, { recursive: true, force: true });
  }
});

test("rewritePayload ignores command already starting with direnv exec", async () => {
  const projectDir = await mkdtemp(join(tmpdir(), "cursor-direnv-hook-"));
  try {
    await writeFile(join(projectDir, ".envrc"), "use nix\n", "utf8");
    const result = rewritePayload(makePayload("  direnv exec . zsh -lc 'npm test'"), {
      env: { CURSOR_PROJECT_DIR: projectDir },
      cwd: projectDir,
    });
    assert.deepEqual(result, {});
  } finally {
    await rm(projectDir, { recursive: true, force: true });
  }
});

test("rewritePayload rewrites shell command when .envrc exists", async () => {
  const projectDir = await mkdtemp(join(tmpdir(), "cursor-direnv-hook-"));
  try {
    await writeFile(join(projectDir, ".envrc"), "use nix\n", "utf8");
    const result = rewritePayload(makePayload("npm run build"), {
      env: { CURSOR_PROJECT_DIR: projectDir },
      cwd: projectDir,
    });
    assert.equal(result.permission, "allow");
    assert.equal(
      result.updated_input.command,
      'direnv exec . zsh -lc "npm run build"',
    );
  } finally {
    await rm(projectDir, { recursive: true, force: true });
  }
});
