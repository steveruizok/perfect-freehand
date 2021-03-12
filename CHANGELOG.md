## 0.3.4

- Fixes bug in short strokes.

## 0.3.3

- Adds the `easing` property. This property accepts an [easing function](https://gist.github.com/gre/1650294) that will apply to all pressure measurements (real or simulated). Defaults to a linear easing (`t => t`).

## 0.3.2

- Superficial changes.

## 0.3.1

- Improves sharp corners that aren't sharp enough for caps, but are still sharp enough to confuse the distance-checking part of the algorithm.

## 0.3.0

This version has breaking changes.

- Removes polygon-clipping as a dependency. The problems it solved are no longer problems but a developer might still use it separately for aesthetic reasons.
- Removes `clipPath`.
- Removes options types other than `StrokeOptions`.
- Removes `getShortStrokeOutlinePoints`.
- Removes `pressure` option.
- Removes `minSize` and `maxSize` options.
- Adds `size` and `thinning` options.
- Renames `smooth` to `smoothing`.
- Improves caps.
- Improves dots and short strokes.
- You can now use `thinning` to create strokes that shink at high pressure as well as at low pressure. This is a normalized value based on the `size` option:
  - at `0` the `thinning` property will have no effect on a stroke's width.
  - at `1` a stroke will reach zero width at the lowest pressure and its full width (`size`) at the highest pressure
  - at `-1` a stroke will reach zero width at the highest pressure and its full width at the lowest pressure.
- Setting `thinning` to zero has the same effect as had setting the now removed `pressure` option to `false`.
- Improves code organization and comments.

## 0.2.5

- Improves caps for start and end.
- Improves handling of short moves.

## 0.2.4

- Improves sharp corners.

## 0.2.3

- Brings back `simulatePressure` until I have a better way of guessing.

## 0.2.2

- Slight fix to line starts.

## 0.2.1

- Fixes actual pressure sensitivity.

## 0.2.0

- Breaks up algorithm into smaller functions. Because `getPath` returns an SVG path data, you can use `getPath` only with the Path2D element (for HTML Canvas) or SVG paths. These new functions will allow you to create paths in other rendering technologies.

  - `getStrokePoints` will apply a streamline to the given point, calculate angle, and distances and lengths.
  - `getStrokeOutlinePoints` will generate an array of points defining the outline of the path.
  - `getShortStrokeOutlinePoints` will generate outline points for a very short stroke.
  - `clipPath` will generate a polygon (a series of faces) from the stroke.
  - `getPath` remains unchanged, and will still return an SVG path. It calls each of the above functions (more or less, depending on the mark and its options).

- Adds the `clip` option to flatten the path into a single polygon.
- Removes `type` option. We'll try to use pressure if available. To turn off pressure, set `pressure` to false.

## 0.1.3

- Removes hidden options, uses `maxSize` for velocity calculations.

## 0.1.2

- Fixes bug in pressure.

## 0.1.2

- Fixes bug with empty input array.

## 0.1.0

- Hey world.
