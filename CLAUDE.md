# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

perfect-freehand is a TypeScript library for drawing pressure-sensitive freehand lines. It takes input points (from mouse/stylus) and generates polygon outline points that can be rendered as SVG paths or canvas shapes.

## Commands

```bash
# Install dependencies (uses yarn workspaces)
yarn

# Start development server (runs both dev app and library watch)
yarn start

# Run tests
yarn test

# Build the library
yarn build:packages

# Lint the library
cd packages/perfect-freehand && yarn lint
```

## Architecture

This is a **yarn workspaces monorepo** with two packages:

- `packages/perfect-freehand/` - The published npm library
- `packages/dev/` - Development/example React app

### Library Core (`packages/perfect-freehand/src/`)

The library has a simple pipeline architecture:

1. **`getStroke()`** - Main entry point. Combines the two functions below.
2. **`getStrokePoints()`** - Converts raw input points `[x, y, pressure?]` into `StrokePoint[]` objects with computed vectors, distances, and running lengths. Handles streamlining/smoothing.
3. **`getStrokeOutlinePoints()`** - Takes `StrokePoint[]` and generates the final polygon outline points. Handles pressure simulation, tapering, caps, and sharp corner detection.

Supporting modules:
- `vec.ts` - 2D vector math utilities (add, sub, mul, dist, per, etc.)
- `getStrokeRadius.ts` - Calculates radius based on pressure and thinning
- `types.ts` - TypeScript interfaces (`StrokeOptions`, `StrokePoint`)

### Key Options

The `StrokeOptions` interface controls stroke appearance:
- `size` - Base diameter of stroke
- `thinning` - How much pressure affects thickness (negative = thinner with pressure)
- `smoothing` - Edge softness
- `streamline` - Point interpolation amount
- `simulatePressure` - Auto-calculate pressure from velocity
- `start`/`end` - Tapering and cap options

## Current Tooling & Configuration

### Configuration Files

| File | Purpose |
|------|---------|
| `tsconfig.base.json` | Shared TypeScript config (extended by packages) |
| `tsconfig.json` | Root TypeScript config |
| `eslint.config.mjs` | ESLint configuration (flat config format) |
| `lazy.config.js` | lazyrepo task orchestration config |
| `vitest.config.ts` | Vitest test runner configuration |
| `packages/perfect-freehand/rolldown.config.mjs` | Rolldown bundler config for library |
| `package.json` | Contains Prettier config, workspace definitions |
| `.github/workflows/main.yml` | CI pipeline (build + test) |
| `.husky/pre-commit` | Git pre-commit hook |

### Build System

**Library (`packages/perfect-freehand/`):**
- Uses **Rolldown** (`rolldown.config.mjs`) - Rust-based bundler with Rollup-compatible API
- Outputs dual CJS/ESM formats with minification and source maps
- Outputs to `dist/` directory (cjs/, esm/, types/)

**Dev App (`packages/dev/`):**
- Uses esbuild via `esbuild.config.mjs`
- Includes `esbuild-css-modules-plugin` for CSS modules

### Current Dependency Versions (as of last audit)

| Tool | Version | Notes |
|------|---------|-------|
| TypeScript | 5.7.0 | `strict: true` in tsconfig |
| lazyrepo | 0.0.0-alpha.27 | Task orchestration and caching |
| ESLint | 9.x | Flat config `eslint.config.mjs` with typescript-eslint |
| Vitest | 3.x | Native ESM and TypeScript support |
| Rolldown | 1.0.0-rc.2 | Rust-based bundler for library builds |
| Husky | 7.0.0 | Pre-commit hook only |
| @types/node | 20.11.0 | Updated |

## Modernization

See `todo.md` for the full modernization roadmap. Key changes:
- ~~Replace Lerna with lazyrepo (keep yarn workspaces)~~ Done
- ~~Migrate Jest → Vitest~~ Done
- ~~Migrate esbuild scripts → Rolldown (library)~~ Done
- Migrate dev app esbuild → Vite (pending)
- ~~Upgrade TypeScript to 5.x with `strict: true`~~ Done
- ~~Upgrade ESLint to 9.x with flat config~~ Done
