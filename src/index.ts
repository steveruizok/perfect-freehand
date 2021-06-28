import { toPointsArray, getStrokeRadius } from './utils'
import { StrokeOptions, StrokePoint } from './types'
import * as vec from './vec'

const { min, PI } = Math

/**
 * ## getStrokePoints
 * @description Get points for a stroke.
 * @param points An array of points (as `[x, y, pressure]` or `{x, y, pressure}`). Pressure is optional.
 * @param streamline How much to streamline the stroke.
 * @param size The stroke's size.
 */
export function getStrokePoints<
  T extends number[],
  K extends { x: number; y: number; pressure?: number }
>(points: (T | K)[], options = {} as StrokeOptions): StrokePoint[] {
  let { simulatePressure = true, streamline = 0.5, size = 8 } = options

  streamline /= 2

  if (!simulatePressure) {
    streamline /= 2
  }

  const pts = toPointsArray(points)

  let len = pts.length

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
    let i = 1, j = 0, curr = pts[i], prev = strokePoints[j];
    i < len;
    i++, curr = pts[i], prev = strokePoints[j]
  ) {
    const point = vec.lrp(prev.point, curr, 1 - streamline)

    if (vec.isEqual(prev.point, point)) continue

    const pressure = curr[2]
    const vector = vec.uni(vec.vec(point, prev.point))
    const distance = vec.dist(point, prev.point)
    const runningLength = prev.runningLength + distance

    strokePoints.push({
      point,
      pressure,
      vector,
      distance,
      runningLength,
    })

    j += 1 // only increment j if we add an item to strokePoints
  }

  /* 
    Align vectors at the end of the line

    Starting from the last point, work back until we've traveled more than
    half of the line's size (width). Take the current point's vector and then
    work forward, setting all remaining points' vectors to this vector. This
    removes the "noise" at the end of the line and allows for a better-facing
    end cap.
  */

  // Update the length to the length of the strokePoints array.
  len = strokePoints.length

  const totalLength = strokePoints[len - 1].runningLength

  for (let i = len - 2; i > 1; i--) {
    const { runningLength, vector } = strokePoints[i]
    const dpr = vec.dpr(strokePoints[i - 1].vector, strokePoints[i].vector)
    if (totalLength - runningLength > size / 2 || dpr < 0.8) {
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
 * @param options.start Tapering and easing function for the start of the line.
 * @param options.end Tapering and easing function for the end of the line.
 * @param options.last Whether to handle the points as a completed stroke.
 */
export function getStrokeOutlinePoints(
  points: StrokePoint[],
  options: Partial<StrokeOptions> = {} as Partial<StrokeOptions>
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

  let { streamline = 0.5 } = options

  streamline /= 2

  const {
    taper: taperStart = 0,
    easing: taperStartEase = t => t * (2 - t),
  } = start

  const {
    taper: taperEnd = 0,
    easing: taperEndEase = t => --t * t * t + 1,
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

  // Previous pressure (start with average of first five pressures)
  let prevPressure = points
    .slice(0, 5)
    .reduce((acc, cur) => (acc + cur.pressure) / 2, points[0].pressure)

  // The current radius
  let radius = getStrokeRadius(size, thinning, easing, points[len - 1].pressure)

  // Previous vector
  let prevVector = points[0].vector

  // Previous left and right points
  let pl = points[0].point
  let pr = pl

  // Temporary left and right points
  let tl = pl
  let tr = pr

  /*
    Find the outline's left and right points

   Iterating through the points and populate the rightPts and leftPts arrays,
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
        pressure = min(1, prevPressure + (rp - prevPressure) * (sp / 2))
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
        ? taperStartEase(runningLength / taperStart)
        : 1

    const te =
      totalLength - runningLength < taperEnd
        ? taperEndEase((totalLength - runningLength) / taperEnd)
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
      const offset = vec.mul(vec.per(prevVector), radius)

      for (let t = 0; t < 1; t += 0.2) {
        tr = vec.rotAround(vec.add(point, offset), point, PI * -t)
        tl = vec.rotAround(vec.sub(point, offset), point, PI * t)

        rightPts.push(tr)
        leftPts.push(tl)
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

    tl = vec.sub(point, offset)
    tr = vec.add(point, offset)

    const alwaysAdd = i === 1 || dpr < 0.25
    const minDistance = Math.pow(
      (runningLength > size ? size : size / 2) * smoothing,
      2
    )

    if (alwaysAdd || vec.dist2(pl, tl) > minDistance) {
      leftPts.push(vec.lrp(pl, tl, streamline))
      pl = tl
    }

    if (alwaysAdd || vec.dist2(pr, tr) > minDistance) {
      rightPts.push(vec.lrp(pr, tr, streamline))
      pr = tr
    }

    // Set variables for next iteration

    prevPressure = pressure
    prevVector = vector
  }

  /*
    Drawing caps
    
    Now that we have our points on either side of the line, we need to
    draw caps at the start and end. Tapered lines don't have caps, but
    may have dots for very short lines.
  */

  const firstPoint = points[0]
  const lastPoint = points[len - 1]
  const isVeryShort = rightPts.length < 2 || leftPts.length < 2

  /* 
    Draw a dot for very short or completed strokes
    
    If the line is too short to gather left or right points and if the line is
    not tapered on either side, draw a dot. If the line is tapered, then only
    draw a dot if the line is both very short and complete. If we draw a dot,
    we can just return those points.
  */

  if (isVeryShort && (!(taperStart || taperEnd) || isComplete)) {
    let ir = 0

    for (let i = 0; i < len; i++) {
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

    Unless the line has a tapered start, or unless the line has a tapered end
    and the line is very short, draw a start cap around the first point. Use
    the distance between the second left and right point for the cap's radius.
    Finally remove the first left and right points. :psyduck:
  */

  const startCap: number[][] = []

  if (!taperStart && !(taperEnd && isVeryShort)) {
    tr = rightPts[1]

    for (let i = 1; i < leftPts.length; i++) {
      if (!vec.isEqual(tr, leftPts[i])) {
        tl = leftPts[i]
        break
      }
    }

    if (!vec.isEqual(tr, tl)) {
      const start = vec.sub(
        firstPoint.point,
        vec.mul(vec.uni(vec.vec(tr, tl)), vec.dist(tr, tl) / 2)
      )

      for (let t = 0, step = 0.2; t <= 1; t += step) {
        startCap.push(vec.rotAround(start, firstPoint.point, PI * t))
      }

      leftPts.shift()
      rightPts.shift()
    }
  }

  /*
    Draw an end cap

    If the line does not have a tapered end, and unless the line has a tapered
    start and the line is very short, draw a cap around the last point. Finally, 
    remove the last left and right points. Otherwise, add the last point. Note
    that This cap is a full-turn-and-a-half: this prevents incorrect caps on 
    sharp end turns.
  */

  const endCap: number[][] = []

  if (!taperEnd && !(taperStart && isVeryShort)) {
    const start = vec.sub(
      lastPoint.point,
      vec.mul(vec.per(lastPoint.vector), radius)
    )

    for (let t = 0, step = 0.1; t <= 1; t += step) {
      endCap.push(vec.rotAround(start, lastPoint.point, PI * 3 * t))
    }
  } else {
    endCap.push(lastPoint.point)
  }

  /*
    Return the points in the correct windind order: begin on the left side, then 
    continue around the end cap, then come back along the right side, and finally 
    complete the start cap.
  */

  return leftPts.concat(endCap, rightPts.reverse(), startCap)
}

/**
 * ## getStroke
 * @description Returns a stroke as an array of outline points.
 * @param points An array of points (as `[x, y, pressure]` or `{x, y, pressure}`). Pressure is optional.
 * @param options An (optional) object with options.
 * @param options.size	The base size (diameter) of the stroke.
 * @param options.thinning The effect of pressure on the stroke's size.
 * @param options.smoothing	How much to soften the stroke's edges.
 * @param options.easing	An easing function to apply to each point's pressure.
 * @param options.simulatePressure Whether to simulate pressure based on velocity.
 * @param options.start Tapering and easing function for the start of the line.
 * @param options.end Tapering and easing function for the end of the line.
 * @param options.last Whether to handle the points as a completed stroke.
 */
export default function getStroke<
  T extends number[],
  K extends { x: number; y: number; pressure?: number }
>(points: (T | K)[], options: StrokeOptions = {} as StrokeOptions): number[][] {
  return getStrokeOutlinePoints(getStrokePoints(points, options), options)
}

export { StrokeOptions }
