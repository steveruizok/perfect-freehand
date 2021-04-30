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

export default function useEvents() {
  React.useEffect(() => {
    if (typeof window === 'undefined') return

    let keys: Keys = {
      shift: false,
      meta: false,
      alt: false,
    }

    const dpr = window.devicePixelRatio || 1

    function updatePointer(e: PointerEvent) {
      const x = e.pageX,
        y = e.pageY,
        cx = x * dpr,
        cy = y * dpr,
        dx = x - pointer.x,
        dy = y - pointer.y,
        type = e.pointerType as 'pen' | 'mouse' | 'touch',
        p = e.pressure

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

    function handlePointerMove(e: PointerEvent) {
      if (updatePointer(e)) {
        state.send('MOVED_POINTER', { pointer, keys })
      }
    }

    function handlePointerDown(e: PointerEvent) {
      e.preventDefault()
      document.body.setPointerCapture(e.pointerId)
      if (pointerIds.size === 0) first = e.pointerId
      pointerIds.add(e.pointerId)

      setTimeout(() => {
        if (pointerIds.size === 2) {
          if (first === e.pointerId) {
            state.send('UNDO')
          }
        } else if (pointerIds.size === 3) {
          if (first === e.pointerId) {
            state.send('REDO')
          }
        } else {
          updatePointer(e)
          pointer.p = e.pointerType === 'pen' ? e.pressure : 0
          state.send('DOWNED_POINTER', { pointer, keys })
        }
      }, 16)
    }

    function handlePointerUp(e: PointerEvent) {
      document.body.releasePointerCapture(e.pointerId)
      updatePointer(e)
      pointerIds.delete(e.pointerId)
      pointer.p = e.pointerType === 'pen' ? e.pressure : 0
      state.send('LIFTED_POINTER', { pointer, keys })
    }

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

    window.addEventListener('pointermove', handlePointerMove)
    document.body.addEventListener('pointerdown', handlePointerDown)
    document.body.addEventListener('pointerup', handlePointerUp)
    document.body.addEventListener('pointerleave', handlePointerUp)
    window.addEventListener('keydown', handleKeydown)
    window.addEventListener('keyup', handleKeyup)
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      document.body.removeEventListener('pointerdown', handlePointerDown)
      document.body.removeEventListener('pointerup', handlePointerUp)
      document.body.removeEventListener('pointerleave', handlePointerUp)
      window.removeEventListener('keydown', handleKeydown)
      window.removeEventListener('keyup', handleKeyup)
      window.removeEventListener('resize', handleResize)
    }
  }, [])
}

export function getPointer(): Pointer {
  return pointer
}
