import type { TLBinding, TLPage, TLPageState, TLShape } from '@tldraw/core'

export type Entries<T> = {
  [K in keyof T]: [K, T[K]]
}[keyof T][]

export type Patch<T> = Partial<{ [P in keyof T]: Patch<T[P]> }>

export type Command<T> = {
  id: string
  before: Patch<T>
  after: Patch<T>
}

export interface DrawStyles {
  size: number
  fill: string
  stroke: string
  strokeWidth: number
  easing: Easing
  thinning: number
  streamline: number
  smoothing: number
  taperStart: number | boolean
  taperEnd: number | boolean
  capStart: boolean
  capEnd: boolean
  easingStart: Easing
  easingEnd: Easing
  isFilled: boolean
}

export interface DrawShape extends TLShape {
  type: 'draw'
  points: number[][]
  style: DrawStyles
  isDone: boolean
}

export interface Doc {
  page: TLPage<DrawShape, TLBinding>
  pageState: TLPageState
}

export interface State extends Doc {
  appState: {
    status: 'idle' | 'pinching' | 'drawing' | 'erasing'
    tool: 'drawing' | 'erasing'
    editingId?: string
    style: DrawStyles
    isPanelOpen: boolean
  }
}

export interface Data extends State {
  createShape: (point: number[]) => void
  updateShape: (point: number[], pressure: number) => void
  completeShape: (point: number[], pressure: number) => void
  updateStyle: (style: Partial<DrawStyles>) => void
  load: (doc: Doc) => void
  resetDoc: () => void
  undo: () => void
  redo: () => void
}

export type Easing =
  | 'linear'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic'
  | 'easeInQuart'
  | 'easeOutQuart'
  | 'easeInOutQuart'
  | 'easeInQuint'
  | 'easeOutQuint'
  | 'easeInOutQuint'
  | 'easeInSine'
  | 'easeOutSine'
  | 'easeInOutSine'
  | 'easeInExpo'
  | 'easeOutExpo'
  | 'easeInOutExpo'
