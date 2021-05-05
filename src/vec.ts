/**
 * Negate a vector.
 * @param A
 */
export function neg(A: number[]) {
  return [-A[0], -A[1], A[2] || 1]
}

/**
 * Add vectors.
 * @param A
 * @param B
 */
export function add(A: number[], B: number[]) {
  if (A[2] !== undefined) {
    return [A[0] + B[0], A[1] + B[1], A[2] + B[2]]
  } else {
    return [A[0] + B[0], A[1] + B[1]]
  }
}

/**
 * Subtract vectors.
 * @param A
 * @param B
 */
export function sub(A: number[], B: number[]) {
  if (A[2] !== undefined) {
    return [A[0] - B[0], A[1] - B[1], A[2] - B[2]]
  } else {
    return [A[0] - B[0], A[1] - B[1]]
  }
}

/**
 * Get the vector from vectors A to B.
 * @param A
 * @param B
 */
export function vec(A: number[], B: number[]) {
  // A, B as vectors get the vector from A to B
  return sub(B, A)
}

/**
 * Vector multiplication by scalar
 * @param A
 * @param n
 */
export function mul(A: number[], n: number) {
  if (A[2] !== undefined) {
    return [A[0] * n, A[1] * n, A[2] * n]
  } else {
    return [A[0] * n, A[1] * n]
  }
}

/**
 * Vector division by scalar.
 * @param A
 * @param n
 */
export function div(A: number[], n: number) {
  if (A[2] !== undefined) {
    return [A[0] / n, A[1] / n, A[2] / n]
  } else {
    return [A[0] / n, A[1] / n]
  }
}

/**
 * Perpendicular rotation of a vector A
 * @param A
 */
export function per(A: number[]) {
  return [A[1], -A[0], A[2]]
}

/**
 * Dot product
 * @param A
 * @param B
 */
export function dpr(A: number[], B: number[]) {
  return A[0] * B[0] + A[1] * B[1]
}

/**
 * Length of the vector
 * @param A
 */
export function len(A: number[]) {
  return Math.hypot(A[0], A[1])
}

/**
 * Get normalized / unit vector.
 * @param A
 */
export function uni(A: number[]) {
  return div(A, len(A))
}

/**
 * Get normalized / unit vector.
 * @param A
 */
export function normalize(A: number[]) {
  return uni(A)
}

/**
 * Dist length from A to B
 * @param A
 * @param B
 */
export function dist(A: number[], B: number[]) {
  return Math.hypot(A[1] - B[1], A[0] - B[0])
}

/**
 * Mean between two vectors or mid vector between two vectors
 * @param A
 * @param B
 */
export function med(A: number[], B: number[]) {
  return mul(add(A, B), 0.5)
}

/**
 * Rotate a vector around another vector by r (radians)
 * @param A vector
 * @param C center
 * @param r rotation in radians
 */
export function rotAround(A: number[], C: number[], r: number) {
  const s = Math.sin(r)
  const c = Math.cos(r)

  const px = A[0] - C[0]
  const py = A[1] - C[1]

  const nx = px * c - py * s
  const ny = px * s + py * c

  return [nx + C[0], ny + C[1], A[2]]
}

/**
 * Interpolate vector A to B with a scalar t
 * @param A
 * @param B
 * @param t scalar
 */
export function lrp(A: number[], B: number[], t: number) {
  return add(A, mul(vec(A, B), t))
}

export function isEqual(A: number[], B: number[]) {
  return A[0] === B[0] && A[1] === B[1]
}
