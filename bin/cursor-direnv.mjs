#!/usr/bin/env node

import { createRequire } from "node:module";
import { installCommand } from "../src/commands/install.mjs";
import { uninstallCommand } from "../src/commands/uninstall.mjs";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

const HELP_TEXT = `cursor-direnv

Usage:
  cursor-direnv install [-g|--global]
  cursor-direnv uninstall [-g|--global]
  cursor-direnv --help
  cursor-direnv --version
`;

const parseArgs = (argv) => {
  const [command, ...rest] = argv;
  if (!command || command === "--help" || command === "-h") {
    return { command: "help", global: false };
  }

  if (command === "--version" || command === "-v") {
    return { command: "version", global: false };
  }

  if (command !== "install" && command !== "uninstall") {
    throw new Error(`Unknown command "${command}".`);
  }

  let global = false;
  for (const arg of rest) {
    if (arg === "-g" || arg === "--global") {
      global = true;
      continue;
    }
    throw new Error(`Unknown option "${arg}".`);
  }

  return { command, global };
};

const main = async () => {
  const parsed = parseArgs(process.argv.slice(2));

  if (parsed.command === "help") {
    process.stdout.write(`${HELP_TEXT}\n`);
    return;
  }

  if (parsed.command === "version") {
    process.stdout.write(`${version}\n`);
    return;
  }

  if (parsed.command === "install") {
    await installCommand({ global: parsed.global });
    return;
  }

  await uninstallCommand({ global: parsed.global });
};

main().catch((error) => {
  process.stderr.write(`cursor-direnv: ${error.message}\n`);
  process.exitCode = 1;
});
