# npm 10 ownership probe

A minimal, dependency-free Node project for comparing lifecycle-script access before and after `node_modules` is restored by a cache step.

- `.nvmrc` selects Node 20.20.2, which includes npm 10.8.2.
- `npm install` runs a postinstall script that writes `node_modules/.ngcc_lock_file`.
- The script prints numeric process and filesystem ownership details with `OWNERSHIP_PROBE`, then emits either `LOCK_WRITE_OK` or `LOCK_WRITE_ERROR`.

## Suggested pipeline setup

1. Use Kubernetes build infrastructure and allow repository cloning.
2. Use a Node 20.20.2 image, or an environment whose `nvm use` honors `.nvmrc`.
3. Enable Cache Intelligence with the default Node directory detection; it selects `node_modules` from `package.json`.
4. Run once with an empty cache, then run again against the same cache key.
5. Compare the `OWNERSHIP_PROBE` entries from each run.

Do not add a user override, metadata-preservation setting, recursive ownership change, or permission workaround until the baseline behavior is captured. The probe intentionally has no dependencies, registry credentials, source connectors, or application code.

## Expected output to compare

```text
OWNERSHIP_PROBE {"node":"...","uid":...,"gid":...,"app":...,"nodeModules":...}
LOCK_WRITE_OK {"lock":...}
```

A failed write prints `LOCK_WRITE_ERROR` with the OS error code and target path.
