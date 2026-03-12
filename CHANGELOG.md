# cursor-direnv

## 0.2.0

### Minor Changes

- c7f7ed3: Ship the initial `cursor-direnv` CLI with local/global install and uninstall commands for the Cursor direnv hook.

  Add test coverage for hook rewriting and hooks.json merge behavior, plus GitHub workflows for CI and automated releases.

### Patch Changes

- fd81d45: Switch release automation to npm trusted publishing (OIDC) by updating the GitHub release workflow permissions and removing token-based npm publish credentials.

  Update release documentation and package metadata so publishing guidance and repository links point to `github.com/360vier/cursor-direnv`.
