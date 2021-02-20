import polygonClipping from 'polygon-clipping'
const { hypot, cos, max, min, sin, atan2, PI } = Math
const TAU = PI / 2

function projectPoint(x0: number, y0: number, a: number, d: number) {
  return [cos(a) * d + x0, sin(a) * d + y0]
}

function getMidPoint(x0: number, y0: number, x1: number, y1: number) {
  return [x0 + (x1 - x0) / 2, y0 + (y1 - y0) / 2]
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

export type StrokeOptions = {
  type?: 'mouse' | 'pen' | 'touch'
  simulatePressure?: boolean
  streamline?: number
  minSize?: number
  maxSize?: number
  smooth?: number
  pressureChangeRate?: number
  pressureMaxVelocity?: number
  pressureVelocityEffect?: number
}

export default function getPath<
  T extends number[],
  K extends { x: number; y: number; pressure?: number }
>(points: (T | K)[], options: StrokeOptions = {} as StrokeOptions): string {
  const {
    type = 'mouse',
    simulatePressure = true,
    streamline = 0.5,
    minSize = 2.5,
    maxSize = 8,
    smooth = 8,
    pressureChangeRate = 0.5,
    pressureMaxVelocity = 8,
    pressureVelocityEffect = 8,
  } = options

  const aPoints = toPointsArray(points)

  let d0: number,
    d1: number, // first / last
    pts: number[][] = [],
    len = aPoints.length,
    distance = 0,
    p0 = aPoints[0],
    p1 = aPoints[len - 1],
    prev = p0,
    t0 = p0,
    t1 = p1,
    m0 = p0,
    m1 = p0,
    length = 0,
    x: number,
    y: number,
    angle: number,
    size: number,
    d = ''

  if (len === 0) {
    return ''
  }

  if (len < 4) {
    // Just draw a dot on very short marks
    const [x, y, pressure] = p1
    const r =
      (minSize + (maxSize - minSize)) * (type === 'pen' ? pressure : 0.44)

    d = `
      M ${x - r},${y}
      a ${r},${r} 0 1,0 ${r * 2},0
      a ${r},${r} 0 1,0 -${r * 2},0
    `
  } else {
    // Use the points to create an outline shape, where the width
    // of the shape is determined by the pressure at each point.

    for (let i = 0; i < aPoints.length; i++) {
      let [ix, iy, ip] = aPoints[i]
      let [px, py, pp] = prev

      // Point
      x = px + (ix - px) * (1 - streamline)
      y = py + (iy - py) * (1 - streamline)

      // Angle
      angle = atan2(y - py, x - px)

      // Distance
      distance = hypot(y - py, x - px)
      length += distance

      // Pressure
      if (type === 'pen') {
        // If pen, accellerate the reported pressure
        ip = pp + (ip - pp) * pressureChangeRate
      } else {
        // If too short (or if not simulating pressure), use the max size.
        if (!simulatePressure) {
          ip = 1
        } else {
          // Calculate pressure based on velocity (slower = more pressure)
          let rp = 1 - distance / pressureMaxVelocity
          const sp = Math.min(distance / pressureVelocityEffect, 1)
          ip = Math.min(1, pp + (rp - pp) * (pressureChangeRate * sp))
        }
      }

      // Size is based on pressure
      size = clamp(minSize + ip * (maxSize - minSize), minSize, maxSize)

      // Taper start
      if (length < 16) {
        let t = length / 16
        size *= t * t * t
      }

      // 3. Shape
      p0 = projectPoint(x, y, angle - TAU, size) // left
      p1 = projectPoint(x, y, angle + TAU, size) // right

      // // Add more points to the first and p1 points
      if (i === 0) {
        t0 = p0
        t1 = p1
      } else {
        d0 = Math.hypot(p0[0] - t0[0], p0[1] - t0[1])
        if (d0 > smooth) {
          pts.push(m0)
          m0 = getMidPoint(t0[0], t0[1], p0[0], p0[1])
          t0 = p0
        }

        d1 = Math.hypot(p1[0] - t1[0], p1[1] - t1[1])
        if (d1 > smooth) {
          pts.unshift(m1)
          m1 = getMidPoint(t1[0], t1[1], p1[0], p1[1])
          t1 = p1
        }
      }

      prev = [x, y, ip]
    }

    pts.push(prev)
    pts.unshift(prev)

    const poly = polygonClipping.union([pts] as any)

    for (let face of poly) {
      for (let verts of face) {
        let v0 = verts[0]
        let v1 = verts[1]
        verts.push(v0)

        d += ` M ${v0[0]} ${v0[1]}`
        for (let i = 1; i < verts.length; i++) {
          const [mpx, mpy] = getMidPoint(v0[0], v0[1], v1[0], v1[1])
          d += ` Q ${v0[0]},${v0[1]} ${mpx},${mpy}`
          v0 = v1
          v1 = verts[i + 1]
        }
      }
    }
  }

  return d
}
