import * as React from 'react'
import { Renderer } from '@tldraw/core'
import { app, useAppState } from 'state'
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
  } = app
  const { page, pageState } = useAppState()

  return (
    <div className={styles.container}>
      <Renderer
        page={page}
        pageState={pageState}
        shapeUtils={shapeUtils as any}
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
