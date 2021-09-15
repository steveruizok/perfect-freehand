import { toPointsArray } from './utils'
import type { StrokeOptions, StrokePoint } from './types'
import * as vec from './vec'

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
  let { streamline = 0.5 } = options
  const { simulatePressure = true, last: isComplete = false } = options

  // If we don't have any points, return an empty array.
  if (points.length === 0) return []

  // Knock down the streamline (more if we're simulating pressure).
  streamline = streamline / (simulatePressure ? 3 : 2)

  // Whatever the input is, make sure that the points are in number[][].
  const pts = toPointsArray(points)

  // If there's only one point, add another point at a 1pt offset.
  if (pts.length === 1) pts.push([...vec.add(pts[0], [1, 1]), pts[0][2] || 0.5])

  // The strokePoints array will hold the points for the stroke.
  // Start it out with the first point, which needs no adjustment.
  const strokePoints: StrokePoint[] = []

  let prev: StrokePoint = {
    point: [pts[0][0], pts[0][1]],
    pressure: pts[0][2] || 0.5,
    vector: [0, 0],
    distance: 0,
    runningLength: 0,
  }

  strokePoints.push(prev)

  // Iterate through all of the points.
  const len = pts.length

  let curr: number[]

  for (let i = 0; i < len; i++) {
    curr = pts[i]

    // If we're at the last point, then add the actual input point.
    // Otherwise, using the streamline option, interpolate a new point
    // between the previous point the current point.
    // More streamline = closer to the previous point;
    // less streamline = closer to the current point.
    // This takes a lot of the "noise" out of the input points.
    const point =
      isComplete && i === len - 1
        ? curr
        : vec.lrp(prev.point, curr, 1 - streamline)

    // If the new point is the same as the previous point, skip ahead.
    if (vec.isEqual(prev.point, point)) continue

    // What's the vector from the current point to the previous point?
    const vector = vec.uni(vec.sub(prev.point, point))

    // How far is the new point from the previous point?
    const distance = vec.dist(point, prev.point)

    // Add this distance to the total "running length" of the line.
    const runningLength = prev.runningLength + distance

    // Create a new strokepoint (it will be the new "previous" one)
    prev = {
      point,
      pressure: curr[2] || 0.5,
      vector,
      distance,
      runningLength,
    }

    strokePoints.push(prev)
  }

  return strokePoints
}
