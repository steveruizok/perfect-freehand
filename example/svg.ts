// Some helpers for drawing SVGs.

import * as vec from 'vec'
import { Segment } from '../dist'

// General

export function ellipse(A: number[], r: number) {
  return `M ${A[0] - r},${A[1]}
      a ${r},${r} 0 1,0 ${r * 2},0
      a ${r},${r} 0 1,0 -${r * 2},0 `
}

export function dot(v: number[], r = 3) {
  return ellipse(v, r)
}

export function moveTo(v: number[]) {
  return `M ${v[0]},${v[1]} `
}

export function lineTo(v: number[]) {
  return `L ${v[0]},${v[1]} `
}

export function line(a: number[], ...pts: number[][]) {
  return moveTo(a) + pts.map(p => lineTo(p)).join(' ')
}

export function hLineTo(v: number[]) {
  return `H ${v[0]},${v[1]} `
}

export function vLineTo(v: number[]) {
  return `V ${v[0]},${v[1]} `
}

export function arcTo(C: number[], r: number, A: number[], B: number[]) {
  return [
    // moveTo(A),
    'A',
    r,
    r,
    0,
    getSweep(C, A, B) > 0 ? '1' : '0',
    0,
    B[0],
    B[1],
  ].join(' ')
}

function shortAngleDist(a0: number, a1: number) {
  const max = Math.PI * 2
  const da = (a1 - a0) % max
  return ((2 * da) % max) - da
}

export function getSweep(C: number[], A: number[], B: number[]) {
  return shortAngleDist(vec.angle(C, A), vec.angle(C, B))
}

// /**
//  * Return the path for a rectangle between two points.
//  * @param a
//  * @param b
//  * @returns
//  */
// export function rectFromBounds(bounds: IBounds) {
//   const { minX, maxX, minY, maxY } = bounds
//   return [
//     moveTo([minX, maxX]),
//     lineTo([maxX, minY]),
//     lineTo([maxX, maxY]),
//     lineTo([minX, minY]),
//     closePath(),
//   ].join(' ')
// }

// /**
//  * Return the path for a rectangle with a given point and size.
//  * @param point
//  * @param size
//  * @returns
//  */
// export function rect(point: number[], size: number[]) {
//   return rectFromBounds(getBoundsBetweenPoints(point, vec.add(point, size)))
// }

export function bezierTo(A: number[], B: number[], C: number[]) {
  return `C ${A[0]},${A[1]} ${B[0]},${B[1]} ${C[0]},${C[1]} `
}

// export function arcTo(C: number[], r: number, A: number[], B: number[]) {
//   return [
//     // moveTo(A),
//     'A',
//     r,
//     r,
//     0,
//     getSweep(C, A, B) > 0 ? '1' : '0',
//     0,
//     B[0],
//     B[1],
//   ].join(' ')
// }

export function closePath() {
  return 'Z'
}

export function rectTo(A: number[]) {
  return ['R', A[0], A[1]].join(' ')
}

export function getPointAtLength(path: SVGPathElement, length: number) {
  const point = path.getPointAtLength(length)
  return [point.x, point.y]
}

// A helper for getting tangents.
export function getCircleTangentToPoint(
  A: number[],
  r0: number,
  P: number[],
  side: number
) {
  const B = vec.lrp(A, P, 0.5),
    r1 = vec.dist(A, B),
    delta = vec.sub(B, A),
    d = vec.len(delta)

  if (!(d <= r0 + r1 && d >= Math.abs(r0 - r1))) {
    return
  }

  const a = (r0 * r0 - r1 * r1 + d * d) / (2.0 * d),
    n = 1 / d,
    p = vec.add(A, vec.mul(delta, a * n)),
    h = Math.sqrt(r0 * r0 - a * a),
    k = vec.mul(vec.per(delta), h * n)

  return side === 0 ? vec.add(p, k) : vec.sub(p, k)
}

/**
 * Get outer tangents of two circles.
 * @param x0
 * @param y0
 * @param r0
 * @param x1
 * @param y1
 * @param r1
 * @returns [lx0, ly0, lx1, ly1, rx0, ry0, rx1, ry1]
 */
export function getOuterTangents(
  C0: number[],
  r0: number,
  C1: number[],
  r1: number
) {
  const a0 = vec.angle(C0, C1)
  const d = vec.dist(C0, C1)

  // Circles are overlapping, no tangents
  if (d < Math.abs(r1 - r0)) return

  const a1 = Math.acos((r0 - r1) / d),
    t0 = a0 + a1,
    t1 = a0 - a1

  return [
    [C0[0] + r0 * Math.cos(t1), C0[1] + r0 * Math.sin(t1)],
    [C1[0] + r1 * Math.cos(t1), C1[1] + r1 * Math.sin(t1)],
    [C0[0] + r0 * Math.cos(t0), C0[1] + r0 * Math.sin(t0)],
    [C1[0] + r1 * Math.cos(t0), C1[1] + r1 * Math.sin(t0)],
  ]
}

export function getGlob(
  C0: number[],
  r0: number,
  C1: number[],
  r1: number,
  D: number[],
  Dp: number[],
  a: number,
  b: number,
  ap: number,
  bp: number
) {
  // Get end points
  let E0 = getCircleTangentToPoint(C0, r0, D, 0),
    E0p = getCircleTangentToPoint(C0, r0, Dp, 1),
    E1 = getCircleTangentToPoint(C1, r1, D, 1),
    E1p = getCircleTangentToPoint(C1, r1, Dp, 0)

  if (!(E0 || E0p)) {
    E0 = C0
    E0p = C0
  } else if (!E0) {
    E0 = E0p
  } else if (!E0p) {
    E0p = E0
  }

  if (!(E1 || E1p)) {
    E1 = C1
    E1p = C1
  } else if (!E1) {
    E1 = E1p
  } else if (!E1p) {
    E1p = E1
  }

  // Get control points
  const F0 = vec.lrp(E0, D, a),
    F1 = vec.lrp(E1, D, b),
    F0p = vec.lrp(E0p, Dp, ap),
    F1p = vec.lrp(E1p, Dp, bp)

  return {
    C0,
    r0,
    C1,
    r1,
    E0,
    E0p,
    E1,
    E1p,
    F0,
    F0p,
    F1,
    F1p,
    D,
    Dp,
  }
}

export function getGlobStroke(segments: Segment[]) {
  const leftPts = []
  const rightPts = []

  let seg0: Segment
  let seg1: Segment
  let seg2: Segment

  if (segments.length < 4) return ''

  for (let i = 0; i < segments.length - 4; i += 2) {
    seg0 = segments[i]
    seg1 = segments[i + 1]
    seg2 = segments[i + 2]

    const { point: C0, radius: r0 } = seg0
    const { point: C1, radius: r1 } = seg1
    const { point: C2, radius: r2 } = seg2

    const tan1 = getOuterTangents(C0, r0, C1, r1)
    const tan2 = getOuterTangents(C2, r2, C1, r1)

    if (!(tan1 && tan2)) continue

    const [a0, a1, a0p, a1p] = tan1
    const [b0p, b1p, b0, b1] = tan2

    const u1 = vec.uni(vec.vec(a0, a1))
    const u1p = vec.uni(vec.vec(a0p, a1p))
    const u2 = vec.uni(vec.vec(b0, b1))
    const u2p = vec.uni(vec.vec(b0p, b1p))

    const i1 = getRayRayIntersection(a0, u1, b0, u2)
    const i1p = getRayRayIntersection(a0p, u1p, b0p, u2p)

    if (i === 0) {
      leftPts.push(a0)
      rightPts.push(a0p)
    }

    if (vec.dpr(u1, u2) > 0) {
      leftPts.push(a0)
      rightPts.push(a1)
    } else {
      leftPts.push(i1)
      rightPts.push(i1p)
    }
  }

  seg2 = segments[segments.length - 1]
  seg1 = segments[segments.length - 2]

  if (seg2 === seg0) {
  }
  if (seg1 === seg0) {
  } else if (seg0) {
    const { point: C1, radius: r1 } = seg1
    const { point: C2, radius: r2 } = seg2

    const tan2 = getOuterTangents(C2, r2, C1, r1)

    if (tan2) {
      const [b0p, b1p, b0, b1] = tan2

      leftPts.push(b0)
      rightPts.push(b0p)
    }
  }

  return leftPts.concat(rightPts.reverse())
}

export function globFromThreeCircles(
  C0: number[],
  r0: number,
  C1: number[],
  r1: number,
  C2: number[],
  r2: number
) {
  const [a0, a1, a0p, a1p] = getOuterTangents(C0, r0, C1, r1)
  const [b0p, b1p, b0, b1] = getOuterTangents(C2, r2, C1, r1)

  const u1 = vec.uni(vec.vec(a0, a1))
  const u1p = vec.uni(vec.vec(a0p, a1p))
  const u2 = vec.uni(vec.vec(b0, b1))
  const u2p = vec.uni(vec.vec(b0p, b1p))

  const int = getRayRayIntersection(a0, u1, b0, u2)
  const intp = getRayRayIntersection(a0p, u1p, b0p, u2p)

  const glob = getGlob(C0, r0, C2, r2, int, intp, 0.5, 0.5, 0.5, 0.5)

  return [
    moveTo(glob.E0),
    arcTo(C0, r0, glob.E0, glob.E0p),
    bezierTo(glob.F0p, glob.F1p, glob.E1p),
    arcTo(C2, r2, glob.E1p, glob.E1),
    bezierTo(glob.F1, glob.F0, glob.E0),
    // closePath(),
    // dot(a0, 0.5),
    // dot(a1, 0.5),
    // dot(b0, 0.5),
    // dot(b1, 0.5),
    // dot(a0p, 1),
    // dot(a1p, 1),
    // dot(b0p, 1),
    // dot(b1p, 1),
    // dot(int, 2),
    // dot(intp, 2),
    // line(a0, a1),
    // line(a0p, a1p),
    // line(b0, b1),
    // line(a2, a3),
    // line(b0, b1),
  ]
}

export function getRayRayIntersection(
  p0: number[],
  n0: number[],
  p1: number[],
  n1: number[]
) {
  const p0e = vec.add(p0, n0),
    p1e = vec.add(p1, n1),
    m0 = (p0e[1] - p0[1]) / (p0e[0] - p0[0]),
    m1 = (p1e[1] - p1[1]) / (p1e[0] - p1[0]),
    b0 = p0[1] - m0 * p0[0],
    b1 = p1[1] - m1 * p1[0],
    x = (b1 - b0) / (m0 - m1),
    y = m0 * x + b0

  return [x, y]
}
