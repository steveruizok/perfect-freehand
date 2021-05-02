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

    // Align vectors at the start of the line
    if (short && (runningLength > size || i === pts.length - 1)) {
      short = false
      for (let pt of strokePoints) {
        pt.vector = strokePoint.vector
      }
    }

    // Align vectors at the end of the line
    if (i === pts.length - 1) {
      let rlen = 0
      for (let k = i; k > 1; k--) {
        const strokePoint = strokePoints[k]
        if (rlen > size / 2) {
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

  // The number of points in the array
  const len = points.length

  // We can't do anything with an empty array.
  if (len === 0) return []

  // The total length of the line
  const totalLength = points[len - 1].runningLength

  // The minimum distance for measurements
  const minDist = size * smoothing

  // Our collected left and right points
  const leftPts: number[][] = []
  const rightPts: number[][] = []

  // Previous left and right points
  let pl = points[0].point
  let pr = pl

  // Temporary left and right points
  let tl = pl
  let tr = pl

  // Previous vector
  let pv = points[0].vector

  // Previous pressure
  let pp = 1

  // Whether the line is drawn far enough to calculate an initial vector
  let short = true

  // The current radius
  let radius = getStrokeRadius(size, thinning, easing, points[len - 1].pressure)

  /*
  Find the outline's left and right points

  Iterating through the points and populate the leftPts and rightPts arrays.
  Ignore the first and last points: these will get caps later on.
  */
  for (let i = 1; i < len - 1; i++) {
    const next = points[i + 1]

    let { point, pressure, vector, distance, runningLength } = points[i]

    if (short && runningLength > minDist) {
      short = false
    }

    /*
    Calculate the radius

    If not thinning, the current point's radius will be half the size; or
    otherwise, the size will be based on the current (real or simulated)
    pressure. 
    */

    if (thinning) {
      if (simulatePressure) {
        const rp = min(1, 1 - distance / size)
        const sp = min(1, distance / size)
        pressure = min(1, pp + (rp - pp) * (sp / 2))
      }

      radius = getStrokeRadius(size, thinning, easing, pressure)
    } else {
      radius = size / 2
    }

    /*
    Apply tapering

    If the current length is within the taper distance at either the
    start or the end, calculate the taper strengths. Apply the smaller 
    of the two taper strengths to the radius.
    */

    const ts =
      runningLength < taperStart
        ? taperStartCurve(runningLength / taperStart)
        : 1

    const te =
      totalLength - runningLength < taperEnd
        ? taperEndCurve((totalLength - runningLength) / taperEnd)
        : 1

    radius *= Math.min(ts, te)

    /*
    Handle sharp corners

    Find the difference (dot product) between the current and next vector.
    If the next vector is at more than a right angle to the current vector,
    draw a cap at the current point.
    */

    const dpr = vec.dpr(vector, next.vector)

    if (dpr < 0) {
      const offset = vec.mul(vec.per(pv), radius)
      const pushedA = vec.add(point, offset)
      const pushedB = vec.sub(point, offset)

      for (let t = 0; t <= 1; t += 0.3333) {
        tl = vec.rotAround(pushedA, point, PI * -t)
        tr = vec.rotAround(pushedB, point, PI * t)

        leftPts.push(tl)
        rightPts.push(tr)
      }

      pl = tl
      pr = tr

      continue
    }

    /* 
    Add regular points

    Project points to either side of the current point, using the
    calculated size as a distance. If a point's distance to the 
    previous point on that side greater than the minimum distance
    (or if the corner is kinda sharp), add the points to the side's
    points array.
    */

    const offset = vec.mul(vec.per(vector), radius)
    tl = vec.add(point, offset)
    tr = vec.sub(point, offset)

    const alwaysAdd = i === 1 || dpr < 0.25
    const minDistance = short ? minDist / 2 : minDist

    if (alwaysAdd || vec.dist(pl, tl) > minDistance) {
      leftPts.push(tl)
      pl = tl
    }

    if (alwaysAdd || vec.dist(pr, tr) > minDistance) {
      rightPts.push(tr)
      pr = tr
    }

    pp = pressure
    pv = vector
  }

  /*
  Draw start and end caps.
  */

  const startCap: number[][] = []
  const endCap: number[][] = []

  const firstPoint = points[0]
  const lastPoint = points[points.length - 1]
  const veryShort = leftPts.length < 2 || rightPts.length < 2
  const isTapering = taperStart + taperEnd > 0

  // Draw start cap if the end taper is set to zero

  if (veryShort) {
    if (!isTapering || (veryShort && last)) {
      // Draw a dot.

      // Find the initial radius.
      let ir = 0

      for (let i = 0; i < len - 1; i++) {
        const { pressure, runningLength } = points[i]
        if (runningLength > size) {
          ir = getStrokeRadius(size, thinning, easing, pressure)
          break
        }
      }

      // Draw an inverse cap for the end cap.
      const start = vec.sub(
        firstPoint.point,
        vec.mul(
          vec.per(vec.uni(vec.vec(lastPoint.point, firstPoint.point))),
          ir || radius
        )
      )

      for (let t = 0, step = 0.1; t <= 1; t += step) {
        startCap.push(vec.rotAround(start, firstPoint.point, PI * -t))
      }

      // Get rid of the first set of points on either side.
      leftPts.shift()
      rightPts.shift()
    }
  } else if (taperStart === 0) {
    // Draw a cap between second left / right points.
    const start = vec.add(
      firstPoint.point,
      vec.mul(
        vec.uni(vec.vec(leftPts[1], rightPts[1])),
        vec.dist(leftPts[1], rightPts[1]) / 2
      )
    )
    for (let t = 0, step = 0.1; t <= 1; t += step) {
      startCap.push(vec.rotAround(start, firstPoint.point, PI * -t))
    }
    leftPts.shift()
    rightPts.shift()
  } else if (points[1]) {
    startCap.push(points[1].point)
  }

  // Draw end cap if taper end is set to zero

  if (!isTapering || (taperEnd === 0 && !veryShort) || (veryShort && last)) {
    const start = vec.sub(
      lastPoint.point,
      vec.mul(vec.per(lastPoint.vector), radius)
    )
    for (let t = 0, step = 0.1; t <= 1; t += step) {
      endCap.push(vec.rotAround(start, lastPoint.point, PI * t))
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
