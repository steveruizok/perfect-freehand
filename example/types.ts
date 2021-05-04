export interface Mark {
  simulatePressure: boolean
  points: {
    x: number
    y: number
    pressure: number
  }[]
  path: string
}

export interface Keys {
  shift: boolean
  meta: boolean
  alt: boolean
}

export interface Point {
  x: number
  y: number
}

export interface Pointer extends Point {
  cx: number
  cy: number
  dx: number
  dy: number
  tx: number
  ty: number
  p: number
  type: 'pen' | 'mouse' | 'touch'
}

export interface ClipboardMessage {
  error: boolean
  message: string
}
