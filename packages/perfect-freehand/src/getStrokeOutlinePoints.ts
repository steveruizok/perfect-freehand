import {
  CORNER_CAP_SEGMENTS,
  END_CAP_SEGMENTS,
  END_NOISE_THRESHOLD,
  FIXED_PI,
  MIN_RADIUS,
  START_CAP_SEGMENTS,
} from './constants'
import { getStrokeRadius } from './getStrokeRadius'
import { simulatePressure } from './simulatePressure'
import type { StrokeOptions, StrokePoint, Vec2 } from './types'
import {
  add,
  addInto,
  dist2,
  dpr,
  lrpInto,
  mul,
  mulInto,
  neg,
  per,
  perInto,
  prj,
  rotAround,
  rotAroundInto,
  sub,
  subInto,
  uni,
} from './vec'

// Scratch buffers for allocation-free hot loop calculations
const _offset: Vec2 = [0, 0]
const _tl: Vec2 = [0, 0]
const _tr: Vec2 = [0, 0]

/**
 * Draw a dot (circle) for very short strokes.
 */
function drawDot(center: Vec2, radius: number): Vec2[] {
  const offsetPoint = add(center, [1, 1])
  const start = prj(center, uni(per(sub(center, offsetPoint))), -radius)
  const dotPts: Vec2[] = []
  const step = 1 / START_CAP_SEGMENTS
  for (let t = step; t <= 1; t += step) {
    dotPts.push(rotAround(start, center, FIXED_PI * 2 * t))
  }
  return dotPts
}

/**
 * Draw a rounded start cap by rotating points from right to left around the start point.
 */
function drawRoundStartCap(
  center: Vec2,
  rightPoint: Vec2,
  segments: number
): Vec2[] {
  const cap: Vec2[] = []
  const step = 1 / segments
  for (let t = step; t <= 1; t += step) {
    cap.push(rotAround(rightPoint, center, FIXED_PI * t))
  }
  return cap
}

/**
 * Draw a flat start cap with squared-off edges.
 */
function drawFlatStartCap(
  center: Vec2,
  leftPoint: Vec2,
  rightPoint: Vec2
): Vec2[] {
  const cornersVector = sub(leftPoint, rightPoint)
  const offsetA = mul(cornersVector, 0.5)
  const offsetB = mul(cornersVector, 0.51)
  return [
    sub(center, offsetA),
    sub(center, offsetB),
    add(center, offsetB),
    add(center, offsetA),
  ]
}

/**
 * Draw a rounded end cap (1.5 turns to handle sharp end turns correctly).
 */
function drawRoundEndCap(
  center: Vec2,
  direction: Vec2,
  radius: number,
  segments: number
): Vec2[] {
  const cap: Vec2[] = []
  const start = prj(center, direction, radius)
  const step = 1 / segments
  for (let t = step; t < 1; t += step) {
    cap.push(rotAround(start, center, FIXED_PI * 3 * t))
  }
  return cap
}

/**
 * Draw a flat end cap with squared-off edges.
 */
function drawFlatEndCap(center: Vec2, direction: Vec2, radius: number): Vec2[] {
  return [
    add(center, mul(direction, radius)),
    add(center, mul(direction, radius * 0.99)),
    sub(center, mul(direction, radius * 0.99)),
    sub(center, mul(direction, radius)),
  ]
}

/**
 * Compute the taper distance from a taper option value.
 * - false or undefined: no taper (0)
 * - true: taper the full length (max of size and totalLength)
 * - number: use that exact taper distance
 */
function computeTaperDistance(
  taper: boolean | number | undefined,
  size: number,
  totalLength: number
): number {
  if (taper === false || taper === undefined) return 0
  if (taper === true) return Math.max(size, totalLength)
  return taper
}

/**
 * Compute the initial pressure by averaging the first few points.
 * This prevents "fat starts" since drawn lines almost always start slow.
 */
function computeInitialPressure(
  points: StrokePoint[],
  shouldSimulatePressure: boolean,
  size: number
): number {
  return points.slice(0, 10).reduce((acc, curr) => {
    let pressure = curr.pressure
    if (shouldSimulatePressure) {
      pressure = simulatePressure(acc, curr.distance, size)
    }
    return (acc + pressure) / 2
  }, points[0].pressure)
}

/**
 * ## getStrokeOutlinePoints
 * @description Get an array of points (as `[x, y]`) representing the outline of a stroke.
 * @param points An array of StrokePoints as returned from `getStrokePoints`.
 * @param options (optional) An object with options.
 * @param options.size	The base size (diameter) of the stroke.
 * @param options.thinning The effect of pressure on the stroke's size.
 * @param options.smoothing	How much to soften the stroke's edges.
 * @param options.easing	An easing function to apply to each point's pressure.
 * @param options.simulatePressure Whether to simulate pressure based on velocity.
 * @param options.start Cap, taper and easing for the start of the line.
 * @param options.end Cap, taper and easing for the end of the line.
 * @param options.last Whether to handle the points as a completed stroke.
 */
export function getStrokeOutlinePoints(
  points: StrokePoint[],
  options: Partial<StrokeOptions> = {} as Partial<StrokeOptions>
): Vec2[] {
  const {
    size = 16,
    smoothing = 0.5,
    thinning = 0.5,
    simulatePressure: shouldSimulatePressure = true,
    easing = (t) => t,
    start = {},
    end = {},
    last: isComplete = false,
  } = options

  const { cap: capStart = true, easing: taperStartEase = (t) => t * (2 - t) } =
    start

  const { cap: capEnd = true, easing: taperEndEase = (t) => --t * t * t + 1 } =
    end

  // We can't do anything with an empty array or a stroke with negative size.
  if (points.length === 0 || size <= 0) {
    return []
  }

  // The total length of the line
  const totalLength = points[points.length - 1].runningLength

  const taperStart = computeTaperDistance(start.taper, size, totalLength)
  const taperEnd = computeTaperDistance(end.taper, size, totalLength)

  // The minimum allowed distance between points (squared)
  const minDistance = Math.pow(size * smoothing, 2)

  // Our collected left and right points
  const leftPts: Vec2[] = []
  const rightPts: Vec2[] = []

  // Previous pressure (averaged from first few points to prevent fat starts)
  let prevPressure = computeInitialPressure(
    points,
    shouldSimulatePressure,
    size
  )

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
  let prevLeftPoint = points[0].point
  let prevRightPoint = prevLeftPoint

  // Temporary left and right points
  let tempLeftPoint: Vec2 = prevLeftPoint
  let tempRightPoint: Vec2 = prevRightPoint

  // Keep track of whether the previous point is a sharp corner
  // ... so that we don't detect the same corner twice
  let isPrevPointSharpCorner = false

  /*
    Find the outline's left and right points

    Iterating through the points and populate the rightPts and leftPts arrays,
    skipping the first and last pointsm, which will get caps later on.
  */

  for (let i = 0; i < points.length; i++) {
    let { pressure } = points[i]
    const { point, vector, distance, runningLength } = points[i]
    const isLastPoint = i === points.length - 1

    // Removes noise from the end of the line
    if (!isLastPoint && totalLength - runningLength < END_NOISE_THRESHOLD) {
      continue
    }

    /*
      Calculate the radius

      If not thinning, the current point's radius will be half the size; or
      otherwise, the size will be based on the current (real or simulated)
      pressure.
    */

    if (thinning) {
      if (shouldSimulatePressure) {
        // If we're simulating pressure, then do so based on the distance
        // between the current point and the previous point, and the size
        // of the stroke. Otherwise, use the input pressure.
        pressure = simulatePressure(prevPressure, distance, size)
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

    const taperStartStrength =
      runningLength < taperStart
        ? taperStartEase(runningLength / taperStart)
        : 1

    const taperEndStrength =
      totalLength - runningLength < taperEnd
        ? taperEndEase((totalLength - runningLength) / taperEnd)
        : 1

    radius = Math.max(
      MIN_RADIUS,
      radius * Math.min(taperStartStrength, taperEndStrength)
    )

    /* Add points to left and right */

    /*
      Handle sharp corners

      Find the difference (dot product) between the current and next vector.
      If the next vector is at more than a right angle to the current vector,
      draw a cap at the current point.
    */

    const nextVector = (!isLastPoint ? points[i + 1] : points[i]).vector
    const nextDpr = !isLastPoint ? dpr(vector, nextVector) : 1.0
    const prevDpr = dpr(vector, prevVector)

    const isPointSharpCorner = prevDpr < 0 && !isPrevPointSharpCorner
    const isNextPointSharpCorner = nextDpr !== null && nextDpr < 0

    if (isPointSharpCorner || isNextPointSharpCorner) {
      // It's a sharp corner. Draw a rounded cap and move on to the next point
      // Considering saving these and drawing them later? So that we can avoid
      // crossing future points.

      // Use mutable operations for the offset calculation
      perInto(_offset, prevVector)
      mulInto(_offset, _offset, radius)

      const step = 1 / CORNER_CAP_SEGMENTS
      for (let t = 0; t <= 1; t += step) {
        // Calculate left point: rotate (point - offset) around point
        subInto(_tl, point, _offset)
        rotAroundInto(_tl, _tl, point, FIXED_PI * t)
        tempLeftPoint = [_tl[0], _tl[1]]
        leftPts.push(tempLeftPoint)

        // Calculate right point: rotate (point + offset) around point
        addInto(_tr, point, _offset)
        rotAroundInto(_tr, _tr, point, FIXED_PI * -t)
        tempRightPoint = [_tr[0], _tr[1]]
        rightPts.push(tempRightPoint)
      }

      prevLeftPoint = tempLeftPoint
      prevRightPoint = tempRightPoint

      if (isNextPointSharpCorner) {
        isPrevPointSharpCorner = true
      }
      continue
    }

    isPrevPointSharpCorner = false

    // Handle the last point
    if (isLastPoint) {
      perInto(_offset, vector)
      mulInto(_offset, _offset, radius)
      leftPts.push(sub(point, _offset))
      rightPts.push(add(point, _offset))
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

    // Use mutable operations for offset calculation
    lrpInto(_offset, nextVector, vector, nextDpr)
    perInto(_offset, _offset)
    mulInto(_offset, _offset, radius)

    subInto(_tl, point, _offset)
    tempLeftPoint = [_tl[0], _tl[1]]

    if (i <= 1 || dist2(prevLeftPoint, tempLeftPoint) > minDistance) {
      leftPts.push(tempLeftPoint)
      prevLeftPoint = tempLeftPoint
    }

    addInto(_tr, point, _offset)
    tempRightPoint = [_tr[0], _tr[1]]

    if (i <= 1 || dist2(prevRightPoint, tempRightPoint) > minDistance) {
      rightPts.push(tempRightPoint)
      prevRightPoint = tempRightPoint
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

  const firstPoint: Vec2 = [points[0].point[0], points[0].point[1]]

  const lastPoint: Vec2 =
    points.length > 1
      ? [points[points.length - 1].point[0], points[points.length - 1].point[1]]
      : add(points[0].point, [1, 1])

  const startCap: Vec2[] = []

  const endCap: Vec2[] = []

  // Draw a dot for very short or completed strokes
  if (points.length === 1) {
    if (!(taperStart || taperEnd) || isComplete) {
      return drawDot(firstPoint, firstRadius || radius)
    }
  } else {
    // Draw start cap (unless tapered)
    if (taperStart || (taperEnd && points.length === 1)) {
      // The start point is tapered, noop
    } else if (capStart) {
      startCap.push(
        ...drawRoundStartCap(firstPoint, rightPts[0], START_CAP_SEGMENTS)
      )
    } else {
      startCap.push(...drawFlatStartCap(firstPoint, leftPts[0], rightPts[0]))
    }

    // Draw end cap (unless tapered)
    const direction = per(neg(points[points.length - 1].vector))

    if (taperEnd || (taperStart && points.length === 1)) {
      // Tapered end - push the last point to the line
      endCap.push(lastPoint)
    } else if (capEnd) {
      endCap.push(
        ...drawRoundEndCap(lastPoint, direction, radius, END_CAP_SEGMENTS)
      )
    } else {
      endCap.push(...drawFlatEndCap(lastPoint, direction, radius))
    }
  }

  /*
    Return the points in the correct winding order: begin on the left side, then
    continue around the end cap, then come back along the right side, and finally
    complete the start cap.
  */

  return leftPts.concat(endCap, rightPts.reverse(), startCap)
}
