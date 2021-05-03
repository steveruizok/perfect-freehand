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
  const len = pts.length

  if (len === 0) return []

  if (len === 1) pts.push(vec.add(pts[0], [1, 0]))

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
  }

  /*
    Align vectors at the start of the line
    
    Find the first stroke point past the size and then set all preceding points' 
    vectors to match this point's vector. This aligns the start cap and reduces
    noise at the start of the line.
  */
  for (let i = 0; i < len; i++) {
    const { runningLength, vector } = strokePoints[i]
    if (runningLength > size || i === len - 1) {
      for (let j = 0; j < i; j++) {
        strokePoints[j].vector = vector
      }
      break
    }
  }

  /* 
    Align vectors at the end of the line

    Starting from the last point, work back until we've traveled more than
    half of the line's size (width). Take the current point's vector and then
    work forward, setting all remaining points' vectors to this vector. This
    removes the "noise" at the end of the line and allows for a better-facing
    end cap.
  */
  const totalLength = strokePoints[len - 1].runningLength

  for (let i = len - 1; i > 1; i--) {
    const { runningLength, vector } = strokePoints[i]
    if (totalLength - runningLength > size / 2) {
      for (let j = i; j < len; j++) {
        strokePoints[j].vector = vector
      }
      break
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
    last: isComplete = false,
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

  // The current radius
  let radius = getStrokeRadius(size, thinning, easing, points[len - 1].pressure)

  /*
    Find the outline's left and right points

   Iterating through the points and populate the leftPts and rightPts arrays,
   skipping the first and last pointsm, which will get caps later on.
  */

  for (let i = 1; i < len - 1; i++) {
    let { point, pressure, vector, distance, runningLength } = points[i]

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

    const nextVector = points[i + 1].vector

    const dpr = vec.dpr(vector, nextVector)

    if (dpr < 0) {
      const offset = vec.mul(vec.per(pv), radius)
      const la = vec.add(point, offset)
      const ra = vec.sub(point, offset)

      for (let t = 0.2; t < 1; t += 0.2) {
        tl = vec.rotAround(la, point, PI * -t)
        tr = vec.rotAround(ra, point, PI * t)

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

    const offset = vec.mul(vec.per(vec.lrp(nextVector, vector, dpr)), radius)

    tl = vec.add(point, offset)
    tr = vec.sub(point, offset)

    const tlu = vec.uni(vec.vec(tl, pl))
    const tru = vec.uni(vec.vec(tr, pr))

    const alwaysAdd = i === 1 || dpr < 0.25
    const minDistance = (runningLength > size ? size : size / 2) * smoothing

    if (
      alwaysAdd ||
      (vec.dist(pl, tl) > minDistance && vec.dpr(tlu, vector) > 0)
    ) {
      leftPts.push(tl)
      pl = tl
    }

    if (
      alwaysAdd ||
      (vec.dist(pr, tr) > minDistance && vec.dpr(tru, vector) > 0)
    ) {
      rightPts.push(tr)
      pr = tr
    }

    // Set variables for next iteration

    pp = pressure
    pv = vector
  }

  const firstPoint = points[0]
  const lastPoint = points[points.length - 1]

  const isVeryShort = leftPts.length < 2 || rightPts.length < 2
  const isTapering = taperStart + taperEnd > 0

  /* 
    Draw a dot for very short or completed strokes
    
    If the line is too short to gather left or right points, then draw
    a dot if either: the line is complete; or the line has no tapering.
  */

  if (isVeryShort && (!isTapering || isComplete)) {
    let ir = 0

    for (let i = 0; i < len - 1; i++) {
      const { pressure, runningLength } = points[i]
      if (runningLength > size) {
        ir = getStrokeRadius(size, thinning, easing, pressure)
        break
      }
    }

    const start = vec.sub(
      firstPoint.point,
      vec.mul(
        vec.per(vec.uni(vec.vec(lastPoint.point, firstPoint.point))),
        ir || radius
      )
    )

    const dotPts: number[][] = []

    for (let t = 0, step = 0.1; t <= 1; t += step) {
      dotPts.push(vec.rotAround(start, firstPoint.point, PI * 2 * t))
    }

    return dotPts
  }

  /*
    Draw a start cap

    Unless the line has a tapered start, draw a start cap around the first point,
    using the distance between the second left and right point for the cap's 
    radius, and finally remove the first left and right points. :psyduck:
  */

  const startCap: number[][] = []

  if (taperStart === 0) {
    tl = leftPts[1]
    tr = rightPts[1]

    const start = vec.add(
      firstPoint.point,
      vec.mul(vec.uni(vec.vec(tl, tr)), vec.dist(tl, tr) / 2)
    )

    for (let t = 0, step = 0.2; t <= 1; t += step) {
      startCap.push(vec.rotAround(start, firstPoint.point, PI * -t))
    }

    leftPts.shift()
    rightPts.shift()
  }

  /*
    Draw an end cap

    If the line does not have a tapered end, and unless the line has a tapered
    start and the line is very short, draw a cap around the last point. 

  */

  const endCap: number[][] = []

  if (taperEnd === 0 && !(taperStart > 0 && isVeryShort)) {
    const start = vec.sub(
      lastPoint.point,
      vec.mul(vec.per(lastPoint.vector), radius)
    )
    for (let t = 0, step = 0.1; t <= 1; t += step) {
      endCap.push(vec.rotAround(start, lastPoint.point, PI * 3 * t))
    }
    leftPts.pop()
    rightPts.pop()
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
