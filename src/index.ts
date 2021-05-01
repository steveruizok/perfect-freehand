import { toPointsArray, clamp, lerp } from './utils'
import { StrokeOptions, StrokePoint } from './types'
import * as vec from './vec'
import Spline from './spline'

// The idea here would be to generate a 3D curve for the points where
// the third degree represetnts pressure. We could then pick any point t
// along the curve and get the x, y, and pressure at that point.

const { min, PI } = Math

function getStrokeRadius(
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

/**
 * ## getStroke
 * @description Returns a stroke as an array of points.
 * @param points An array of points (as `[x, y, pressure]` or `{x, y, pressure}`). Pressure is optional.
 * @param options An (optional) object with options.
 * @param options.size	The base size (diameter) of the stroke.
 * @param options.thinning The effect of pressure on the stroke's size.
 * @param options.smoothing	How much to soften the stroke's edges.
 * @param options.streamline How much to streamline the stroke.
 * @param options.simulatePressure Whether to simulate pressure based on velocity.
 */
export default function getStroke<
  T extends number[],
  K extends { x: number; y: number; pressure?: number }
>(points: (T | K)[], options: StrokeOptions = {} as StrokeOptions): number[][] {
  const { size = 16, smoothing = 0.5, streamline = 0.25 } = options

  const pts = toPointsArray(points)

  if (pts.length < 4) return pts

  const smoothPts: number[][] = [pts[0]]

  for (let i = 1; i < pts.length; i++) {
    smoothPts.push([
      ...vec.lrp(smoothPts[i - 1], pts[i], 1 - streamline),
      pts[i][2],
    ])
  }

  const middleSpline = new Spline(smoothPts, options)

  return middleSpline.getOutlineShape(size, smoothing)
}

export { StrokeOptions }
