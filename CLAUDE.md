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
