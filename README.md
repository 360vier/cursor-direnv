# cursor-direnv

`cursor-direnv` is a small CLI that installs a Cursor `preToolUse` hook to run `Shell` tool commands through `direnv` when a project has an `.envrc`.

## Install and run

Run without installing globally:

```bash
npx cursor-direnv install
```

Install user-level hook into `~/.cursor`:

```bash
npx cursor-direnv install -g
```

`install` verifies that `direnv` is available in PATH and exits with a clear error if it is missing.

Uninstall:

```bash
npx cursor-direnv uninstall
npx cursor-direnv uninstall -g
```

## What the hook changes

The installed hook rewrites Shell commands from:

- `<original command>`

to:

- `direnv exec . zsh -lc "<original command>"`

The hook only rewrites when all of the following are true:

- the tool is `Shell`
- command is non-empty
- you are not already in a direnv context (`DIRENV_DIR` / `DIRENV_DIFF`)
- a project `.envrc` exists (`CURSOR_PROJECT_DIR` fallback to cwd)
- command does not already begin with `direnv exec `
- `direnv` is callable from PATH

## Idempotency and merge behavior

- `install` always preserves unrelated `hooks.json` keys and hook arrays.
- It only adds the exact `preToolUse` entry if it is missing.
- Running `install` repeatedly does not create duplicates.

## Troubleshooting

- Trust the workspace in Cursor so hooks can run.
- Restart Cursor after changing hook setup.
- Ensure `node` and `direnv` are available in your PATH.
- Confirm your project has a valid `.envrc`.

## Development

```bash
npm install
npm run ci
```

## Versioning and releases

- Create a release note in your PR with `npm run changeset`.
- Changesets automation opens/updates a `chore: version packages` PR on `main`.
- Merging that PR updates `package.json` + changelog and publishes to npm.

## License

MIT, see `LICENSE`.
