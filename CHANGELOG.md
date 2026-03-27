# cursor-direnv

## 0.2.2

### Patch Changes

- c91e710: Fix heredoc and multi-line commands breaking when `.envrc` is present.

  `JSON.stringify` was used to quote the shell command passed to `zsh -lc`, which escaped real newlines as the two-character sequence `\n`. Shell does not expand `\n` back to a newline inside `-lc` strings, so heredoc delimiters never appeared on their own line — causing git commits with multi-line messages (and any other heredoc-based commands) to fail.

  Replaced with shell single-quote escaping (`'...'` with `'\''` for embedded single quotes), which preserves literal newlines.

## 0.2.1

### Patch Changes

- dcab266: Remove the local Cursor rules file (`.cursor/rules/direnv-hook.mdc`) when running local uninstall so install and uninstall clean up the same files.

  Add integration coverage and documentation updates for the local uninstall cleanup behavior.

## 0.2.0

### Minor Changes

- c7f7ed3: Ship the initial `cursor-direnv` CLI with local/global install and uninstall commands for the Cursor direnv hook.

  Add test coverage for hook rewriting and hooks.json merge behavior, plus GitHub workflows for CI and automated releases.

### Patch Changes

- fd81d45: Switch release automation to npm trusted publishing (OIDC) by updating the GitHub release workflow permissions and removing token-based npm publish credentials.

  Update release documentation and package metadata so publishing guidance and repository links point to `github.com/360vier/cursor-direnv`.
