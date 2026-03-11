# TDD Plan: Cursor direnv Hook CLI

## Goals

- Build an npm CLI that supports:
  - `npx cursor-direnv install -g` (install user-level hook in `~/.cursor/hooks.json`)
  - `npx cursor-direnv install` (install project-level hook in `<repo>/.cursor/hooks.json`)
- Keep install idempotent and non-destructive (merge hook config, do not wipe unrelated hooks).
- Publish from GitHub to npm with MIT licensing and automated release flow.

## Naming Decision

- `cursor-direnv` appears available (npm registry returns 404 for package endpoint).
- Suggested backup names if needed:
  - `cursor-hooks-direnv`
  - `direnv-cursor`
  - `cursor-direnv-hook`

## Repository Layout (new repo)

- [package.json](package.json) - package metadata, bin entry, scripts
- [LICENSE](LICENSE) - MIT text
- [README.md](README.md) - usage, safety notes, uninstall/update examples
- [bin/cursor-direnv.mjs](bin/cursor-direnv.mjs) - CLI entrypoint
- [src/commands/install.mjs](src/commands/install.mjs)
- [src/commands/uninstall.mjs](src/commands/uninstall.mjs) (recommended, even if not required day one)
- [src/hooks/pretooluse-direnv.mjs](src/hooks/pretooluse-direnv.mjs) - runtime hook script copied/linked into target
- [src/lib/hooks-json.mjs](src/lib/hooks-json.mjs) - read/merge/write hooks config
- [src/lib/paths.mjs](src/lib/paths.mjs) - platform-safe path resolution
- [src/lib/io.mjs](src/lib/io.mjs) - atomic file write helpers
- [test/unit/*.test.mjs](test/unit/) - pure logic tests
- [test/integration/*.test.mjs](test/integration/) - filesystem install behavior tests
- [.github/workflows/ci.yml](.github/workflows/ci.yml) - test/lint on PR
- [.github/workflows/release.yml](.github/workflows/release.yml) - publish on tag/release

## Functional Spec

- `install` (local default):
  - target root = current working directory
  - ensure `<cwd>/.cursor/hooks/pretooluse-direnv.mjs` exists
  - merge `<cwd>/.cursor/hooks.json` with:
    - `hooks.preToolUse` containing `{ command: "node .cursor/hooks/pretooluse-direnv.mjs", matcher: "Shell" }`
  - avoid duplicate entry if already present.
- `install -g`:
  - target root = `~/.cursor`
  - ensure `~/.cursor/hooks/pretooluse-direnv.mjs` exists
  - merge `~/.cursor/hooks.json` with:
    - `hooks.preToolUse` containing `{ command: "node hooks/pretooluse-direnv.mjs", matcher: "Shell" }`
- Hook behavior (`pretooluse-direnv.mjs`):
  - act only when `tool_name === "Shell"`
  - skip when already in direnv (`DIRENV_DIR` or `DIRENV_DIFF`)
  - skip when `.envrc` missing at project root (`CURSOR_PROJECT_DIR` fallback to cwd)
  - skip when command already starts with `direnv exec `
  - otherwise return `updated_input.command = direnv exec . zsh -lc <json-quoted original command>`

## TDD Roadmap

1. Write failing unit tests for config merging:
   - creates new hooks.json with correct schema/version
   - merges into existing hooks without clobbering other hook entries
   - prevents duplicate preToolUse entries
2. Write failing integration tests for local install:
   - creates `.cursor/hooks/pretooluse-direnv.mjs`
   - creates/updates `.cursor/hooks.json`
3. Write failing integration tests for global install in temp HOME:
   - writes to `~/.cursor` under test-controlled home
4. Implement install command to satisfy tests.
5. Add tests for hook runtime behavior (input/output contracts).
6. Add uninstall tests and implementation (recommended).
7. Add snapshot/fixture tests for tricky existing `hooks.json` variants.

## Release and Publishing (GitHub -> npm)

- npm setup:
  - create npm account/org and enable 2FA (automation-compatible mode)
  - create `NPM_TOKEN` with publish rights
- GitHub setup:
  - protect `main`, require CI checks
  - add `NPM_TOKEN` repository secret
- CI pipeline ([.github/workflows/ci.yml](.github/workflows/ci.yml)):
  - run on PR/push
  - Node LTS matrix (at least current LTS)
  - run tests + lint
- Release pipeline ([.github/workflows/release.yml](.github/workflows/release.yml)):
  - trigger on GitHub Release published (or version tag)
  - run tests
  - publish with `npm publish --access public`
- Versioning:
  - use semver + changelog (changesets or release-please)

## Quality Gates

- `npm pack` smoke check in CI to verify files included.
- Integration tests run on Linux/macOS path conventions at minimum.
- Manual E2E before first publish:
  - `npx <package> install` in a temp repo
  - `npx <package> install -g` in temp HOME
  - verify Cursor reads hook and command rewriting works.

## Documentation to ship

- README sections:
  - install commands
  - what the hook changes
  - idempotency and merge behavior
  - troubleshooting (trusted workspace, restart Cursor, node availability)
  - uninstall instructions
- MIT license in [LICENSE](LICENSE).

## References

- Cursor Hooks specification: [https://cursor.com/docs/hooks](https://cursor.com/docs/hooks)
- npm registry package check endpoint example: [https://registry.npmjs.org/cursor-direnv](https://registry.npmjs.org/cursor-direnv)
