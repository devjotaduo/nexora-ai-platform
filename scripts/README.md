# Scripts

Run from **repo root**.

## Build wheel (with latest console)

```bash
bash scripts/wheel_build.sh
```

- Builds the console frontend (`console/`), copies `console/dist` to `src/qwenpaw/console/dist`, then builds the wheel. Output: `dist/*.whl`.

## Build website

```bash
bash scripts/website_build.sh
```

- Installs dependencies (pnpm or npm) and runs the Vite build. Output: `website/dist/`.

## Build Docker image

```bash
bash scripts/docker_build.sh [IMAGE_TAG] [EXTRA_ARGS...]
```

- Default tag: `qwenpaw:latest`. Uses `deploy/Dockerfile` (multi-stage: builds console then Python app).
- Example: `bash scripts/docker_build.sh myreg/qwenpaw:v1 --no-cache`.

## Create feature worktree with shared env/tenants/uploads

```bash
bash scripts/worktree_feature.sh <feature-name>
```

- Creates `feature/<feature-name>` from `origin/main` in a sibling worktree directory (`../<repo>-<feature-name>`).
- Links shared runtime resources:
  - `.env -> ../_shared/env/qwenpaw.env`
  - `tenants -> ../_shared/tenants`
  - `uploads -> ../_shared/uploads`
- Runs `pnpm install --prefer-offline` (root `package.json`, or `console/` as fallback).
- Pushes with upstream tracking: `git push -u origin feature/<feature-name>`.
- Optional flags:
  - `--shared-dir <path>` to override `../_shared`
  - `--force` to replace existing targets when creating links

## Bootstrap current worktree (manual command)

```bash
bash scripts/worktree_bootstrap.sh
```

- Applies shared links (`.env`, `tenants`, `uploads`) in the **current** worktree.
- Runs `pnpm install --prefer-offline`.
- Optional flags:
  - `--shared-dir <path>` to override `../_shared`
  - `--force` to replace existing targets
  - `--skip-install` to only create links

## Install git hook for auto-bootstrap on checkout

```bash
bash scripts/install_worktree_hook.sh
```

- Configures `core.hooksPath` to `.githooks`.
- Enables `.githooks/post-checkout` so any checkout to `feature/*` auto-runs:
  - `bash scripts/worktree_bootstrap.sh --shared-dir ../_shared`
- To disable temporarily in one command/session:
  - `QWENPAW_WORKTREE_HOOK_DISABLE=1 git checkout <branch>`

## Run Test

```bash
# Run all tests
python scripts/run_tests.py

# Run all unit tests
python scripts/run_tests.py -u

# Run unit tests for a specific module
python scripts/run_tests.py -u providers

# Run integration tests
python scripts/run_tests.py -i

# Run all tests and generate a coverage report
python scripts/run_tests.py -a -c

# Run tests in parallel (requires pytest-xdist)
python scripts/run_tests.py -p

# Show help
python scripts/run_tests.py -h
```