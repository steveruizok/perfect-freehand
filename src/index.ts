import {
  toPointsArray,
  clamp,
  getAngle,
  getAngleDelta,
  getDistance,
  getPointBetween,
  projectPoint,
  lerp,
} from './utils'
import { StrokeOptions } from './types'

const { abs, min, PI } = Math,
  TAU = PI / 2,
  SHARP = PI * 0.8,
  DULL = SHARP / 2

/**
 * ## getStrokePoints
 * @description Get points for a stroke.
 * @param points An array of points (as `[x, y, pressure]` or `{x, y, pressure}`). Pressure is optional.
 * @param streamline How much to streamline the stroke.
 */
export function getStrokePoints<
  T extends number[],
  K extends { x: number; y: number; pressure?: number }
>(points: (T | K)[], streamline = 0.5): number[][] {
  const pts = toPointsArray(points)

  if (pts.length === 0) return []

  pts[0] = [pts[0][0], pts[0][1], pts[0][2] || 0, 0, 0, 0]

  for (
    let i = 1, curr = pts[i], prev = pts[0];
    i < pts.length;
    i++, curr = pts[i], prev = pts[i - 1]
  ) {
    curr[0] = lerp(prev[0], curr[0], 1 - streamline)
    curr[1] = lerp(prev[1], curr[1], 1 - streamline)
    curr[3] = getAngle(curr, prev)
    curr[4] = getDistance(curr, prev)
    curr[5] = prev[5] + curr[4]
  }

  return pts
}

/**
 * ## getStrokeOutlinePoints
 * @description Get an array of points (as `[x, y]`) representing the outline of a stroke.
 * @param points An array of points (as `[x, y, pressure]` or `{x, y, pressure}`). Pressure is optional.
 * @param options An (optional) object with options.
 * @param options.size	The base size (diameter) of the stroke.
 * @param options.thinning The effect of pressure on the stroke's size.
 * @param options.smoothing	How much to soften the stroke's edges.
 * @param options.simulatePressure Whether to simulate pressure based on velocity.
 */
export function getStrokeOutlinePoints(
  points: number[][],
  options: StrokeOptions = {} as StrokeOptions
): number[][] {
  const {
    size = 8,
    thinning = 0.5,
    smoothing = 0.5,
    simulatePressure = true,
  } = options

  const len = points.length,
    totalLength = points[len - 1][5], // The total length of the line
    minDist = size * smoothing, // The minimum distance for measurements
    leftPts: number[][] = [], // Our collected left and right points
    rightPts: number[][] = []

  let pl = points[0], // Previous left and right points
    pr = points[0],
    tl = pl, // Points to test distance from
    tr = pr,
    pp = 0, // Previous (maybe simulated) pressure
    r = size / 2, // The current point radius
    short = true // Whether the line is drawn far enough

  // We can't do anything with an empty array.
  if (len === 0) {
    return []
  }

  // If the point is only one point long, draw two caps at either end.
  if (len === 1 || totalLength <= size / 4) {
    let first = points[0],
      last = points[len - 1],
      angle = getAngle(first, last)

    if (thinning) {
      const pressure = last[2] ? clamp(last[2], 0, 1) : 0.5

      r =
        (thinning > 0
          ? lerp(size - size * thinning, size, clamp(pressure, 0.01, 0.99))
          : lerp(size, size + size * thinning, clamp(pressure, 0.01, 0.99))) / 2
    }

    for (let t = 0, step = 0.1; t <= 1; t += step) {
      tl = projectPoint(first, angle + PI + TAU - t * PI, r - 1)
      tr = projectPoint(last, angle + TAU - t * PI, r - 1)
      leftPts.push(tl)
      rightPts.push(tr)
    }

    return leftPts.concat(rightPts)
  }

  // For a point with more than one point, create an outline shape.
  for (let i = 1; i < len; i++) {
    const prev = points[i - 1],
      pa = prev[3]

    let [x, y, pressure, angle, distance, clen] = points[i]

    // 1.
    // Calculate the size of the current point.
    if (thinning) {
      if (simulatePressure) {
        // Simulate pressure by accellerating the reported pressure.
        const rp = min(1 - distance / size, 1)
        const sp = min(distance / size, 1)
        pressure = min(1, pp + (rp - pp) * (sp / 2))
      }

      // Compute the size based on the pressure and thinning.
      r =
        (thinning > 0
          ? lerp(size - size * thinning, size, clamp(pressure, 0.05, 0.95))
          : lerp(size, size + size * thinning, clamp(pressure, 0.05, 0.95))) / 2
    }

    // 2.
    // Draw a cap once we've reached the minimum length.
    if (short) {
      if (clen < size / 4) {
        continue
      }

      // The first point after we've reached the minimum length.
      short = false

      // Draw a cap at the first point angled toward the current point.
      const first = points[0]

      for (let t = 0, step = 0.1; t <= 1; t += step) {
        tl = projectPoint(first, angle + TAU - t * PI, r - 1)
        leftPts.push(tl)
      }

      tr = projectPoint(first, angle + TAU, r - 1)
      rightPts.push(tr)
    }

    // 3.
    // Add points for the current point.
    if (i === len - 1) {
      // The last point in the line.

      // Add points for an end cap.
      for (let t = 0, step = 0.1; t <= 1; t += step) {
        tr = projectPoint([x, y], angle + TAU + t * PI, r)
        rightPts.push(tr)
      }
    } else {
      // Find the delta between the current and previous angle.
      const delta = getAngleDelta(prev[3], angle),
        absDelta = abs(delta)

      if (absDelta > SHARP && clen > r) {
        // A sharp corner.

        // Project points (left and right) for a cap.
        const mid = getPointBetween(prev, [x, y])

        for (let t = 0, step = 0.25; t <= 1; t += step) {
          tl = projectPoint(mid, pa - TAU + t * -PI, r)
          tr = projectPoint(mid, pa + TAU + t * PI, r)

          leftPts.push(tl)
          rightPts.push(tr)
        }
      } else {
        // A regular point.

        // Add projected points left and right.
        pl = projectPoint([x, y], angle - TAU, r)
        pr = projectPoint([x, y], angle + TAU, r)

        // Add projected point if far enough away from last left point
        if (absDelta > DULL || getDistance(pl, tl) > minDist) {
          leftPts.push(getPointBetween(tl, pl))
          tl = pl
        }

        // Add point if far enough away from last right point
        if (absDelta > DULL || getDistance(pr, tr) > minDist) {
          rightPts.push(getPointBetween(tr, pr))
          tr = pr
        }
      }

      pp = pressure
    }
  }

  return leftPts.concat(rightPts.reverse())
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
  return getStrokeOutlinePoints(
    getStrokePoints(points, options.streamline),
    options
  )
}

export { StrokeOptions }
