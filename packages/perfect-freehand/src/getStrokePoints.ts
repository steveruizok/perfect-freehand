import { add, dist, isEqual, lrp, sub, uni } from './vec'
import type { StrokeOptions, StrokePoint } from './types'

/**
 * ## getStrokePoints
 * @description Get an array of points as objects with an adjusted point, pressure, vector, distance, and runningLength.
 * @param points An array of points (as `[x, y, pressure]` or `{x, y, pressure}`). Pressure is optional.
 * @param streamline How much to streamline the stroke.
 * @param size The stroke's size.
 */
export function getStrokePoints<
  T extends number[],
  K extends { x: number; y: number; pressure?: number }
>(points: (T | K)[], options = {} as StrokeOptions): StrokePoint[] {
  const { streamline = 0.5, size = 16, last: isComplete = false } = options

  // If we don't have any points, return an empty array.
  if (points.length === 0) return []

  // Find the interpolation level between points.
  const t = 0.15 + (1 - streamline) * 0.85

  // Whatever the input is, make sure that the points are in number[][].
  let pts = Array.isArray(points[0])
    ? (points as T[])
    : (points as K[]).map(({ x, y, pressure = 0.5 }) => [x, y, pressure])

  // If there's only one point, add another point at a 1pt offset.
  // Don't mutate the input array!
  if (pts.length === 1) {
    pts = [...pts, [...add(pts[0], [1, 1]), ...pts[0].slice(2)]]
  }

  // The strokePoints array will hold the points for the stroke.
  // Start it out with the first point, which needs no adjustment.
  const strokePoints: StrokePoint[] = [
    {
      point: [pts[0][0], pts[0][1]],
      pressure: pts[0][2] >= 0 ? pts[0][2] : 0.25,
      vector: [1, 1],
      distance: 0,
      runningLength: 0,
    },
  ]

  // A flag to see whether we've already reached out minimum length
  let hasReachedMinimumLength = false

  // We use the runningLength to keep track of the total distance
  let runningLength = 0

  // We're set this to the latest point, so we can use it to calculate
  // the distance and vector of the next point.
  let prev = strokePoints[0]

  const max = pts.length - 1

  // Iterate through all of the points, creating StrokePoints.
  for (let i = 1; i < pts.length; i++) {
    const point =
      isComplete && i === max
        ? // If we're at the last point, and `options.last` is true,
          // then add the actual input point.
          pts[i]
        : // Otherwise, using the t calculated from the streamline
          // option, interpolate a new point between the previous
          // point the current point.
          lrp(prev.point, pts[i], t)

    // If the new point is the same as the previous point, skip ahead.
    if (isEqual(prev.point, point)) continue

    // How far is the new point from the previous point?
    const distance = dist(point, prev.point)

    // Add this distance to the total "running length" of the line.
    runningLength += distance

    // At the start of the line, we wait until the new point is a
    // certain distance away from the original point, to avoid noise
    if (i < max && !hasReachedMinimumLength) {
      if (runningLength < size) continue
      hasReachedMinimumLength = true
      // TODO: Backfill the missing points so that tapering works correctly.
    }
    // Create a new strokepoint (it will be the new "previous" one).
    prev = {
      // The adjusted point
      point,
      // The input pressure (or .5 if not specified)
      pressure: pts[i][2] >= 0 ? pts[i][2] : 0.5,
      // The vector from the current point to the previous point
      vector: uni(sub(prev.point, point)),
      // The distance between the current point and the previous point
      distance,
      // The total distance so far
      runningLength,
    }

    // Push it to the strokePoints array.
    strokePoints.push(prev)
  }

  // Set the vector of the first point to be the same as the second point.
  strokePoints[0].vector = strokePoints[1]?.vector || [0, 0]

  return strokePoints
}
