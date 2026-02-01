# Modernization Todo List

This document outlines infrastructure and tooling improvements for the perfect-freehand repository. These changes do not affect the core algorithm source code.

---

## High Priority

### 1. Upgrade TypeScript (4.4.2 → 5.x)

- [x] Update `typescript` to `^5.3.0` or later
- [x] Enable `strict: true` in `tsconfig.base.json` (currently disabled)
- [x] Review and update any deprecated compiler options
- [x] Update `@types/node` from `^15.0.1` to `^20.x`

### 2. Replace Lerna with Lazyrepo

- [x] Remove Lerna (it's 4+ major versions behind)
- [x] Keep **Yarn workspaces** for dependency management (already configured)
- [x] Add **lazyrepo** for task orchestration and caching
  - Simpler than Turborepo/Nx
  - Works well with yarn workspaces
  - Reference: tldraw/tldraw uses this setup
- [x] Create `lazy.config.js` for build/test task definitions
- [x] Remove `lerna.json`
- [x] Remove `lerna` dependency

### 3. Upgrade ESLint (7.32.0 → 9.x)

- [x] Upgrade `eslint` to `^9.x`
- [x] Upgrade `@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin` to `^7.x` or `^8.x`
- [x] Migrate from `.eslintrc.js` to **flat config** (`eslint.config.js`)
- [x] Consider adding `eslint-config-prettier` to avoid conflicts

### 4. Migrate to Vitest

- [x] Replace Jest with **Vitest**
  - Native ESM and TypeScript support (no ts-jest needed)
  - Compatible with Jest syntax (minimal test changes)
  - Integrates with Vite for fast HMR in watch mode
- [x] Remove Jest dependencies: `jest`, `ts-jest`, `@types/jest`
- [x] Remove `@testing-library/jest-dom` (use `@testing-library/jest-dom/vitest`)
- [x] Create `vitest.config.ts`
- [x] Update test scripts in `package.json`
- [x] Remove Babel dependencies if no longer needed (Vitest handles TS natively)

### 5. Migrate to Rolldown (Library Build)

- [x] Replace custom esbuild scripts with **Rolldown** (https://rolldown.rs/)
  - Rust-based bundler with Rollup-compatible API
  - Built-in transforms, minification, and source maps
  - Significantly faster than Rollup (1.6s vs 40s in benchmarks)
- [x] Create `rolldown.config.mjs` for library builds
- [x] Configure dual CJS/ESM output formats
- [x] Remove `packages/perfect-freehand/scripts/build.js` and `dev.js`

### 6. Migrate Dev App to Vite

- [x] Replace custom esbuild dev server with **Vite**
  - Fast HMR, native ESM, excellent DX
  - Vite 6+ uses Rolldown under the hood
- [x] Create `packages/dev/vite.config.ts`
- [x] Remove `packages/dev/esbuild.config.mjs`
- [x] Remove `esbuild` and `esbuild-css-modules-plugin` dependencies
- [x] Vite has built-in CSS modules support

---

## Medium Priority

### 7. ~~Update Babel Dependencies~~ (No longer needed)

- [x] ~~Update all `@babel/*` packages from `^7.15.0` to `^7.23.x`~~
- [x] ~~Consider if Babel is still needed (esbuild handles transpilation)~~
- [x] ~~If only used for Jest, Vitest would eliminate this dependency~~
- Note: Babel dependencies were only used for Jest/ts-jest. With Vitest migration complete, Babel has been removed.

### 8. Modernize CI/CD Pipeline

- [x] Update `actions/checkout` and `actions/setup-node` to v4
- [x] Replace `mattallty/jest-github-action@v1.0.3` with Vitest (native GitHub Actions reporter)
- [x] Add Node.js version matrix testing (18.x, 20.x, 22.x)
- [x] Add caching for `node_modules` to speed up CI
- [x] Consider adding a publish workflow for automated npm releases

### 9. Prettier Configuration

- [x] Extract Prettier config from `package.json` to `.prettierrc`
- [x] Add `.prettierignore` file
- [x] Add `format` and `format:check` scripts
- [x] Integrate Prettier check into CI pipeline

### 10. Upgrade TypeDoc (0.21.9 → 0.28.x)

- [x] Update `typedoc` to latest version (0.28.x)
- [x] Review TypeDoc configuration options (added `typedoc.json` with modern options)
- [x] Consider adding a docs generation step to CI (added to `main.yml`)

---

## Lower Priority

### 11. Add Missing Configuration Files

- [x] Add `.editorconfig` for consistent editor settings
- [x] Add `.nvmrc` or `.node-version` to pin Node.js version
- [x] Add `engines` field to `package.json` to specify supported Node versions
- [x] Consider adding `renovate.json` or Dependabot for automated dependency updates

### 12. Improve Git Hooks (Husky)

- [x] Update `husky` to `^9.x`
- [x] Add `lint-staged` for faster pre-commit checks (only lint changed files)
- [x] Add a pre-push hook for running tests before push
- [x] Consider adding commit message linting with `commitlint`

### 13. Dev App Dependencies

- [x] Update `zustand` from `^4.0.0-rc.1` to stable `^4.x` or `^5.x`
- [x] Update `@testing-library/react` from `^12.0.0` to `^16.x`
- [x] Update Radix UI components to latest versions

### 14. Package.json Cleanup

- [x] Audit and remove unused dependencies
- [x] Standardize version specifiers (prefer `^` for flexibility)
- [x] Add `packageManager` field for Corepack support
- [x] Review and update `peerDependencies` if any

---

## Optional / Consider

### 15. Yarn Workspaces Improvements

- [x] Consider upgrading to **Yarn 4.x** (Berry) with PnP or node_modules linker
- [x] Add `packageManager` field to root `package.json` for Corepack
- [x] Configure `.yarnrc.yml` if using Yarn 4

### 16. Security & Auditing

- [x] Add `npm audit` or `yarn audit` to CI pipeline
- [x] Consider adding `socket.dev` or similar for supply chain security
  - Note: Dependabot is already configured (`.github/dependabot.yml`) for automated dependency updates, which provides similar supply chain security benefits
- [x] Review and update any dependencies with known vulnerabilities
  - Audit run on 2026-01-30: No vulnerabilities found

---

## Summary by Impact

| Category            | Items | Effort     | Impact |
| ------------------- | ----- | ---------- | ------ |
| TypeScript upgrade  | 4     | Medium     | High   |
| Lerna → Lazyrepo    | 6     | Low-Medium | High   |
| ESLint upgrade      | 4     | Medium     | Medium |
| Vitest migration    | 6     | Medium     | High   |
| Rolldown (library)  | 4     | Medium     | High   |
| Vite (dev app)      | 5     | Done       | Medium |
| CI/CD improvements  | 5     | Low        | Medium |
| Configuration files | 4     | Low        | Low    |

---

## Current Versions Reference

| Tool        | Current        | Latest | Gap        |
| ----------- | -------------- | ------ | ---------- |
| TypeScript  | 5.7.0          | 5.7+   | Up to date |
| lazyrepo    | 0.0.0-alpha.27 | alpha  | Up to date |
| ESLint      | 9.x            | 9.x    | Up to date |
| Vitest      | 3.0.0          | 3.x    | Up to date |
| Rolldown    | 1.0.0-rc.2     | 1.x RC | Up to date |
| Vite        | 6.0.0+         | 6.x    | Up to date |
| TypeDoc     | 0.28.x         | 0.28.x | Up to date |
| Husky       | 9.1.x          | 9.x    | Up to date |
| @types/node | 20.11.0        | 20.x   | Up to date |
