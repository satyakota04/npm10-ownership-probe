# npm 10 ownership probe

A minimal, dependency-free Node project for comparing lifecycle-script access before and after `node_modules` is restored by a cache step.

- `.nvmrc` selects Node 20.20.2, which includes npm 10.8.2.
- `npm install` runs a postinstall script that writes `node_modules/.ngcc_lock_file`.
- The script prints numeric process and filesystem ownership details with `OWNERSHIP_PROBE`, then emits either `LOCK_WRITE_OK` or `LOCK_WRITE_ERROR`.

## Suggested pipeline setup

1. Use Kubernetes build infrastructure, allow repository cloning, and use the same `node:20` image for both probe repositories.
2. Use this same command in both pipelines; only `.nvmrc` differs:

   ```sh
   set -euo pipefail
   . /harness/ci/common.sh
   nvm use "$(cat .nvmrc)"
   corepack enable
   node --version
   npm --version
   npm install
   ```

   Confirm it reports Node 20.20.2 and npm 10.8.2 before installation.
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
