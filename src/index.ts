import { toPointsArray, clamp, lerp } from './utils'
import { StrokeOptions, StrokePoint } from './types'
import * as vec from './vec'

const { min, PI } = Math

function getStrokeRadius(
  size: number,
  thinning: number,
  easing: (t: number) => number,
  pressure = 0.5
) {
  if (thinning === undefined) return size / 2
  pressure = clamp(easing(pressure), 0, 1)
  return (
    (thinning < 0
      ? lerp(size, size + size * clamp(thinning, -0.95, -0.05), pressure)
      : lerp(size - size * clamp(thinning, 0.05, 0.95), size, pressure)) / 2
  )
}

/**
 * ## getStrokePoints
 * @description Get points for a stroke.
 * @param points An array of points (as `[x, y, pressure]` or `{x, y, pressure}`). Pressure is optional.
 * @param streamline How much to streamline the stroke.
 */
export function getStrokePoints<
  T extends number[],
  K extends { x: number; y: number; pressure?: number }
>(points: (T | K)[], streamline = 0.5): StrokePoint[] {
  const pts = toPointsArray(points)

  if (pts.length === 0) return []

  if (pts.length === 1) pts.push(vec.add(pts[0], [1, 0]))

  const strokePoints: StrokePoint[] = [
    {
      point: [pts[0][0], pts[0][1]],
      pressure: pts[0][2],
      vector: [0, 0],
      distance: 0,
      runningLength: 0,
    },
  ]

  for (
    let i = 1, curr = pts[i], prev = strokePoints[0];
    i < pts.length;
    i++, curr = pts[i], prev = strokePoints[i - 1]
  ) {
    const point = vec.lrp(prev.point, [curr[0], curr[1]], 1 - streamline),
      pressure = curr[2],
      vector = vec.uni(vec.vec(point, prev.point)),
      distance = vec.dist(point, prev.point),
      runningLength = prev.runningLength + distance

    strokePoints.push({
      point,
      pressure,
      vector,
      distance,
      runningLength,
    })
  }

  return strokePoints
}

/**
 * ## getStrokeOutlinePoints
 * @description Get an array of points (as `[x, y]`) representing the outline of a stroke.
 * @param points An array of points (as `[x, y, pressure]` or `{x, y, pressure}`). Pressure is optional.
 * @param options An (optional) object with options.
 * @param options.size	The base size (diameter) of the stroke.
 * @param options.thinning The effect of pressure on the stroke's size.
 * @param options.smoothing	How much to soften the stroke's edges.
 * @param options.easing	An easing function to apply to each point's pressure.
 * @param options.simulatePressure Whether to simulate pressure based on velocity.
 */
export function getStrokeOutlinePoints(
  points: StrokePoint[],
  options: StrokeOptions = {} as StrokeOptions
): number[][] {
  const {
    size = 8,
    thinning = 0.5,
    smoothing = 0.5,
    simulatePressure = true,
    easing = t => t,
  } = options

  const len = points.length,
    totalLength = points[len - 1].runningLength, // The total length of the line
    minDist = size * smoothing, // The minimum distance for measurements
    leftPts: number[][] = [], // Our collected left and right points
    rightPts: number[][] = []

  let pl = points[0].point, // Previous left and right points
    pr = points[0].point,
    tl = pl, // Points to test distance from
    tr = pr,
    pa = points[0].vector,
    pp = 0, // Previous (maybe simulated) pressure
    r = size / 2, // The current point radius
    short = true // Whether the line is drawn far enough

  // We can't do anything with an empty array.
  if (len === 0) return []

  // If the point is only one point long, or is very short, draw two caps at either end.
  if (totalLength <= size / 4) {
    const first = points[0],
      last = points[len - 1]

    if (thinning) {
      r = getStrokeRadius(size, thinning, easing, last.pressure)
    }

    const pushedA = vec.add(first.point, vec.mul(vec.per(last.vector), r))

    const pushedB = vec.add(
      [last.point[0], last.point[1]],
      vec.mul(vec.neg(vec.per(last.vector)), r)
    )

    for (let t = 0, step = 0.1; t <= 1; t += step) {
      tl = vec.rotAround(pushedA, first.point, PI * t)
      tr = vec.rotAround(pushedB, last.point, PI * t)
      leftPts.push(tl)
      rightPts.push(tr)
    }

    return leftPts.concat(rightPts)
  }

  // For a point with more than one point, create an outline shape.
  for (let i = 1; i < len - 1; i++) {
    const next = points[i + 1]

    let { point, pressure, vector, distance, runningLength } = points[i]

    // 1.
    // Calculate the size of the current point.

    if (thinning) {
      if (simulatePressure) {
        // Simulate pressure by accellerating the reported pressure.
        const rp = min(1 - distance / size, 1)
        const sp = min(distance / size, 1)
        pressure = min(1, pp + (rp - pp) * (sp / 2))
      }

      // Compute the stroke radius based on the pressure, easing and thinning.
      r = getStrokeRadius(size, thinning, easing, pressure)
    }

    // 2.
    // Draw a cap once we've reached the minimum length.

    if (short) {
      if (runningLength < size / 4) continue

      // The first point after we've reached the minimum length.
      // Draw a cap at the first point angled toward the current point.

      short = false

      const pushed = vec.sub(points[0].point, vec.mul(vec.per(vector), r))

      for (let t = 0, step = 0.1; t <= 1; t += step) {
        tl = vec.rotAround(pushed, points[0].point, PI * -t)
        leftPts.push(tl)
      }

      tr = vec.rotAround(pushed, points[0].point, PI * 2)
      rightPts.push(tr)
    }

    // 3.
    // Handle sharp corners

    // Find the delta between the current and next angle.
    const dpr = vec.dpr(vector, next.vector)

    if (dpr < 0) {
      // A sharp corner.
      // Project points (left and right) for a cap.

      const v = vec.per(pa)
      const pushedA = vec.add(point, vec.mul(v, r))
      const pushedB = vec.sub(point, vec.mul(v, r))

      for (let t = 0; t <= 1; t += 0.25) {
        tl = vec.rotAround(pushedA, point, PI * -t)
        tr = vec.rotAround(pushedB, point, PI * t)

        leftPts.push(tl)
        rightPts.push(tr)
      }

      continue
    }

    // 4. Add regular point.

    pl = vec.add(point, vec.mul(vec.per(vector), r))
    pr = vec.add(point, vec.mul(vec.neg(vec.per(vector)), r))

    if (dpr < 0.25 || vec.dist(pl, tl) > minDist) {
      leftPts.push(vec.med(tl, pl))
      tl = pl
    }

    if (dpr < 0.25 || vec.dist(pr, tr) > minDist) {
      rightPts.push(vec.med(tr, pr))
      tr = pr
    }

    pp = pressure
    pa = vector
  }

  // Add the end cap. This is tricky because some lines end with sharp angles.
  const last = points[points.length - 1]

  const pushed = vec.add(last.point, vec.mul(vec.neg(vec.per(last.vector)), r))

  for (let t = 0, step = 0.1; t <= 1; t += step) {
    rightPts.push(vec.rotAround(pushed, last.point, PI * t))
  }

  const results = leftPts.concat(rightPts.reverse())

  return results
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
  const results = getStrokeOutlinePoints(
    getStrokePoints(points, options.streamline),
    options
  )

  return results
}

export { StrokeOptions }
