import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPreToolUseEntry,
  mergePreToolUseHook,
  removePreToolUseHook,
} from "../../src/lib/hooks-json.mjs";

test("mergePreToolUseHook creates schema and version for missing config", () => {
  const entry = buildPreToolUseEntry("node .cursor/hooks/pretooluse-direnv.mjs");
  const merged = mergePreToolUseHook(null, entry);

  assert.equal(merged.version, 1);
  assert.deepEqual(merged.hooks.preToolUse, [entry]);
});

test("mergePreToolUseHook preserves unrelated hooks and keys", () => {
  const entry = buildPreToolUseEntry("node .cursor/hooks/pretooluse-direnv.mjs");
  const existing = {
    version: 1,
    customSetting: true,
    hooks: {
      postToolUse: [{ matcher: "ReadFile", command: "echo post" }],
      preToolUse: [{ matcher: "Shell", command: "echo one" }],
    },
  };

  const merged = mergePreToolUseHook(existing, entry);

  assert.equal(merged.customSetting, true);
  assert.deepEqual(merged.hooks.postToolUse, existing.hooks.postToolUse);
  assert.equal(merged.hooks.preToolUse.length, 2);
  assert.deepEqual(merged.hooks.preToolUse[1], entry);
});

test("mergePreToolUseHook does not duplicate an existing entry", () => {
  const entry = buildPreToolUseEntry("node .cursor/hooks/pretooluse-direnv.mjs");
  const existing = {
    version: 1,
    hooks: {
      preToolUse: [entry],
    },
  };

  const merged = mergePreToolUseHook(existing, entry);
  assert.equal(merged.hooks.preToolUse.length, 1);
});

test("removePreToolUseHook removes only matching command+matcher", () => {
  const target = buildPreToolUseEntry("node .cursor/hooks/pretooluse-direnv.mjs");
  const existing = {
    version: 1,
    hooks: {
      preToolUse: [
        target,
        { matcher: "Shell", command: "echo keep" },
        { matcher: "ReadFile", command: target.command },
      ],
    },
  };

  const updated = removePreToolUseHook(existing, target);
  assert.deepEqual(updated.hooks.preToolUse, [
    { matcher: "Shell", command: "echo keep" },
    { matcher: "ReadFile", command: target.command },
  ]);
});

test("mergePreToolUseHook handles malformed hooks.json variants", () => {
  const entry = buildPreToolUseEntry("node .cursor/hooks/pretooluse-direnv.mjs");
  const existing = {
    version: "1",
    hooks: {
      preToolUse: { matcher: "Shell", command: "not-an-array" },
    },
  };

  const merged = mergePreToolUseHook(existing, entry);
  assert.equal(merged.version, 1);
  assert.deepEqual(merged.hooks.preToolUse, [entry]);
});
