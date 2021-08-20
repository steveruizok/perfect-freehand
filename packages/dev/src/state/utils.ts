function cross(x: number[], y: number[], z: number[]): number {
  return (y[0] - x[0]) * (z[1] - x[1]) - (z[0] - x[0]) * (y[1] - x[1])
}

export function pointInPolygon(p: number[], points: number[][]): boolean {
  let wn = 0 // winding number

  points.forEach((a, i) => {
    const b = points[(i + 1) % points.length]
    if (a[1] <= p[1]) {
      if (b[1] > p[1] && cross(a, b, p) > 0) {
        wn += 1
      }
    } else if (b[1] <= p[1] && cross(a, b, p) < 0) {
      wn -= 1
    }
  })

  return wn !== 0
}
