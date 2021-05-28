import { isEqual, vec } from './vec'

export function lerp(y1: number, y2: number, mu: number) {
  return y1 * (1 - mu) + y2 * mu
}

export function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

/**
 * Convert an array of points to the correct format ([x, y, radius])
 * @param points
 * @returns
 */
export function toPointsArray<
  T extends number[],
  K extends { x: number; y: number; pressure?: number }
>(points: (T | K)[]): number[][] {
  if (Array.isArray(points[0])) {
    return (points as number[][]).map(([x, y, pressure = 0.5]) => [
      x,
      y,
      pressure,
    ])
  } else {
    return (points as {
      x: number
      y: number
      pressure?: number
    }[]).map(({ x, y, pressure = 0.5 }) => [x, y, pressure])
  }
}

/**
 * Compute a radius based on the pressure.
 * @param size
 * @param thinning
 * @param easing
 * @param pressure
 * @returns
 */
export function getStrokeRadius(
  size: number,
  thinning: number,
  easing: (t: number) => number,
  pressure = 0.5
) {
  if (!thinning) return size / 2
  pressure = clamp(easing(pressure), 0, 1)
  return (
    (thinning < 0
      ? lerp(size, size + size * clamp(thinning, -0.95, -0.05), pressure)
      : lerp(size - size * clamp(thinning, 0.05, 0.95), size, pressure)) / 2
  )
}

export function withoutDuplicates(pts: number[][]) {
  const unique: number[][] = []

  let prev: number[] | undefined = undefined

  for (let pt of pts) {
    if (prev && isEqual(prev, pt)) continue
    unique.push(pt)
    prev = pt
  }

  return pts
}
