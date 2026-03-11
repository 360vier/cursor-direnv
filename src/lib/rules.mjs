export const RULE_FILE_NAME = "direnv-hook.mdc";

export const USER_RULE_CONTENT = `This workspace uses cursor-direnv for Shell tool calls.

- Shell commands may be rewritten to \`direnv exec . zsh -lc "<original command>"\`.
- Rewriting only applies to Shell tool calls with a non-empty command.
- The hook skips when already in direnv (\`DIRENV_DIR\` or \`DIRENV_DIFF\`).
- The hook skips when no \`.envrc\` exists in \`CURSOR_PROJECT_DIR\` (or cwd fallback).
- The hook skips when the command already starts with \`direnv exec \`.
- The hook skips when \`direnv\` is not available in PATH.
`;

export const PROJECT_RULE_CONTENT = `---
description: cursor-direnv hook behavior
alwaysApply: true
---

${USER_RULE_CONTENT}`;
