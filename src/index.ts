import polygonClipping from 'polygon-clipping'

/* --------------------- Helpers -------------------- */

const { hypot, cos, max, min, sin, atan2, PI } = Math
const TAU = PI / 2

function projectPoint(x0: number, y0: number, a: number, d: number) {
  return [cos(a) * d + x0, sin(a) * d + y0]
}

function shortAngleDist(a0: number, a1: number) {
  var max = Math.PI * 2
  var da = (a1 - a0) % max
  return ((2 * da) % max) - da
}

function angleDelta(a0: number, a1: number) {
  return shortAngleDist(a0, a1)
}

function getPointBetween(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  d = 0.5
) {
  return [x0 + (x1 - x0) * d, y0 + (y1 - y0) * d]
}

function clamp(n: number, a: number, b: number) {
  return max(a, min(b, n))
}

function toPointsArray<
  T extends number[],
  K extends { x: number; y: number; pressure?: number }
>(points: (T | K)[]): number[][] {
  if (Array.isArray(points[0])) {
    return (points as number[][]).map(([x, y, pressure = 0.5]) => [
      x,
      y,
      pressure,
    ])
  } else {
    return (points as {
      x: number
      y: number
      pressure?: number
    }[]).map(({ x, y, pressure = 0.5 }) => [x, y, pressure])
  }
}

/* ---------------------- Types --------------------- */

export interface StrokePointsOptions {
  streamline?: number
}

export interface StrokeOutlineOptions extends StrokePointsOptions {
  simulatePressure?: boolean
  pressure?: boolean
  minSize?: number
  maxSize?: number
  smooth?: number
}

export interface StrokeOptions extends StrokeOutlineOptions {
  clip?: boolean
}

/* --------------------- Methods -------------------- */

/**
 * ## getStrokePoints
 * @description Get points for a stroke.
 * @param points An array of points (as `[x, y, pressure]` or `{x, y, pressure}`). Pressure is optional.
 * @param options An (optional) object with options.
 */
export function getStrokePoints<
  T extends number[],
  K extends { x: number; y: number; pressure?: number }
>(
  points: (T | K)[],
  options: StrokePointsOptions = {} as StrokePointsOptions
): number[][] {
  const { streamline = 0.5 } = options

  const aPoints = toPointsArray(points)

  let x: number,
    y: number,
    angle: number,
    length = 0,
    distance = 0.01,
    len = aPoints.length,
    prev = [...aPoints[0], 0, 0, 0],
    pts = [prev]

  if (len === 0) {
    return []
  }

  for (let i = 1; i < len; i++) {
    let [ix, iy, ip] = aPoints[i]
    let [px, py] = prev

    // Point
    x = px + (ix - px) * (1 - streamline)
    y = py + (iy - py) * (1 - streamline)

    // Angle
    angle = atan2(y - py, x - px)

    // Distance
    distance = hypot(y - py, x - px)
    length += distance
    prev = [x, y, ip, angle, distance, length]
    pts.push(prev)
  }

  // Assign second angle to first point
  if (pts.length > 1) {
    pts[0][2] = pts[1][2]
  }

  return pts
}

/**
 * ## getShortStrokeOutlinePoints
 * @description Draw an outline around a short stroke.
 * @param points An array of points (as `[x, y, pressure]` or `{x, y, pressure}`). Pressure is optional.
 * @param options An (optional) object with options.
 */
export function getShortStrokeOutlinePoints(
  points: number[][],
  options: StrokeOutlineOptions = {} as StrokeOutlineOptions
) {
  const { minSize = 2.5, maxSize = 8 } = options

  const len = points.length

  // Can't draw an outline without any points
  if (len === 0) {
    return []
  }

  // Draw a kind of shitty shape around the start and end points.
  const p0 = points[0],
    p1 = points[len - 1],
    size = p0[2] === p1[2] ? maxSize : minSize + (maxSize - minSize) * p1[2],
    a =
      p0 === p1
        ? Math.random() * (PI * 2)
        : atan2(p1[1] - p0[1], p1[0] - p0[0]),
    m = getPointBetween(p0[0], p0[1], p1[0], p1[1], 0.5)

  return [
    projectPoint(m[0], m[1], a + TAU, size),
    projectPoint(p0[0], p0[1], a + PI, size),
    projectPoint(m[0], m[1], a - TAU, size),
    projectPoint(p1[0], p1[1], a, size),
    projectPoint(m[0], m[1], a + TAU, size),
  ]
}

/**
 * ## getStrokeOutlinePoints
 * @description Get an array of points (as `[x, y]`) representing the outline of a stroke.
 * @param points An array of points (as `[x, y, pressure]` or `{x, y, pressure}`). Pressure is optional.
 * @param options An (optional) object with options.
 */
export function getStrokeOutlinePoints(
  points: number[][],
  options: StrokeOutlineOptions = {} as StrokeOutlineOptions
): number[][] {
  const {
    simulatePressure = true,
    pressure = true,
    minSize = 2.5,
    maxSize = 8,
    smooth = 8,
  } = options

  let len = points.length,
    p0 = points[0],
    p1 = points[0],
    t0 = p0,
    t1 = p1,
    m0 = p0,
    m1 = p0,
    size = 0,
    pp = 0.5,
    prev = p1,
    length = 0,
    leftPts: number[][] = [],
    rightPts: number[][] = [],
    d0: number,
    d1: number

  if (len === 0) {
    return []
  }

  // Use the points to create an outline shape, where the width
  // of the shape is determined by the pressure at each point.

  for (let i = 1; i < len; i++) {
    let [x, y, ip, angle, distance] = points[i]
    length += distance

    // Size
    if (pressure) {
      if (simulatePressure) {
        // Simulate pressure by accellerating the reported pressure.
        let rp = min(1 - distance / maxSize, 1)
        const sp = min(distance / maxSize, 1)
        ip = min(1, pp + (rp - pp) * (sp / 2))
      }
      // Compute the size based on the pressure.
      size = clamp(minSize + ip * (maxSize - minSize), minSize, maxSize)
    } else {
      size = maxSize
    }

    // 3. Shape
    p0 = projectPoint(x, y, angle - TAU, size) // left
    p1 = projectPoint(x, y, angle + TAU, size) // right

    // // Add more points to the first and p1 points
    if (i === 0) {
      t0 = p0
      t1 = p1

      for (let t = 0, step = 0.33; t <= 1; t += step) {
        m1 = projectPoint(prev[0], prev[1], angle - TAU + t * -PI, size * 2)
        rightPts.push(m1)
        t1 = m1
      }
    } else {
      const delta = angleDelta(angle, prev[2])

      // Handle sharp corners differently
      if (Math.abs(delta) > PI * 0.72 && length > size * 2) {
        if (delta > 0) {
          m0 = prev
          leftPts.push(m0)
          t0 = m0

          for (let t = 0, step = 0.3; t <= 1; t += step) {
            m1 = projectPoint(prev[0], prev[1], angle - TAU + t * -PI, size)
            rightPts.push(m1)
            t1 = m1
          }
        } else {
          for (let t = 0, step = 0.3; t <= 1; t += step) {
            m0 = projectPoint(prev[0], prev[1], angle + TAU + t * PI, size)
            leftPts.push(m0)
            t0 = m0
          }

          m1 = prev
          rightPts.push(m1)
          t1 = m1
        }
      } else {
        // Project sideways
        d0 = Math.hypot(p0[0] - t0[0], p0[1] - t0[1])
        if (d0 > smooth) {
          leftPts.push(m0)
          m0 = getPointBetween(t0[0], t0[1], p0[0], p0[1], 0.5)
          t0 = p0
        }

        d1 = Math.hypot(p1[0] - t1[0], p1[1] - t1[1])
        if (d1 > smooth) {
          rightPts.push(m1)
          m1 = getPointBetween(t1[0], t1[1], p1[0], p1[1], 0.5)
          t1 = p1
        }
      }
    }

    pp = ip
    prev = [x, y, angle]
  }

  leftPts.push(prev)
  rightPts.push(prev)

  return leftPts.concat(rightPts.reverse())
}

/**
 * ## clipPath
 * @description Returns a clipped polygon of the provided points.
 * @param points An array of points (as number[]), the output of getStrokeOutlinePoints.
 */
export function clipPath(points: number[][]) {
  return polygonClipping.union([points] as any)
}

/**
 * ## getPath
 * @description Returns a pressure sensitive stroke SVG data
 * @param points An array of points (as `[x, y, pressure]` or `{x, y, pressure}`). Pressure is optional.
 * @param options An (optional) object with options.
 */
export default function getPath<
  T extends number[],
  K extends { x: number; y: number; pressure?: number }
>(points: (T | K)[], options: StrokeOptions = {} as StrokeOptions): string {
  if (points.length === 0) {
    return ''
  }

  const { clip = true, maxSize = 8 } = options

  let ps = getStrokePoints(points, options),
    totalLength = ps[ps.length - 1][5],
    pts =
      totalLength < maxSize * 2
        ? getShortStrokeOutlinePoints(ps, options)
        : getStrokeOutlinePoints(ps, options),
    d: string[] = []

  // If the length is too short, just draw a dot.

  // If we're clipping the path, then find the polygon and add its faces.
  if (clip) {
    const poly = clipPath(pts)

    for (let face of poly) {
      for (let verts of face) {
        let v0 = verts[0]
        let v1 = verts[1]
        verts.push(v0)

        d.push(`M ${v0[0]} ${v0[1]}`)
        for (let i = 1; i < verts.length; i++) {
          const [mpx, mpy] = getPointBetween(v0[0], v0[1], v1[0], v1[1], 0.5)
          d.push(` Q ${v0[0]},${v0[1]} ${mpx},${mpy}`)
          v0 = v1
          v1 = verts[i + 1]
        }
      }
    }
  } else {
    // If we're not clipping the path, just trace it.
    let v0 = pts[0]
    let v1 = pts[1]
    pts.push(v0)
    d.push(`M ${v0[0]} ${v0[1]}`)
    for (let i = 1; i < pts.length; i++) {
      const [mpx, mpy] = getPointBetween(v0[0], v0[1], v1[0], v1[1], 0.5)
      d.push(`Q ${v0[0]},${v0[1]} ${mpx},${mpy}`)
      v0 = v1
      v1 = pts[i + 1]
    }
  }

  return d.join(' ')
}
