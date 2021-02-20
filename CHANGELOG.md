# 0.1.5

- Breaks up algorithm into smaller functions. Because `getPath` returns an SVG path data, you can use `getPath` only with the Path2D element (for HTML Canvas) or SVG paths. These new functions will allow you to create paths in other rendering technologies.

  - `getStrokePoints` will apply a streamline to the given point, calculate angle, and distances and lengths.
  - `getStrokeOutlinePoints` will generate an array of points defining the outline of the path.
  - `getShortStrokeOutlinePoints` will generate outline points for a very short stroke.
  - `clipPath` will generate a polygon (a series of faces) from the stroke.
  - `getPath` remains unchanged, and will still return an SVG path. It calls each of the above functions (more or less, depending on the mark and its options).

- Adds the `clip` option to flatten the path into a single polygon.
- Removes `type` option. We'll try to use pressure if available. To turn off pressure, set `pressure` to false.

# 0.1.3

- Removes hidden options, uses `maxSize` for velocity calculations.

# 0.1.2

- Fixes bug in pressure.

# 0.1.2

- Fixes bug with empty input array.

# 0.1.0

- Hey world.
