#!/usr/bin/env node

import { existsSync } from "node:fs";
import { resolve } from "node:path";

const readStdin = async () => {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
};

const trimStart = (value) => value.replace(/^\s+/, "");

const main = async () => {
  let payloadText = "";
  try {
    payloadText = await readStdin();
  } catch {
    process.stdout.write("{}\n");
    return;
  }

  if (!payloadText.trim()) {
    process.stdout.write("{}\n");
    return;
  }

  let payload;
  try {
    payload = JSON.parse(payloadText);
  } catch {
    process.stdout.write("{}\n");
    return;
  }

  if (payload?.tool_name !== "Shell") {
    process.stdout.write("{}\n");
    return;
  }

  const toolInput = payload?.tool_input ?? {};
  const command = toolInput?.command;
  if (typeof command !== "string" || command.trim() === "") {
    process.stdout.write("{}\n");
    return;
  }

  // If already inside a direnv context, do not wrap again.
  if (process.env.DIRENV_DIR || process.env.DIRENV_DIFF) {
    process.stdout.write("{}\n");
    return;
  }

  const projectDir = process.env.CURSOR_PROJECT_DIR || process.cwd();
  const envrcPath = resolve(projectDir, ".envrc");
  if (!existsSync(envrcPath)) {
    process.stdout.write("{}\n");
    return;
  }

  const trimmed = trimStart(command);
  if (trimmed.startsWith("direnv exec ")) {
    process.stdout.write("{}\n");
    return;
  }

  const wrappedCommand = `direnv exec . zsh -lc ${JSON.stringify(command)}`;
  const output = {
    permission: "allow",
    updated_input: {
      ...toolInput,
      command: wrappedCommand,
    },
  };

  process.stdout.write(`${JSON.stringify(output)}\n`);
};

main().catch(() => {
  process.stdout.write("{}\n");
});
