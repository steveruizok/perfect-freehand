import * as React from 'react'
import { Pointer, Keys } from 'types'
import state from '../state'

let first: number
let pointerIds = new Set<number>([])

export const pointer: Pointer = {
  x: 0,
  y: 0,
  cx: 0,
  cy: 0,
  dx: 0,
  dy: 0,
  tx: 0,
  ty: 0,
  p: 0,
  type: 'mouse',
}

const keys: Keys = {
  shift: false,
  meta: false,
  alt: false,
}

function updatePointer(e: PointerEvent | React.PointerEvent<HTMLDivElement>) {
  const dpr = window.devicePixelRatio || 1

  const x = e.pageX,
    y = e.pageY,
    cx = x * dpr,
    cy = y * dpr,
    dx = x - pointer.x,
    dy = y - pointer.y,
    type = e.pointerType as 'pen' | 'mouse' | 'touch',
    p = e.pressure === 0.5 ? 0 : e.pressure

  if (dx === 0 && dy === 0) return false

  pointer.x = x
  pointer.y = y
  pointer.cx = cx
  pointer.cy = cy
  pointer.dx = dx
  pointer.dy = dy
  pointer.tx += dx
  pointer.ty += dy
  pointer.p = p
  pointer.type = type
  keys.shift = e.shiftKey
  keys.meta = e.metaKey
  keys.alt = e.altKey

  return true
}

function handleTouchMove(e: TouchEvent | React.TouchEvent<HTMLDivElement>) {
  e.preventDefault()
}

function handlePointerMove(
  e: PointerEvent | React.PointerEvent<HTMLDivElement>
) {
  if (updatePointer(e)) {
    state.send('MOVED_POINTER', { pointer, keys })
  }
}

function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
  updatePointer(e)
  e.currentTarget.releasePointerCapture(e.pointerId)
  state.send('LIFTED_POINTER', { pointer, keys })
}

function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
  e.preventDefault()
  e.currentTarget.setPointerCapture(e.pointerId)

  if (pointerIds.size === 0) first = e.pointerId

  pointerIds.add(e.pointerId)

  updatePointer(e)

  setTimeout(() => {
    // if (pointerIds.size === 2) {
    //   if (first === e.pointerId) {
    //     state.send('UNDO')
    //   }
    // } else if (pointerIds.size === 3) {
    //   if (first === e.pointerId) {
    //     state.send('REDO')
    //   }
    // } else {
    state.send('DOWNED_POINTER', { pointer, keys })
    // }
  }, 16)
}

export default function useEvents() {
  React.useEffect(() => {
    if (typeof window === 'undefined') return

    function handleKeydown(e: KeyboardEvent) {
      keys.shift = e.shiftKey
      keys.meta = e.metaKey
      keys.alt = e.altKey
      state.send(`PRESSED_KEY_${e.key.toUpperCase()}`, { pointer, keys })
    }

    function handleKeyup(e: KeyboardEvent) {
      keys.shift = e.shiftKey
      keys.meta = e.metaKey
      keys.alt = e.altKey
    }

    function handleResize() {
      state.send('RESIZED')
    }

    window.addEventListener('keydown', handleKeydown)
    window.addEventListener('keyup', handleKeyup)
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('keydown', handleKeydown)
      window.removeEventListener('keyup', handleKeyup)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return {
    onPointerMove: handlePointerMove,
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
  }
}

export function getPointer(): Pointer {
  return pointer
}
