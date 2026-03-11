export const DEFAULT_HOOKS_VERSION = 1;

const asObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const asArray = (value) => (Array.isArray(value) ? value : []);

export const buildPreToolUseEntry = (command) => ({
  matcher: "Shell",
  command,
});

export const normalizeHooksConfig = (inputConfig) => {
  const config = asObject(inputConfig);
  const version =
    typeof config.version === "number" ? config.version : DEFAULT_HOOKS_VERSION;
  const hooks = asObject(config.hooks);
  return {
    ...config,
    version,
    hooks,
  };
};

export const mergePreToolUseHook = (inputConfig, entry) => {
  const config = normalizeHooksConfig(inputConfig);
  const hooks = asObject(config.hooks);
  const existing = asArray(hooks.preToolUse);

  const duplicate = existing.some(
    (item) => item?.matcher === entry.matcher && item?.command === entry.command,
  );

  return {
    ...config,
    hooks: {
      ...hooks,
      preToolUse: duplicate ? existing : [...existing, entry],
    },
  };
};

export const removePreToolUseHook = (inputConfig, entry) => {
  const config = normalizeHooksConfig(inputConfig);
  const hooks = asObject(config.hooks);
  const existing = asArray(hooks.preToolUse);

  const filtered = existing.filter(
    (item) => !(item?.matcher === entry.matcher && item?.command === entry.command),
  );

  return {
    ...config,
    hooks: {
      ...hooks,
      preToolUse: filtered,
    },
  };
};
