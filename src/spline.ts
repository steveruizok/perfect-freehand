import { StrokeOptions } from './types'
import { clamp, lerp } from './utils'
import * as vec from './vec'

function dist(a: number[], b: number[]) {
  return Math.hypot(b[1] - a[1], b[0] - a[0])
}

export default class Spline {
  looped: boolean
  points: number[][]
  lengths: number[]
  length: number

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
  last: boolean

  constructor(
    points: number[][],
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

    this.size = size
    this.thinning = thinning
    this.smoothing = smoothing
    this.streamline = streamline
    this.simulatePressure = simulatePressure
    this.easing = easing
    this.start = { taper: taperStart, easing: taperStartCurve }
    this.end = { taper: taperEnd, easing: taperEndCurve }
    this.last = last

    let length: number
    let totalLength = 0
    let lengths: number[] = []

    // Apply streamline
    const streamlinedPts: number[][] = [points[0]]

    for (let i = 1; i < points.length; i++) {
      streamlinedPts.push([
        ...vec.lrp(streamlinedPts[i - 1], points[i], 1 - streamline),
        points[i][2],
      ])
    }

    this.points = streamlinedPts

    // Calculate simulated presssures
    let pp = 0.5

    for (let i = 0; i < this.points.length - 1; i++) {
      length = dist(this.points[i], this.points[i + 1])
      lengths.push(length)
      totalLength += length

      if (simulatePressure) {
        const rp = Math.min(1 - length / size, 1)
        const sp = Math.min(length / size, 1)
        this.points[i][2] = Math.min(1, pp + (rp - pp) * (sp / 2))
        pp = this.points[i][2]
      }
    }

    this.looped = looped
    this.lengths = lengths
    this.length = totalLength
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
    const { points, lengths } = this

    const results: number[][] = []

    let i = 1
    let traveled = 0

    while (traveled < distance) {
      results.push(points[i])
      traveled += lengths[i]
      i++
    }
  }

  getOutlineShape() {
    const { lengths, size, smoothing } = this

    const results: { point: number[]; gradient: number[] }[] = []

    let error = 0
    let point: number[]
    let gradient: number[]

    for (let i = 0; i < this.points.length - 1; i++) {
      // distance to previous point
      const length = lengths[i]

      // distance traveled
      let trav = error

      while (trav <= length) {
        point = this.getSplinePoint(i + trav / length)
        gradient = vec.uni(this.getSplinePointGradient(i + trav / length))
        results.push({ point, gradient })
        trav += size / 2
      }

      error = trav - length
    }

    // For the last gradient, average the previous three points
    const lastGradient = results
      .slice(-3)
      .reduce(
        (acc, cur) => (acc ? vec.med(acc, cur.gradient) : cur.gradient),
        vec.uni(this.getSplinePointGradient(this.points.length - 1.1))
      )

    results.push({
      point: this.getSplinePoint(this.points.length - 1),
      gradient: lastGradient!,
    })

    const leftSpline: number[][] = []
    const rightSpline: number[][] = []

    let l0: number[] | undefined
    let r0: number[] | undefined

    const minDist = size * smoothing

    for (let { point, gradient } of results) {
      const r = vec.mul(vec.per(gradient), this.getStrokeRadius(point[2]))
      const l1 = vec.add(point, r)
      if (!l0 || vec.dist(l0, l1) > minDist) {
        l0 = l1
        leftSpline.push(l1)
      }
      const r1 = vec.sub(point, r)
      if (!r0 || vec.dist(r0, r1) > minDist) {
        r0 = r1
        rightSpline.push(r1)
      }
    }

    return [rightSpline[0], ...leftSpline, ...rightSpline.reverse()]
  }

  getEvenlySpacedPoints(distance: number) {
    const { lengths } = this

    const results: { point: number[]; gradient: number[] }[] = []

    let error = 0
    let point: number[]
    let gradient: number[]

    for (let i = 0; i < this.points.length - 1; i++) {
      // distance to previous point
      const length = lengths[i]

      // distance traveled
      let trav = error

      while (trav <= length) {
        point = this.getSplinePoint(i + trav / length)
        gradient = vec.uni(this.getSplinePointGradient(i + trav / length))
        results.push({ point, gradient })
        trav += distance
      }

      error = trav - length
    }

    // For the last gradient, average the previous three points
    const lastGradient = results
      .slice(-3)
      .reduce(
        (acc, cur) => (acc ? vec.med(acc, cur.gradient) : cur.gradient),
        vec.uni(this.getSplinePointGradient(this.points.length - 1.1))
      )

    results.push({
      point: this.getSplinePoint(this.points.length - 1),
      gradient: lastGradient!,
    })

    return results
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
        (points[p0][0] * q1 +
          points[p1][0] * q2 +
          points[p2][0] * q3 +
          points[p3][0] * q4),
      0.5 *
        (points[p0][1] * q1 +
          points[p1][1] * q2 +
          points[p2][1] * q3 +
          points[p3][1] * q4),
      0.5 *
        (points[p0][2] * q1 +
          points[p1][2] * q2 +
          points[p2][2] * q3 +
          points[p3][2] * q4),
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
        (points[p0][0] * q1 +
          points[p1][0] * q2 +
          points[p2][0] * q3 +
          points[p3][0] * q4),
      0.5 *
        (points[p0][1] * q1 +
          points[p1][1] * q2 +
          points[p2][1] * q3 +
          points[p3][1] * q4),
      0.5 *
        (points[p0][2] * q1 +
          points[p1][2] * q2 +
          points[p2][2] * q3 +
          points[p3][2] * q4),
    ]
  }

  calculateSegmentLength(segment: number) {
    let length = 0
    let stepSize = 1 / 200

    let oldPoint = this.getSplinePoint(segment)
    let newPoint: number[]

    for (let t = 0; t < 1; t += stepSize) {
      newPoint = this.getSplinePoint(segment + t)
      length += dist(oldPoint, newPoint)
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
