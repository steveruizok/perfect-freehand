export interface StrokeOptions {
  size?: number
  thinning?: number
  smoothing?: number
  streamline?: number
  easing?: (pressure: number) => number
  simulatePressure?: boolean
  start?: {
    taper?: number
    easing?: (distance: number) => number
  }
  end?: {
    taper?: number
    easing?: (distance: number) => number
  }
  isComplete?: boolean
}

export interface SplinePoint {
  point: number[]
  pressure: number
  vector: number[]
  length: number
  runningLength: number
}

export interface SpacedPoint {
  point: number[]
  pressure: number
  gradient: number[]
  runningLength: number
}
