import { dirname } from "node:path";
import { buildPreToolUseEntry, removePreToolUseHook } from "../lib/hooks-json.mjs";
import {
  fileExists,
  readJsonIfExists,
  safeRemove,
  writeJsonAtomic,
  ensureDir,
} from "../lib/io.mjs";
import {
  HOOK_RELATIVE_PATH,
  RULE_RELATIVE_PATH,
  resolveInstallContext,
} from "../lib/paths.mjs";

export const uninstallCommand = async ({
  global = false,
  cwd = process.cwd(),
  homeDir,
  stdout = process.stdout,
} = {}) => {
  const context = resolveInstallContext({ global, cwd, homeDir });
  const existingHooksJson = await readJsonIfExists(context.hooksJsonPath);
  const hadHookFile = await fileExists(context.hookScriptPath);
  const hadRuleFile = !context.global && (await fileExists(context.ruleFilePath));

  if (existingHooksJson !== null) {
    const updatedHooksJson = removePreToolUseHook(
      existingHooksJson,
      buildPreToolUseEntry(context.hookCommand),
    );
    await ensureDir(dirname(context.hooksJsonPath));
    await writeJsonAtomic(context.hooksJsonPath, updatedHooksJson);
  }

  await safeRemove(context.hookScriptPath);
  if (!context.global) {
    await safeRemove(context.ruleFilePath);
  }

  const installScope = context.global ? "global" : "local";
  const hookFileAction = hadHookFile ? "removed" : "already absent";
  const ruleSummary = context.global
    ? ""
    : `, ${(hadRuleFile ? "removed" : "already absent")} ${RULE_RELATIVE_PATH}`;
  stdout.write(
    `Uninstalled ${installScope} Cursor hook (${hookFileAction} ${HOOK_RELATIVE_PATH}${ruleSummary}).\n`,
  );

  return {
    ...context,
    hookFileAction,
    ruleFileAction: hadRuleFile ? "removed" : "already absent",
  };
};
