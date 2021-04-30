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
  if (!thinning) return size / 2
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
>(points: (T | K)[], streamline = 0.5, size = 8): StrokePoint[] {
  const pts = toPointsArray(points)

  let short = true

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

    const strokePoint = {
      point,
      pressure,
      vector,
      distance,
      runningLength,
    }

    strokePoints.push(strokePoint)

    if (short && (runningLength > size || i === pts.length - 1)) {
      short = false
      for (let pt of strokePoints) {
        pt.vector = strokePoint.vector
      }
    }

    if (i === pts.length - 1) {
      let rlen = 0
      for (let k = i; k > 1; k--) {
        const strokePoint = strokePoints[k]
        if (rlen > size) {
          for (let j = k; j < pts.length; j++) {
            strokePoints[j].vector = strokePoint.vector
          }
          break
        }
        rlen += strokePoint.distance
      }
    }
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
 * @param options.last Whether to handle the points as a completed stroke.
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
    start = {},
    end = {},
    last = false,
  } = options

  const {
    taper: taperStart = 0,
    easing: taperStartCurve = t => t * (2 - t),
  } = start

  const {
    taper: taperEnd = 0,
    easing: taperEndCurve = t => --t * t * t + 1,
  } = end

  const len = points.length // The number of points in the array
  const totalLength = points[len - 1].runningLength // The total length of the line
  const minDist = size * smoothing // The minimum distance for measurements
  const leftPts: number[][] = [] // Our collected left and right points
  const rightPts: number[][] = []

  let pl = points[0].point // Previous left and right points
  let pr = points[0].point
  let tl = pl // Points to test distance from
  let tr = pr
  let pa = points[0].vector
  let pp = 1 // Previous (maybe simulated) pressure
  let ir = 0 // The initial radius
  let r = size // The current radius
  let short = true // Whether the line is drawn far enough

  // We can't do anything with an empty array.
  if (len === 0) return []

  // Set initial radius
  for (let i = 0; i < len - 1; i++) {
    let { pressure, runningLength } = points[i]
    if (runningLength > size) {
      ir = getStrokeRadius(size, thinning, easing, pressure)
      break
    }
  }

  // Set radius for last point
  r = getStrokeRadius(size, thinning, easing, points[len - 1].pressure)

  // For a point with more than one point, create an outline shape.
  for (let i = 1; i < len - 1; i++) {
    const next = points[i + 1]

    let { point, pressure, vector, distance, runningLength } = points[i]

    if (short && runningLength > minDist) {
      short = false
    }

    // 1. Calculate the size of the current point.

    if (thinning) {
      if (simulatePressure) {
        // Simulate pressure by accellerating the reported pressure.
        const rp = min(1 - distance / size, 1)
        const sp = min(distance / size, 1)
        pressure = min(1, pp + (rp - pp) * (sp / 2))
      }

      // Compute the stroke radius based on the pressure, easing and thinning.
      r = getStrokeRadius(size, thinning, easing, pressure)
    } else {
      r = size / 2
    }

    // 2. Apply tapering to start and end pressures

    const ts =
      runningLength < taperStart
        ? taperStartCurve(runningLength / taperStart)
        : 1

    const te =
      totalLength - runningLength < taperEnd
        ? taperEndCurve((totalLength - runningLength) / taperEnd)
        : 1

    r = r * Math.min(ts, te)

    // 3. Handle sharp corners

    // Find the delta between the current and next angle.
    const dpr = vec.dpr(vector, next.vector)

    if (dpr < 0) {
      // Draw a cap at the sharp corner.
      const v = vec.per(pa)
      const pushedA = vec.add(point, vec.mul(v, r))
      const pushedB = vec.sub(point, vec.mul(v, r))

      for (let t = 0; t <= 1; t += 0.25) {
        const rx = PI * t
        const ry = PI * t
        tl = vec.rotAround(pushedA, point, -rx, -ry)
        tr = vec.rotAround(pushedB, point, rx, ry)

        leftPts.push(tl)
        rightPts.push(tr)
      }

      continue
    }

    // 4. Add regular point.

    pl = vec.add(point, vec.mul(vec.per(vector), r))
    pr = vec.add(point, vec.mul(vec.neg(vec.per(vector)), r))

    if (
      i == 1 ||
      dpr < 0.25 ||
      vec.dist(pl, tl) > (short ? minDist / 2 : minDist)
    ) {
      leftPts.push(vec.med(tl, pl))
      tl = pl
    }
    if (
      i == 1 ||
      dpr < 0.25 ||
      vec.dist(pr, tr) > (short ? minDist / 2 : minDist)
    ) {
      rightPts.push(vec.med(tr, pr))
      tr = pr
    }

    pp = pressure
    pa = vector
  }

  // 4. Draw caps

  const firstPoint = points[0]
  const lastPoint = points[points.length - 1]
  const veryShort = leftPts.length < 2 || rightPts.length < 2
  const isTapering = taperStart + taperEnd > 0
  let lpv = lastPoint.vector

  const startCap: number[][] = []
  const endCap: number[][] = []

  // Draw start cap if the end taper is set to zero

  if (veryShort) {
    if (!isTapering || (veryShort && last)) {
      // Backup: draw an inverse cap for the end cap
      lpv = vec.uni(vec.vec(lastPoint.point, firstPoint.point))
      const start = vec.add(
        firstPoint.point,
        vec.mul(vec.per(vec.neg(lpv)), ir || r)
      )
      for (let t = 0, step = 0.1; t <= 1; t += step) {
        const rx = PI * -t
        const ry = PI * -t
        startCap.push(vec.rotAround(start, firstPoint.point, rx, ry))
      }
      leftPts.shift()
      rightPts.shift()
    }
  } else if (taperStart === 0) {
    // Draw a cap between second left / right points
    const lp0 = leftPts[1]
    const rp0 = rightPts[1]
    const start = vec.add(
      firstPoint.point,
      vec.mul(vec.uni(vec.vec(lp0, rp0)), vec.dist(lp0, rp0) / 2)
    )
    for (let t = 0, step = 0.1; t <= 1; t += step) {
      const rx = PI * -t
      const ry = PI * -t
      startCap.push(vec.rotAround(start, firstPoint.point, rx, ry))
    }
    leftPts.shift()
    rightPts.shift()
  } else if (points[1]) {
    startCap.push(points[1].point)
  }

  // Draw end cap if taper end is set to zero

  if (!isTapering || (taperEnd === 0 && !veryShort) || (veryShort && last)) {
    const start = vec.add(lastPoint.point, vec.mul(vec.neg(vec.per(lpv)), r))
    for (let t = 0, step = 0.1; t <= 1; t += step) {
      const rx = PI * t
      const ry = PI * t
      endCap.push(vec.rotAround(start, lastPoint.point, rx, ry))
    }
  } else {
    endCap.push(lastPoint.point)
  }

  const results = [
    ...startCap,
    ...leftPts,
    ...endCap.reverse(),
    ...rightPts.reverse(),
  ]

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
