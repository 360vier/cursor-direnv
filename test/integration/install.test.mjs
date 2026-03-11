import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { installCommand } from "../../src/commands/install.mjs";
import { USER_RULE_CONTENT } from "../../src/lib/rules.mjs";

const quietStdout = { write() {} };
const direnvAvailable = () => true;
const createBufferedStdout = () => {
  const chunks = [];
  return {
    stream: {
      write(chunk) {
        chunks.push(String(chunk));
      },
    },
    getText() {
      return chunks.join("");
    },
  };
};

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

test("install creates local hook script and hooks.json entry", async () => {
  const projectDir = await mkdtemp(join(tmpdir(), "cursor-direnv-install-local-"));
  try {
    await installCommand({
      cwd: projectDir,
      stdout: quietStdout,
      isDirenvAvailable: direnvAvailable,
    });

    const hookPath = join(projectDir, ".cursor", "hooks", "pretooluse-direnv.mjs");
    const hooksJsonPath = join(projectDir, ".cursor", "hooks.json");
    const rulePath = join(projectDir, ".cursor", "rules", "direnv-hook.mdc");

    const hookScript = await readFile(hookPath, "utf8");
    assert.match(hookScript, /rewritePayload/);
    const ruleContent = await readFile(rulePath, "utf8");
    assert.match(ruleContent, /cursor-direnv hook behavior/);
    assert.match(ruleContent, /Shell tool calls/);

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

    await installCommand({
      cwd: projectDir,
      stdout: quietStdout,
      isDirenvAvailable: direnvAvailable,
    });
    await installCommand({
      cwd: projectDir,
      stdout: quietStdout,
      isDirenvAvailable: direnvAvailable,
    });

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
  const bufferedStdout = createBufferedStdout();
  try {
    await installCommand({
      global: true,
      cwd: projectDir,
      homeDir: fakeHome,
      stdout: bufferedStdout.stream,
      isDirenvAvailable: direnvAvailable,
    });

    const hookPath = join(fakeHome, ".cursor", "hooks", "pretooluse-direnv.mjs");
    const hooksJsonPath = join(fakeHome, ".cursor", "hooks.json");
    const globalRulePath = join(fakeHome, ".cursor", "rules", "direnv-hook.mdc");
    const hooksJson = await readJson(hooksJsonPath);

    await readFile(hookPath, "utf8");
    await assert.rejects(readFile(globalRulePath, "utf8"), { code: "ENOENT" });
    assert.deepEqual(hooksJson.hooks.preToolUse, [
      {
        matcher: "Shell",
        command: "node hooks/pretooluse-direnv.mjs",
      },
    ]);
    const output = bufferedStdout.getText();
    assert.match(output, /Global rules are managed via Cursor User Rules/);
    assert.match(output, new RegExp(USER_RULE_CONTENT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  } finally {
    await rm(projectDir, { recursive: true, force: true });
    await rm(fakeHome, { recursive: true, force: true });
  }
});

test("install keeps an existing local rules file unchanged", async () => {
  const projectDir = await mkdtemp(join(tmpdir(), "cursor-direnv-install-rules-"));
  const existingRuleContent = `---
description: custom rule
alwaysApply: true
---

Keep this content untouched.
`;
  try {
    const rulePath = join(projectDir, ".cursor", "rules", "direnv-hook.mdc");
    await mkdir(join(projectDir, ".cursor", "rules"), { recursive: true });
    await writeFile(rulePath, existingRuleContent, "utf8");

    await installCommand({
      cwd: projectDir,
      stdout: quietStdout,
      isDirenvAvailable: direnvAvailable,
    });

    const afterInstall = await readFile(rulePath, "utf8");
    assert.equal(afterInstall, existingRuleContent);
  } finally {
    await rm(projectDir, { recursive: true, force: true });
  }
});

test("install fails with a clear error when direnv is unavailable", async () => {
  const projectDir = await mkdtemp(join(tmpdir(), "cursor-direnv-install-no-direnv-"));
  try {
    await assert.rejects(
      installCommand({
        cwd: projectDir,
        stdout: quietStdout,
        isDirenvAvailable: () => false,
      }),
      /direnv is not available in PATH/,
    );
  } finally {
    await rm(projectDir, { recursive: true, force: true });
  }
});
