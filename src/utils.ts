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
