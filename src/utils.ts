const { hypot, cos, max, min, sin, atan2, PI } = Math,
  PI2 = PI * 2

export function lerp(y1: number, y2: number, mu: number) {
  return y1 * (1 - mu) + y2 * mu
}

export function projectPoint(p0: number[], a: number, d: number) {
  return [cos(a) * d + p0[0], sin(a) * d + p0[1]]
}

function shortAngleDist(a0: number, a1: number) {
  var max = PI2
  var da = (a1 - a0) % max
  return ((2 * da) % max) - da
}

export function getAngleDelta(a0: number, a1: number) {
  return shortAngleDist(a0, a1)
}

export function lerpAngles(a0: number, a1: number, t: number) {
  return a0 + shortAngleDist(a0, a1) * t
}

export function getPointBetween(p0: number[], p1: number[], d = 0.5) {
  return [p0[0] + (p1[0] - p0[0]) * d, p0[1] + (p1[1] - p0[1]) * d]
}

export function getAngle(p0: number[], p1: number[]) {
  return atan2(p1[1] - p0[1], p1[0] - p0[0])
}

export function getDistance(p0: number[], p1: number[]) {
  return hypot(p1[1] - p0[1], p1[0] - p0[0])
}

export function clamp(n: number, a: number, b: number) {
  return max(a, min(b, n))
}

export function toPointsArray<
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

export function getBezierCurveSegments(points: number[][], tension = 0.4) {
  const len = points.length,
    cpoints: number[][] = points.slice(0)

  if (len < 2) {
    throw Error('Curve must have at least two points.')
  }

  for (let i = 1; i < len - 1; i++) {
    let p0 = points[i - 1],
      p1 = points[i],
      p2 = points[i + 1]

    const pdx = p2[0] - p0[0],
      pdy = p2[1] - p0[1],
      pd = Math.hypot(pdx, pdy),
      nx = pdx / pd, // normalized x
      ny = pdy / pd, // normalized y
      dp = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), // Distance to previous
      dn = Math.hypot(p1[0] - p2[0], p1[1] - p2[1]) // Distance to next

    cpoints[i] = [
      // tangent start
      p1[0] - nx * dp * tension,
      p1[1] - ny * dp * tension,
      // tangent end
      p1[0] + nx * dn * tension,
      p1[1] + ny * dn * tension,
      // normal
      nx,
      ny,
    ]
  }

  // TODO: Reflect the nearest control points, not average them
  cpoints[0][2] = (points[0][0] + cpoints[1][0]) / 2
  cpoints[0][3] = (points[0][1] + cpoints[1][1]) / 2
  cpoints[len - 1][0] = (points[len - 1][0] + cpoints[len - 2][2]) / 2
  cpoints[len - 1][1] = (points[len - 1][1] + cpoints[len - 2][3]) / 2

  const results: {
    start: number[]
    tangentStart: number[]
    normalStart: number[]
    end: number[]
    tangentEnd: number[]
    normalEnd: number[]
  }[] = []

  for (let i = 1; i < cpoints.length; i++) {
    results.push({
      start: points[i - 1],
      tangentStart: cpoints[i - 1].slice(2),
      normalStart: cpoints[i - 1].slice(2, 4),
      end: points[i],
      tangentEnd: cpoints[i].slice(0, 2),
      normalEnd: cpoints[i].slice(2, 4),
    })
  }
  return results
}
