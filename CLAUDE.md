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
| `.eslintrc.js` | ESLint configuration (legacy format) |
| `lerna.json` | Lerna monorepo config (to be replaced) |
| `package.json` | Contains Jest config, Prettier config, workspace definitions |
| `.github/workflows/main.yml` | CI pipeline (build + test) |
| `.husky/pre-commit` | Git pre-commit hook |

### Build System

**Library (`packages/perfect-freehand/`):**
- Uses custom esbuild scripts in `scripts/build.js` and `scripts/dev.js`
- Outputs to `dist/` directory

**Dev App (`packages/dev/`):**
- Uses esbuild via `esbuild.config.mjs`
- Includes `esbuild-css-modules-plugin` for CSS modules

### Current Dependency Versions (as of last audit)

| Tool | Version | Notes |
|------|---------|-------|
| TypeScript | 5.7.0 | `strict: true` in tsconfig |
| Lerna | 3.15.0 | Only used for `start` and `publish` scripts |
| ESLint | 7.32.0 | Legacy `.eslintrc.js` format |
| Jest | 27.1.0 | With ts-jest and Babel |
| Husky | 7.0.0 | Pre-commit hook only |
| @types/node | 20.11.0 | Updated |

## Modernization

See `todo.md` for the full modernization roadmap. Key changes:
- Replace Lerna with lazyrepo (keep yarn workspaces)
- Migrate Jest → Vitest
- Migrate esbuild scripts → Rolldown (library) and Vite (dev app)
- Upgrade TypeScript to 5.x with `strict: true`
- Upgrade ESLint to 9.x with flat config
