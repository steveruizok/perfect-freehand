export function lerp(y1: number, y2: number, mu: number) {
  return y1 * (1 - mu) + y2 * mu
}

export function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
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

export function simplify(points: number[][], tolerance = 1): number[][] {
  const len = points.length,
    a = points[0],
    b = points[len - 1],
    [x1, y1] = a,
    [x2, y2] = b

  if (len > 2) {
    let distance = 0,
      index = 0,
      max = Math.hypot(y2 - y1, x2 - x1)

    for (let i = 1; i < len - 1; i++) {
      const [x0, y0] = points[i],
        d = Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1) / max

      if (distance > d) continue

      distance = d
      index = i
    }

    if (distance > tolerance) {
      let l0 = simplify(points.slice(0, index + 1), tolerance)
      let l1 = simplify(points.slice(index + 1), tolerance)
      return l0.concat(l1.slice(1))
    }
  }

  return [a, b]
}
