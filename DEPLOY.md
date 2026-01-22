# CI & Vercel Deployment Notes

This document records fixes and recommendations to make GitHub Actions and Vercel builds reliable for this repository.

## Vercel

- Add the following Environment Variable in your Vercel Project Settings to prevent Playwright from downloading browsers during build:
  - `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`

- Ensure required runtime env vars for the frontend are set (if your build needs them):
  - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (only if accessed at build time)

- Use Node 20 for builds (the repo CI and Vercel should run Node 20). In Vercel, set the Node version in Project Settings if needed.

### Fix: `vercel-build` script

- Problem: Vercel sets `NODE_ENV=production` during installs. When the root `vercel-build` runs a nested `npm install` in `frontend`, devDependencies (including `vite`) are omitted and the build fails with `vite: command not found`.
- Fix applied in this repo: the root `package.json` `vercel-build` now forces a development install for the frontend so build tools are present:

```diff
"vercel-build": "cd frontend && npm install && npm run build",
"vercel-build": "cd frontend && NODE_ENV=development npm ci && npm run build",
```

If your Vercel environment doesn't accept the inline `NODE_ENV` syntax, an alternative is to set a Project Environment Variable for the build step:

- Key: `NPM_CONFIG_PRODUCTION` Value: `false` (this causes `npm ci`/`npm install` to include devDependencies)

Or explicitly install devDependencies in a build hook before running the build command.

## GitHub Actions (CI)

- The repository CI (`.github/workflows/ci.yml`) already uses Node 20. The frontend job runs:
  - `cd frontend && npm ci`
  - `cd frontend && npm run lint`
  - `cd frontend && npm run build`

- If you want to run Playwright e2e in CI, make sure to either:
  - Add a `webServer` entry to `frontend/playwright.config.ts` so Playwright starts the dev server automatically, or
  - Update the workflow to start the dev server in background and wait for it (e.g. `npm run dev` + `wait-on http://localhost:5173`) before `npx playwright test`.

## Common issues encountered and fixes applied

- Playwright browser downloads can cause Vercel builds to fail due to network/time/resource limits. Skipping the browser download during build is the recommended quick fix (`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`).

- ESLint configuration at repository root previously required `@eslint/js`. CI installs dependencies only in `frontend` and `backend` folders; the root package wasn't installing that package which produced `Cannot find module '@eslint/js'`. The root config was changed to a minimal flat config that does not require `@eslint/js` so CI/ESLint runs without installing extra root packages.

- Backend `eslint` is now a `devDependency` in `backend/package.json` and a `lint` script (`eslint src`) has been added so the backend lint step in CI works.

- Tests in `frontend/src` are Vitest unit tests. Playwright was previously scanning and attempting to run `*.test.*` files under `src` which produced `describe is not defined`. To avoid test runner collisions:
  - `frontend/playwright.config.ts` was added with `testDir: './tests/e2e'` and `testIgnore` patterns so Playwright only picks up e2e tests.
  - `frontend/src/tests/setupTests.ts` was patched to extend Vitest's `expect` with jest-dom matchers safely.

## Local reproduction commands

On macOS/Linux (bash):

```bash
cd frontend
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm run build
```

On Windows PowerShell:

```powershell
$env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '1'
cd frontend
npm ci
npm run build
```

If you need to reproduce the root `vercel-build` behavior locally (POSIX):

```bash
cd /path/to/repo
cd frontend
NODE_ENV=development npm ci
npm run build
```

## Recommendations

- Prefer skipping heavy devtool downloads during deploys (Playwright, browsers) and run e2e tests in a separate pipeline or with dedicated CI agents.
- Keep build-time environment variables minimal; prefer runtime env for keys that are not needed for static build.
- When adding global ESLint configs that rely on additional packages, ensure those packages are installed in CI or embed a minimal config in the repo as done here.

If you'd like, I can also:

- Add `webServer` to `frontend/playwright.config.ts` so Playwright launches the Vite dev server automatically in CI, or
- Add a short note to `README.md` linking to this file.
