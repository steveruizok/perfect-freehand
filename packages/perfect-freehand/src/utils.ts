/**
 * Interpolate a numbet from a given start to a given end.
 * @param y1 The start value.
 * @param y2 The end value.
 * @param mu The position between start and end.
 * @internal
 */
export function lerp(y1: number, y2: number, mu: number) {
  return y1 * (1 - mu) + y2 * mu
}

/**
 * Clamp a number between a minimum and maximum value.
 * @param n The value to clamp.
 * @param a The minimum value.
 * @param b The maximum value.
 * @internal
 */
export function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

/**
 * Convert an array of points to the correct format ([x, y, pressure])
 * @param points The points to format, an array of arrays or objects
 * @internal
 */
export function toPointsArray<
  T extends number[],
  K extends { x: number; y: number; pressure?: number }
>(points: (T | K)[]): number[][] {
  return Array.isArray(points[0])
    ? (points as T[])
    : (points as K[]).map(({ x, y, pressure = 0.5 }) => [x, y, pressure])
}

/**
 * Compute a radius based on the pressure.
 * @param size
 * @param thinning
 * @param easing
 * @param pressure
 * @internal
 */

export function getStrokeRadius(
  size: number,
  thinning: number,
  easing: (t: number) => number,
  pressure = 0.5
) {
  const p = (0.5 - easing(pressure)) * thinning
  // return Math.max(0, 0.5 * (size * 0.5 + p) * (1 - 2 * p))
  return Math.max(0, size * (0.25 - 0.5 * p) + p * (0.5 - p))
}
