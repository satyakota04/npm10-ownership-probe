# npm 10 ownership probe

A dependency-free Linux reproduction of an npm lifecycle script writing a lock inside restored `app/node_modules`. It simulates the filesystem operation, not a complete Angular build.

## Layout and runtime

```text
.iupipes.yml
.nvmrc
app/
  package.json
  scripts/write-ngcc-lock.cjs
```

Use **`node:20` as the pipeline image for both sample repositories**. The shared setup installs NVM; `.iupipes.yml` then selects **Node 20.20.2 / npm 10.8.2** and sets `build.working-directory` to `app`. The root `.nvmrc` agrees with that version. Stock `node:20` alone does not provide NVM or `/harness/ci/common.sh`.

There is deliberately no root `package.json`: Cache Intelligence should detect `app/package.json` and cache `app/node_modules`. The workspace root and cloned `app/` can have different owners. Unlike npm 8's ownership inference for root callers, npm 10 normally retains the caller's identity for lifecycle scripts.

## Pipeline setup

1. Clone this repository on `main` using Kubernetes infrastructure.
2. Keep Cache Intelligence enabled with `override: true`, and keep Build Intelligence enabled for the comparison. Leave clone/build/cache user overrides and metadata preservation unset.
3. In a source-configuration step, parse `.iupipes.yml` into the Node version, expected npm version, and working directory.
4. In a `node:20` Bash step, install NVM v0.40.1 into shared `/harness/.nvm`, install/select the configured Node version, and create the shared helper.
5. In another `node:20` Bash step, source the helper, select the same version, enable Corepack, **change into `app`**, and run the npm helper below.

The relevant helper behavior is:

```bash
install_deps() {
  npm config set cache /harness/.cache/node/npm --global
  ls -lhR ./
  npm install --verbose --no-audit --no-fund --prefer-offline 2>&1
  npm list --json --depth=0 > /harness/ci/npm_install.log 2>/dev/null || true
}
```

Print `id`, `umask`, Node/npm versions, and numeric ownership/modes of `/harness`, `app`, and `app/node_modules` before installation. Do not add `chown`, `chmod`, or an explicit `runAsUser` to manufacture a failure.

## Cold and warm runs

Start a **new full execution using the updated pipeline and current `main`**, not a retry of the previous root-layout pipeline. After the first execution successfully saves the cache, run again with identical repository, branch, and inputs. Check the Restore Cache log to establish a hit; a successful pipeline or Build Intelligence savings alone is not proof of a hit.

The lifecycle script emits:

- `OWNERSHIP_PROBE`: effective UID/GID/groups, npm executable, cwd, workspace/app/cache ownership, and any existing lock.
- `LOCK_WRITE_OK` followed by `LOCK_RELEASED`: successful exclusive lock creation and removal of that newly created lock. A small payload remains for caching.
- `LOCK_WRITE_ERROR`: failure, including its path and OS error code. `EACCES` indicates denied access; `EEXIST` indicates an existing lock, which the probe does not delete.

A successful warm run is not guaranteed: a non-root npm 10 process can also fail against a root-owned, non-writable cache. Compare the recorded identities and restore path with the npm 8 sample before drawing conclusions.
