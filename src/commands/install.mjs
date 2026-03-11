import { dirname } from "node:path";
import { buildPreToolUseEntry, mergePreToolUseHook } from "../lib/hooks-json.mjs";
import {
  copyFileAtomic,
  fileExists,
  readJsonIfExists,
  writeJsonAtomic,
  ensureDir,
} from "../lib/io.mjs";
import {
  HOOK_RELATIVE_PATH,
  resolveInstallContext,
  resolvePackagedHookSourcePath,
} from "../lib/paths.mjs";

export const installCommand = async ({
  global = false,
  cwd = process.cwd(),
  homeDir,
  stdout = process.stdout,
} = {}) => {
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

  const installScope = context.global ? "global" : "local";
  const hookEntryAction = afterPreToolUse === beforePreToolUse ? "kept" : "added";
  const hookFileAction = hookScriptExisted ? "updated" : "created";
  stdout.write(
    `Installed ${installScope} Cursor hook (${hookFileAction} ${HOOK_RELATIVE_PATH}, ${hookEntryAction} preToolUse entry).\n`,
  );

  return {
    ...context,
    hookFileAction,
    hookEntryAction,
  };
};
