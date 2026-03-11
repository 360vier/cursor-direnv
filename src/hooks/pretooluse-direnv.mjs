#!/usr/bin/env node

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isDirenvAvailable as defaultIsDirenvAvailable } from "../lib/direnv.mjs";

const NO_UPDATE = {};

const readStdin = async () => {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
};

const trimStart = (value) => value.replace(/^\s+/, "");

export const rewritePayload = (
  payload,
  {
    env = process.env,
    cwd = process.cwd(),
    isDirenvAvailable = defaultIsDirenvAvailable,
  } = {},
) => {
  if (payload?.tool_name !== "Shell") {
    return NO_UPDATE;
  }

  const toolInput = payload?.tool_input ?? {};
  const command = toolInput?.command;
  if (typeof command !== "string" || command.trim() === "") {
    return NO_UPDATE;
  }

  if (!isDirenvAvailable()) {
    return NO_UPDATE;
  }

  // If already inside a direnv context, do not wrap again.
  if (env.DIRENV_DIR || env.DIRENV_DIFF) {
    return NO_UPDATE;
  }

  const projectDir = env.CURSOR_PROJECT_DIR || cwd;
  const envrcPath = resolve(projectDir, ".envrc");
  if (!existsSync(envrcPath)) {
    return NO_UPDATE;
  }

  const trimmed = trimStart(command);
  if (trimmed.startsWith("direnv exec ")) {
    return NO_UPDATE;
  }

  const wrappedCommand = `direnv exec . zsh -lc ${JSON.stringify(command)}`;
  return {
    permission: "allow",
    updated_input: {
      ...toolInput,
      command: wrappedCommand,
    },
  };
};

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

  process.stdout.write(`${JSON.stringify(rewritePayload(payload))}\n`);
};

const isDirectExecution = () => {
  if (!process.argv[1]) {
    return false;
  }
  return resolve(process.argv[1]) === fileURLToPath(import.meta.url);
};

if (isDirectExecution()) {
  main().catch(() => {
    process.stdout.write("{}\n");
  });
}
