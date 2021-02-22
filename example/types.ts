export interface Mark {
  type: 'pen' | 'mouse' | 'touch'
  points: number[][]
  path: string
}

export interface CompleteMark extends Mark {
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
