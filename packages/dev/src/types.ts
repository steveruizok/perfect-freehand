import type { TLBinding, TLPage, TLPageState, TLShape } from '@tldraw/core'

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
  thinning: number
  streamline: number
  smoothing: number
  taperStart: number
  taperEnd: number
  capStart: boolean
  capEnd: boolean
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
  }
}

export interface Data extends State {
  createShape: (point: number[]) => void
  updateShape: (point: number[], pressure: number) => void
  completeShape: (point: number[], pressure: number) => void
  updateStyle: (style: Partial<DrawStyles>) => void
  load: (doc: Doc) => void
  deleteAll: () => void
  undo: () => void
  redo: () => void
}
