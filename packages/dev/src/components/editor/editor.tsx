import * as React from 'react'
import { Renderer, TLPointerInfo } from '@tldraw/core'
import { context, useApp, useAppState } from 'state'
import styles from './editor.module.css'

export function Editor(): JSX.Element {
  const {
    onPinch,
    onPinchStart,
    onPinchEnd,
    onPan,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    shapeUtils,
  } = useApp()
  const { page, pageState } = useAppState()

  return (
    <div className={styles.container}>
      <Renderer
        page={page}
        pageState={pageState}
        shapeUtils={shapeUtils}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPinch={onPinch}
        onPinchStart={onPinchStart}
        onPinchEnd={onPinchEnd}
        onPan={onPan}
      />
    </div>
  )
}
