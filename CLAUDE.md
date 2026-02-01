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

# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run a single test file
yarn test packages/perfect-freehand/src/test/getStroke.spec.ts

# Run benchmarks
yarn bench

# Build the library
yarn build:packages

# Lint the library
cd packages/perfect-freehand && yarn lint

# Format code with Prettier
yarn format

# Check formatting without making changes
yarn format:check

# Generate API documentation
cd packages/perfect-freehand && yarn docs
```

## Architecture

This is a **yarn workspaces monorepo** with two packages:

- `packages/perfect-freehand/` - The published npm library
- `packages/dev/` - Development/example React app (Vite, runs on port 5420)

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

## Build & Tooling

- **Library build**: Rolldown (`packages/perfect-freehand/rolldown.config.mjs`) - outputs dual CJS/ESM to `dist/`
- **Dev app**: Vite with React plugin
- **Task orchestration**: lazyrepo (`lazy.config.js`)
- **Testing**: Vitest with jsdom environment
- **Git hooks**: Husky (pre-commit runs lint-staged, pre-push runs tests, commit-msg runs commitlint for conventional commits)
