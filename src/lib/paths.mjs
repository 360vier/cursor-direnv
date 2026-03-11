import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { RULE_FILE_NAME } from "./rules.mjs";

export const HOOK_RELATIVE_PATH = join("hooks", "pretooluse-direnv.mjs");
export const RULE_RELATIVE_PATH = join("rules", RULE_FILE_NAME);

export const resolveInstallContext = ({
  global = false,
  cwd = process.cwd(),
  homeDir = homedir(),
} = {}) => {
  const cursorRoot = global ? join(homeDir, ".cursor") : join(cwd, ".cursor");
  const hooksJsonPath = join(cursorRoot, "hooks.json");
  const hookScriptPath = join(cursorRoot, HOOK_RELATIVE_PATH);
  const ruleFilePath = join(cursorRoot, RULE_RELATIVE_PATH);
  const hookCommand = global
    ? "node hooks/pretooluse-direnv.mjs"
    : "node .cursor/hooks/pretooluse-direnv.mjs";

  return {
    global,
    cursorRoot,
    hooksJsonPath,
    hookScriptPath,
    ruleFilePath,
    hookCommand,
  };
};

export const resolvePackagedHookSourcePath = (importMetaUrl) => {
  const currentFilePath = fileURLToPath(importMetaUrl);
  const srcRoot = dirname(dirname(currentFilePath));
  return join(srcRoot, "hooks", "pretooluse-direnv.mjs");
};
