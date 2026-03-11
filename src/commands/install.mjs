import { dirname } from "node:path";
import { isDirenvAvailable as defaultIsDirenvAvailable } from "../lib/direnv.mjs";
import { buildPreToolUseEntry, mergePreToolUseHook } from "../lib/hooks-json.mjs";
import {
  copyFileAtomic,
  fileExists,
  readJsonIfExists,
  writeJsonAtomic,
  writeTextAtomic,
  ensureDir,
} from "../lib/io.mjs";
import {
  HOOK_RELATIVE_PATH,
  RULE_RELATIVE_PATH,
  resolveInstallContext,
  resolvePackagedHookSourcePath,
} from "../lib/paths.mjs";
import { PROJECT_RULE_CONTENT, USER_RULE_CONTENT } from "../lib/rules.mjs";

export const installCommand = async ({
  global = false,
  cwd = process.cwd(),
  homeDir,
  stdout = process.stdout,
  isDirenvAvailable = defaultIsDirenvAvailable,
} = {}) => {
  if (!(await isDirenvAvailable())) {
    throw new Error(
      "direnv is not available in PATH. Install direnv first, then run cursor-direnv install again.",
    );
  }

  const context = resolveInstallContext({ global, cwd, homeDir });
  const sourceHookPath = resolvePackagedHookSourcePath(import.meta.url);
  const targetHooksDir = dirname(context.hookScriptPath);

  await ensureDir(targetHooksDir);
  const hookScriptExisted = await fileExists(context.hookScriptPath);
  await copyFileAtomic(sourceHookPath, context.hookScriptPath);

  const existingHooksJson = await readJsonIfExists(context.hooksJsonPath);
  const mergedHooksJson = mergePreToolUseHook(
    existingHooksJson,
    buildPreToolUseEntry(context.hookCommand),
  );
  const beforePreToolUse = Array.isArray(existingHooksJson?.hooks?.preToolUse)
    ? existingHooksJson.hooks.preToolUse.length
    : 0;
  const afterPreToolUse = mergedHooksJson.hooks.preToolUse.length;

  await writeJsonAtomic(context.hooksJsonPath, mergedHooksJson);

  let ruleFileAction = "not-applicable";
  if (!context.global) {
    const ruleExists = await fileExists(context.ruleFilePath);
    if (!ruleExists) {
      await writeTextAtomic(context.ruleFilePath, PROJECT_RULE_CONTENT);
      ruleFileAction = "created";
    } else {
      ruleFileAction = "kept";
    }
  }

  const installScope = context.global ? "global" : "local";
  const hookEntryAction = afterPreToolUse === beforePreToolUse ? "kept" : "added";
  const hookFileAction = hookScriptExisted ? "updated" : "created";
  const ruleSummary = context.global
    ? "user-rules manual step shown"
    : `${ruleFileAction} ${RULE_RELATIVE_PATH}`;
  stdout.write(
    `Installed ${installScope} Cursor hook (${hookFileAction} ${HOOK_RELATIVE_PATH}, ${hookEntryAction} preToolUse entry, ${ruleSummary}).\n`,
  );
  if (context.global) {
    stdout.write(
      "Global rules are managed via Cursor User Rules (not ~/.cursor/rules).\n"
        + "Open Cursor Settings > Rules > User Rules and paste:\n\n"
        + `${USER_RULE_CONTENT}\n`,
    );
  }

  return {
    ...context,
    hookFileAction,
    hookEntryAction,
    ruleFileAction,
  };
};
