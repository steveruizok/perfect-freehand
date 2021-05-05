import { toPointsArray, clamp, lerp } from './utils'
import { SpacedPoint, SplinePoint, StrokeOptions } from './types'
import * as vec from './vec'

export class FreehandSpline {
  inputPoints: number[][]
  looped: boolean

  lengths: number[] = []
  length: number = 0
  points: SplinePoint[] = []
  spacedPoints: SpacedPoint[] = []

  size: number
  thinning: number
  smoothing: number
  streamline: number
  easing: (pressure: number) => number
  simulatePressure: boolean
  start: {
    taper: number
    easing: (distance: number) => number
  }
  end: {
    taper: number
    easing: (distance: number) => number
  }
  isComplete: boolean

  constructor(
    points: (number[] | { x: number; y: number; pressure?: number })[],
    options = {} as StrokeOptions,
    looped = false
  ) {
    const {
      size = 8,
      thinning = 0.5,
      smoothing = 0.5,
      streamline = 0.5,
      simulatePressure = true,
      easing = t => t,
      start = {},
      end = {},
      isComplete = false,
    } = options

    const {
      taper: taperStart = 0,
      easing: taperStartCurve = t => t * (2 - t),
    } = start

    const {
      taper: taperEnd = 0,
      easing: taperEndCurve = t => --t * t * t + 1,
    } = end

    this.size = size
    this.thinning = thinning
    this.smoothing = smoothing
    this.streamline = streamline / 2
    this.simulatePressure = simulatePressure
    this.easing = easing
    this.start = { taper: taperStart, easing: taperStartCurve }
    this.end = { taper: taperEnd, easing: taperEndCurve }
    this.isComplete = isComplete
    this.looped = looped
    this.inputPoints = toPointsArray(points)
    this.updatePoints()
  }

  updatePoints() {
    const { streamline, size } = this

    let p0 = this.inputPoints[0],
      p1: number[]

    const streamlined = this.inputPoints.reduce(
      (acc, cur) => {
        p1 = vec.lrp(p0, cur, 1 - streamline)
        if (!vec.isEqual(p0, p1)) {
          acc.push(p1)
          p0 = p1
        }
        return acc
      },
      [p0]
    )

    const len = streamlined.length
    let lengths: number[] = []
    let runningLength = 0
    let vector: number[]
    const points: SplinePoint[] = []
    let pressure = 0
    let prevPressure = 0.5

    for (let i = 0; i < len; i++) {
      p0 = streamlined[i]
      p1 = streamlined[i + 1]

      if (p1) {
        length = vec.dist(p0, p1)
        lengths.push(length)
        runningLength += length
        vector = vec.div(vec.vec(p0, p1), length)
      } else {
        length = 0
        vector = [0, 0]
      }

      if (this.thinning) {
        if (this.simulatePressure) {
          const rp = Math.min(1, 1 - length / this.size)
          const sp = Math.min(1, length / size)
          pressure = Math.min(1, prevPressure + (rp - prevPressure) * (sp / 2))
          prevPressure = pressure
        }
      } else {
        pressure = p0[2]
      }

      points.push({
        point: p0,
        pressure,
        length,
        vector,
        runningLength,
      })
    }

    /* 
    Align vectors at the end of the line
    Starting from the last point, work back until we've traveled more than
    half of the line's size (width). Take the current point's vector and then
    work forward, setting all remaining points' vectors to this vector. This
    removes the "noise" at the end of the line and allows for a better-facing
    end cap.
  */

    const totalLength = points[len - 1].runningLength

    for (let i = len - 2; i > 1; i--) {
      const { runningLength, vector } = points[i]
      if (
        totalLength - runningLength > size / 2 ||
        vec.dpr(points[i - 1].vector, points[i].vector) < 0.8
      ) {
        for (let j = i; j < len; j++) {
          points[j].vector = vector
        }
        break
      }
    }

    this.points = points
    this.lengths = lengths
    this.length = runningLength

    if (points.length < 3) {
      this.spacedPoints = []
      return
    }

    const spacedPoints: SpacedPoint[] = []

    let error = 0
    let traveled = 0
    let point: number[]
    let gradient: number[]

    // Get evenly spaced points along the center spline
    for (let i = 0; i < len - 1; i++) {
      // distance to next point
      const length = lengths[i]

      // distance traveled
      let trav = error

      while (trav <= length) {
        point = this.getSplinePoint(i + trav / length)
        gradient = vec.uni(this.getSplinePointGradient(i + trav / length))
        spacedPoints.push({
          point,
          gradient,
          pressure: point[2],
          runningLength: traveled + trav,
        })
        trav += size / 4
      }

      error = trav - length
      traveled += length
    }

    // For the last gradient, average the previous three points
    const lastPoint = this.getSplinePoint(len - 1)

    spacedPoints.push({
      point: lastPoint,
      pressure: lastPoint[2],
      gradient: spacedPoints
        .slice(-3)
        .reduce(
          (acc, cur) => (acc ? vec.med(acc, cur.gradient) : cur.gradient),
          vec.uni(this.getSplinePointGradient(len - 1))
        ),
      runningLength: this.length,
    })

    this.spacedPoints = spacedPoints
  }

  getOutlineShape() {
    const {
      spacedPoints,
      streamline,
      size,
      smoothing,
      points,
      start,
      end,
      isComplete,
    } = this

    const len = points.length

    if (len < 2) return this.inputPoints

    const leftSpline: number[][] = []
    const rightSpline: number[][] = []

    let pl: number[] | undefined
    let pr: number[] | undefined
    let tl: number[] | undefined
    let tr: number[] | undefined
    let dpr = 1
    let pResult = spacedPoints[0]

    let radius = this.getStrokeRadius(points[len - 1].pressure)

    for (let i = 0; i < spacedPoints.length - 1; i++) {
      const { point, pressure, gradient, runningLength } = spacedPoints[i]

      /*
      Apply tapering
      If the current length is within the taper distance at either the
      start or the end, calculate the taper strengths. Apply the smaller 
      of the two taper strengths to the radius.
    */

      const ts =
        runningLength < start.taper
          ? start.easing(runningLength / start.taper)
          : 1

      const te =
        this.length - runningLength < end.taper
          ? end.easing((this.length - runningLength) / end.taper)
          : 1

      radius = this.getStrokeRadius(pressure) * Math.min(ts, te)

      // Sharp corners

      dpr = vec.dpr(gradient, spacedPoints[i + 1].gradient)

      if (dpr < 0) {
        const { gradient: pg } = spacedPoints[i + 1]

        const v = vec.mul(vec.per(vec.neg(pg)), radius)
        const l1 = vec.sub(point, v)
        const r1 = vec.add(point, v)

        for (let t = 0.2; t < 1; t += 0.2) {
          tl = vec.rotAround(l1, point, Math.PI * -t)
          tr = vec.rotAround(r1, point, Math.PI * t)

          leftSpline.push(tl)
          rightSpline.push(tr)
        }

        pl = tl
        pr = tr

        continue
      }

      // Regular points

      let addLeft = false
      let addRight = false

      const offset = vec.mul(
        vec.per(vec.lrp(gradient, spacedPoints[i + 1].gradient, dpr)),
        radius
      )

      tl = vec.sub(point, offset)
      tr = vec.add(point, offset)

      const alwaysAdd = i === 1 // || dpr < 0.25
      const minDistance = (runningLength > size ? size : size / 2) * smoothing

      if (alwaysAdd || !pl || vec.dist(pl, tl) > minDistance) {
        addLeft = true
      }

      if (alwaysAdd || !pr || vec.dist(pr, tr) > minDistance) {
        addRight = true
      }

      if (addLeft) {
        leftSpline.push(pl ? vec.lrp(pl, tl, streamline) : tl)
        pl = tl
      }

      if (addRight) {
        rightSpline.push(pr ? vec.lrp(pr, tr, streamline) : tr)
        pr = tr
      }

      if (addLeft || addRight) {
        pResult = spacedPoints[i]
      }
    }

    const firstPoint = points[0]
    const lastPoint = points[points.length - 1]

    const isVeryShort = leftSpline.length < 2 || rightSpline.length < 2

    /* 
      Draw a dot for very short or completed strokes
      
      If the line is too short to gather left or right points and if the line is
      not tapered on either side, draw a dot. If the line is tapered, then only
      draw a dot if the line is both very short and complete. If we draw a dot,
      we can just return those points.
    */

    if (isVeryShort && (!(start.taper || end.taper) || isComplete)) {
      let ir = 0

      for (let i = 0; i < spacedPoints.length; i++) {
        const { pressure, runningLength } = spacedPoints[i]
        if (runningLength > size) {
          ir = this.getStrokeRadius(pressure)
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
        dotPts.push(vec.rotAround(start, firstPoint.point, Math.PI * 2 * t))
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

    if (!start.taper && !(end.taper && isVeryShort)) {
      tr = leftSpline[1]
      tl = rightSpline[1]

      radius = vec.dist(tl, tr) / 2

      const start = vec.sub(
        firstPoint.point,
        vec.mul(vec.uni(vec.vec(tl, tr)), radius)
      )

      for (let t = 0, step = 0.2; t <= 1; t += step) {
        startCap.push(vec.rotAround(start, firstPoint.point, Math.PI * -t))
      }

      leftSpline.shift()
      rightSpline.shift()
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

    if (!end.taper && !(start.taper && isVeryShort)) {
      const start = vec.sub(
        lastPoint.point,
        vec.mul(
          vec.per(pResult.gradient),
          this.getStrokeRadius(pResult.pressure)
        )
      )

      for (let t = 0; t <= 1; t += 0.2) {
        endCap.push(vec.rotAround(start, lastPoint.point, Math.PI * -t))
      }
    } else {
      endCap.push(lastPoint.point)
    }

    /*
      Return the points in the correct windind order: begin on the left side, then 
      continue around the end cap, then come back along the right side, and finally 
      complete the start cap.
    */

    return leftSpline.concat(endCap, rightSpline.reverse(), startCap)
  }

  getSplinePoint(index: number): number[] {
    const { points, looped } = this

    let p0: number,
      p1: number,
      p2: number,
      p3: number,
      l = points.length,
      d = Math.trunc(index),
      t = index - d

    if (looped) {
      p1 = d
      p2 = (p1 + 1) % l
      p3 = (p2 + 1) % l
      p0 = p1 >= 1 ? p1 - 1 : l - 1
    } else {
      p1 = Math.min(d + 1, l - 1)
      p2 = Math.min(p1 + 1, l - 1)
      p3 = Math.min(p2 + 1, l - 1)
      p0 = p1 - 1
    }

    let tt = t * t,
      ttt = tt * t,
      q1 = -ttt + 2 * tt - t,
      q2 = 3 * ttt - 5 * tt + 2,
      q3 = -3 * ttt + 4 * tt + t,
      q4 = ttt - tt

    return [
      0.5 *
        (points[p0].point[0] * q1 +
          points[p1].point[0] * q2 +
          points[p2].point[0] * q3 +
          points[p3].point[0] * q4),
      0.5 *
        (points[p0].point[1] * q1 +
          points[p1].point[1] * q2 +
          points[p2].point[1] * q3 +
          points[p3].point[1] * q4),
      0.5 *
        (points[p0].pressure * q1 +
          points[p1].pressure * q2 +
          points[p2].pressure * q3 +
          points[p3].pressure * q4),
    ]
  }

  getSplinePointGradient(index: number): number[] {
    const { points, looped } = this

    let p0: number,
      p1: number,
      p2: number,
      p3: number,
      l = points.length,
      d = Math.trunc(index),
      t = index - d

    if (looped) {
      p1 = d
      p2 = (p1 + 1) % l
      p3 = (p2 + 1) % l
      p0 = p1 >= 1 ? p1 - 1 : l - 1
    } else {
      p1 = Math.min(d + 1, l - 1)
      p2 = Math.min(p1 + 1, l - 1)
      p3 = Math.min(p2 + 1, l - 1)
      p0 = p1 - 1
    }

    let tt = t * t,
      q1 = -3 * tt + 4 * t - 1,
      q2 = 9 * tt - 10 * t,
      q3 = -9 * tt + 8 * t + 1,
      q4 = 3 * tt - 2 * t

    return [
      0.5 *
        (points[p0].point[0] * q1 +
          points[p1].point[0] * q2 +
          points[p2].point[0] * q3 +
          points[p3].point[0] * q4),
      0.5 *
        (points[p0].point[1] * q1 +
          points[p1].point[1] * q2 +
          points[p2].point[1] * q3 +
          points[p3].point[1] * q4),
      0.5 *
        (points[p0].pressure * q1 +
          points[p1].pressure * q2 +
          points[p2].pressure * q3 +
          points[p3].pressure * q4),
    ]
  }

  calculateSegmentLength(segment: number) {
    let length = 0
    let stepSize = 1 / 200

    let oldPoint = this.getSplinePoint(segment)
    let newPoint: number[]

    for (let t = 0; t < 1; t += stepSize) {
      newPoint = this.getSplinePoint(segment + t)
      length += vec.dist(oldPoint, newPoint)
      oldPoint = newPoint
    }

    return length
  }

  getNormalizedOffsetAt(distance: number) {
    const { lengths } = this
    let i = 0
    while (distance > lengths[i]) {
      distance -= lengths[i]
      i++
    }

    return i + distance / lengths[i]
  }

  getStrokeRadius(pressure = 0.5) {
    const { thinning, size, easing } = this
    if (!thinning) return size / 2
    pressure = clamp(easing(pressure), 0, 1)
    return (
      (thinning < 0
        ? lerp(size, size + size * clamp(thinning, -0.95, -0.05), pressure)
        : lerp(size - size * clamp(thinning, 0.05, 0.95), size, pressure)) / 2
    )
  }

  getPointsToDistance(distance: number) {
    // Could be made O(log n) because we already store runningLength
    const { points, lengths } = this

    const results: SplinePoint[] = []

    let i = 1
    let traveled = 0

    while (traveled < distance) {
      results.push(points[i])
      traveled += lengths[i]
      i++
    }

    return results
  }

  getBoundingBox() {
    let minX = -Infinity
    let minY = -Infinity
    let maxX = Infinity
    let maxY = Infinity

    for (let point of this.points) {
      minX = Math.min(point.point[0], minX)
      minY = Math.min(point.point[1], minX)
      maxX = Math.max(point.point[0], minX)
      maxY = Math.max(point.point[1], minX)
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }

  hitTest(point: number[]) {}

  erase(point: number[][], radius: number) {}
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
  const middleSpline = new FreehandSpline(points, options)
  return middleSpline.getOutlineShape()
}

export { StrokeOptions }

function nearestPointOnSpline(
  point: number[],
  cp1: number[],
  cp2: number[],
  cp3: number[],
  cp4: number[]
) {}
