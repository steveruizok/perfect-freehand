export interface StrokeOptions {
  size?: number
  thinning?: number
  smoothing?: number
  streamline?: number
  easing?: (pressure: number) => number
  simulatePressure?: boolean
  start?: {
    cap?: boolean
    taper?: number
    easing?: (distance: number) => number
  }
  end?: {
    cap?: boolean
    taper?: number
    easing?: (distance: number) => number
  }
  last?: boolean
}

export interface StrokePoint {
  point: number[]
  pressure: number
  distance: number
  vector: number[]
  runningLength: number
}

export type InputPoint = { x: number; y: number; pressure?: number } | number[]
