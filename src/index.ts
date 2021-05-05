import { toPointsArray, clamp, lerp } from './utils'
import { SplinePoint, StrokeOptions } from './types'
import * as vec from './vec'

export class FreehandSpline {
  inputPoints: number[][]
  looped: boolean

  lengths: number[] = []
  length: number = 0
  points: SplinePoint[] = []

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

    let lengths: number[] = []
    let runningLength = 0
    let vector: number[]
    const points: SplinePoint[] = []
    let pressure = 0
    let prevPressure = 0.5

    for (let i = 0; i < streamlined.length; i++) {
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

    this.points = points
    this.lengths = lengths
    this.length = runningLength
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

  getOutlineShape() {
    const { lengths, size, smoothing, points, start, end } = this

    const len = points.length

    if (len < 2) return this.inputPoints

    const results: {
      point: number[]
      gradient: number[]
      runningLength: number
    }[] = []

    let error = 0
    let traveled = 0
    let point: number[]
    let gradient: number[]

    // Get evenly spaced points along the center spline
    for (let i = 0; i < len - 1; i++) {
      // distance to previous point
      const length = lengths[i]

      // distance traveled
      let trav = error

      while (trav <= length) {
        point = this.getSplinePoint(i + trav / length)
        gradient = vec.uni(this.getSplinePointGradient(i + trav / length))

        results.push({ point, gradient, runningLength: traveled + trav })
        trav += size / 4
      }

      error = trav - length
      traveled += length
    }

    // For the last gradient, average the previous three points
    results.push({
      point: this.getSplinePoint(len - 1),
      gradient: results
        .slice(-3)
        .reduce(
          (acc, cur) => (acc ? vec.med(acc, cur.gradient) : cur.gradient),
          vec.uni(this.getSplinePointGradient(len - 1.1))
        ),
      runningLength: this.length,
    })

    const leftSpline: number[][] = []
    const rightSpline: number[][] = []

    let l0: number[] | undefined
    let r0: number[] | undefined
    let tl: number[] | undefined
    let tr: number[] | undefined
    let tlu: number[] | undefined
    let plu: number[] | undefined
    let tru: number[] | undefined
    let pru: number[] | undefined
    let dpr = 0
    let ldpr = 1
    let rdpr = 1
    let pressure = 1
    let pResult = results[0]

    const minDist = size * smoothing

    let prevPressure = points
      .slice(0, 5)
      .reduce((acc, cur) => (acc + cur.pressure) / 2, points[0].pressure)

    let radius = this.getStrokeRadius(points[len - 1].pressure)

    for (let i = 0; i < results.length - 1; i++) {
      const { point, gradient, runningLength } = results[i]
      const pressure = point[2]

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

      dpr = vec.dpr(gradient, results[i + 1].gradient)

      if (i > 0 && dpr < 0) {
        const { gradient: pg } = results[i - 1]

        const v = vec.mul(vec.per(pg), radius)
        const l1 = vec.sub(point, v)
        const r1 = vec.add(point, v)

        for (let t = 0; t <= 1; t += 0.25) {
          const r = Math.PI * t
          tr = vec.rotAround(r1, point, r, r)
          tl = vec.rotAround(l1, point, -r, -r)
          leftSpline.push(tl)
          rightSpline.push(tr)
        }

        l0 = tl
        r0 = tr
        continue
      }

      // Regular points

      let addLeft = false
      let addRight = false

      const offset = vec.mul(vec.per(gradient), radius)

      tl = vec.sub(point, offset)
      tr = vec.add(point, offset)

      if (!l0 || vec.dist(l0, tl) > minDist) {
        addLeft = true
      }

      if (!r0 || vec.dist(r0, tr) > minDist) {
        addRight = true
      }

      if (addLeft) {
        leftSpline.push(tl)
        l0 = tl
      }

      if (addRight) {
        rightSpline.push(tr)
        r0 = tr
      }

      if (addLeft || addRight) {
        pResult = results[i]
      }
    }

    // // Draw start cap
    const startCap: number[][] = []

    // r0 = rightSpline[0]
    // tl = results[0].point

    // for (let t = 0; t <= 1; t += 0.25) {
    //   const r = Math.PI * t
    //   startCap.push(vec.rotAround(r0, tl, r, r))
    // }

    // // Draw end cap

    const endCap: number[][] = []

    // tl = this.getSplinePoint(points.length - 1)
    // l0 = vec.add(
    //   tl,
    //   vec.mul(
    //     vec.uni(vec.per(this.getSplinePointGradient(points.length - 1))),
    //     this.getStrokeRadius(tl[2])
    //   )
    // )

    // for (let t = 0; t <= 1; t += 0.25) {
    //   const r = Math.PI * t
    //   endCap.push(vec.rotAround(l0, tl, r, r))
    // }

    return startCap.concat(leftSpline, endCap, rightSpline.reverse())
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
