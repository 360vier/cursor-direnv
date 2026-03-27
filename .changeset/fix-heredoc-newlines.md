---
"cursor-direnv": patch
---

Fix heredoc and multi-line commands breaking when `.envrc` is present.

`JSON.stringify` was used to quote the shell command passed to `zsh -lc`, which escaped real newlines as the two-character sequence `\n`. Shell does not expand `\n` back to a newline inside `-lc` strings, so heredoc delimiters never appeared on their own line — causing git commits with multi-line messages (and any other heredoc-based commands) to fail.

Replaced with shell single-quote escaping (`'...'` with `'\''` for embedded single quotes), which preserves literal newlines.
