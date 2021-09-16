/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { getStrokeRadius } from './getStrokeRadius'
import type { StrokeOptions, StrokePoint } from './types'
import {
  add,
  dist,
  dist2,
  dpr,
  isEqual,
  lrp,
  med,
  mul,
  per,
  prj,
  rotAround,
  sub,
  uni,
} from './vec'

const RATE_OF_CHANGE = 0.3
const { min, PI } = Math

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
    size = 16,
    smoothing = 0.5,
    thinning = 0.5,
    simulatePressure = true,
    easing = (t) => t,
    start = {},
    end = {},
    last: isComplete = false,
  } = options

  let { streamline = 0.5 } = options

  const {
    cap: capStart = true,
    taper: taperStart = 0,
    easing: taperStartEase = (t) => t * (2 - t),
  } = start

  const {
    cap: capEnd = true,
    taper: taperEnd = 0,
    easing: taperEndEase = (t) => --t * t * t + 1,
  } = end

  // Halve the streaming property
  streamline /= 2

  // We can't do anything with an empty array.
  if (points.length === 0) return []

  // The total length of the line
  const totalLength = points.at(-1)!.runningLength

  // Our collected left and right points
  const leftPts: number[][] = []
  const rightPts: number[][] = []

  // Previous pressure (start with average of first five pressures,
  // in order to prevent fat starts for every line. Drawn lines
  // almost always start slow!
  let prevPressure = points.slice(0, 10).reduce((acc, curr) => {
    let pressure = curr.pressure

    if (simulatePressure) {
      // Speed of change - how fast should the the pressure changing?
      const sp = min(1, curr.distance / size)
      // Rate of change - how much of a change is there?
      const rp = min(1, 1 - sp)
      // Accelerate the pressure
      pressure = min(1, acc + (rp - acc) * (sp * RATE_OF_CHANGE))
    }

    return (acc + pressure) / 2
  }, points[0].pressure)

  // The current radius
  let radius = getStrokeRadius(
    size,
    thinning,
    points[points.length - 1].pressure,
    easing
  )

  // The radius of the first saved point
  let firstRadius: number | undefined = undefined

  // Previous vector
  let prevVector = points[0].vector

  // Previous left and right points
  let pl = points[0].point
  let pr = pl

  // Temporary left and right points
  let tl = pl
  let tr = pr

  let short = true

  /*
    Find the outline's left and right points

    Iterating through the points and populate the rightPts and leftPts arrays,
    skipping the first and last pointsm, which will get caps later on.
  */

  for (let i = 0; i < points.length - 1; i++) {
    let { pressure } = points[i]
    const { point, vector, distance, runningLength } = points[i]

    if (i > 0 && short && runningLength < size / 2) {
      continue
    } else if (short) {
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
        // If we're simulating pressure, then do so based on the distance
        // between the current point and the previous point, and the size
        // of the stroke. Otherwise, use the input pressure.
        const sp = min(1, distance / size)
        const rp = min(1, 1 - sp)
        pressure = min(
          1,
          prevPressure + (rp - prevPressure) * (sp * RATE_OF_CHANGE)
        )
      }

      radius = getStrokeRadius(size, thinning, pressure, easing)
    } else {
      radius = size / 2
    }

    if (firstRadius === undefined) {
      firstRadius = radius
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

    radius = Math.max(0.01, radius * Math.min(ts, te))

    /*
      Handle sharp corners

      Find the difference (dot product) between the current and next vector.
      If the next vector is at more than a right angle to the current vector,
      draw a cap at the current point.
    */

    const nextVector = points[i + 1].vector

    const nextDpr = dpr(vector, nextVector)

    if (nextDpr < 0) {
      const offset = mul(per(prevVector), radius)

      for (let t = 0; t < 1; t += 0.2) {
        tr = rotAround(add(point, offset), point, PI * -t)
        tl = rotAround(sub(point, offset), point, PI * t)

        rightPts.push(tr)
        leftPts.push(tl)
      }

      pl = tl
      pr = tr

      // Once we've drawn the cap, don't do any more work for this point.
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

    const offset = mul(per(lrp(nextVector, vector, nextDpr)), radius)

    tl = sub(point, offset)
    tr = add(point, offset)

    const alwaysAdd = i < 2 || nextDpr < 0.25

    const minDistance = Math.pow(
      Math.max((runningLength > size ? size : size / 2) * smoothing, 1),
      2
    )

    if (alwaysAdd || dist2(pl, tl) > minDistance) {
      leftPts.push(lrp(pl, tl, streamline))
      pl = tl
    }

    if (alwaysAdd || dist2(pr, tr) > minDistance) {
      rightPts.push(lrp(pr, tr, streamline))
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
  const lastPoint = points[points.length - 1]
  const isVeryShort = short || rightPts.length < 2 || leftPts.length < 2

  /* 
    Draw a dot for very short or completed strokes
    
    If the line is too short to gather left or right points and if the line is
    not tapered on either side, draw a dot. If the line is tapered, then only
    draw a dot if the line is both very short and complete. If we draw a dot,
    we can just return those points.
  */

  if (isVeryShort && (!(taperStart || taperEnd) || isComplete)) {
    let ir = 0

    for (let i = 0; i < points.length; i++) {
      const { pressure, runningLength } = points[i]
      if (runningLength > size) {
        ir = getStrokeRadius(size, thinning, pressure, easing)
        break
      }
    }

    const start = prj(
      firstPoint.point,
      per(uni(sub(firstPoint.point, lastPoint.point))),
      -(ir || radius)
    )

    const dotPts: number[][] = []

    for (let t = 0, step = 0.1; t <= 1; t += step) {
      dotPts.push(rotAround(start, firstPoint.point, PI * 2 * t))
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
  const endCap: number[][] = []

  if (leftPts.length > 1 && rightPts.length > 1) {
    tr = rightPts[1]

    for (let i = 1; i < leftPts.length; i++) {
      if (!isEqual(tr, leftPts[i])) {
        tl = leftPts[i]
        break
      }
    }

    if (capStart || taperStart) {
      if (!taperStart && !(taperEnd && isVeryShort)) {
        if (!isEqual(tr, tl)) {
          const start = prj(
            firstPoint.point,
            uni(sub(tl, tr)),
            -dist(tr, tl) / 2
          )
          for (let t = 0, step = 0.1; t <= 1; t += step) {
            const pt = rotAround(start, firstPoint.point, PI * t)
            if (dist(pt, tl) < 1) break
            startCap.push(pt)
          }
          leftPts.shift()
          rightPts.shift()
        }
      } else {
        startCap.push(firstPoint.point, add(firstPoint.point, [0.1, 0.1]))
      }
    } else {
      if (!isEqual(tr, tl)) {
        const vector = uni(sub(tl, tr))
        const ptDist = dist(tr, tl) / 2

        startCap.concat(
          prj(firstPoint.point, vector, ptDist * 0.95),
          prj(firstPoint.point, vector, ptDist),
          prj(firstPoint.point, vector, -ptDist),
          prj(firstPoint.point, vector, -ptDist * 0.95)
        )

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

    // The last left point
    const ll = leftPts.at(-1)!

    // The last right point
    const lr = rightPts.at(-1)!

    // The point between the two
    const mid = med(ll, lr)

    // The last provided point
    const last = lastPoint.point

    const direction = per(uni(sub(last, mid)))

    if (capEnd || taperEnd) {
      if (!taperEnd && !(taperStart && isVeryShort)) {
        // Draw the end cap
        const start = prj(last, direction, radius)
        for (let t = 0, step = 0.1; t <= 1; t += step) {
          const pt = rotAround(start, last, PI * 3 * t)
          // Don't go past the other point
          if (dist(pt, lr) < 1) break
          endCap.push(pt)
        }
      } else {
        // Just push the last point to the line
        endCap.push(last)
      }
    } else {
      // Add a few more points almost at the last point
      const justBefore = lrp(mid, last, 0.95)
      const r = radius * 0.95
      endCap.concat(
        prj(justBefore, direction, r),
        prj(last, direction, r),
        prj(last, direction, -r),
        prj(justBefore, direction, -r)
      )
    }
  }

  /*
    Return the points in the correct winding order: begin on the left side, then 
    continue around the end cap, then come back along the right side, and finally 
    complete the start cap.
  */

  return leftPts.concat(endCap, rightPts.reverse(), startCap)
}
