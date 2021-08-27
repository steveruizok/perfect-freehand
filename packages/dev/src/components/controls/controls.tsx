import * as React from 'react'
import { Checkbox } from 'components/checkbox'
import { Slider } from 'components/slider'
import styles from './controls.module.css'
import { app, useAppState } from 'state'
import type { State } from 'types'
import { Colors } from 'components/colors'

const colors = [
  '#000000',
  '#ffc107',
  '#ff5722',
  '#e91e63',
  '#673ab7',
  '#00bcd4',
  '#efefef',
]

const appStateSelector = (s: State) => s.appState

export function Controls() {
  const appState = useAppState(appStateSelector)
  const { style } = appState

  const handleSizeChangeStart = React.useCallback(() => {
    app.setSnapshot()
  }, [])

  const handleSizeChange = React.useCallback((v: number[]) => {
    app.patchStyleForAllShapes({ size: v[0] })
  }, [])

  const handleStrokeWidthChangeStart = React.useCallback(() => {
    app.setSnapshot()
  }, [])

  const handleStrokeWidthChange = React.useCallback((v: number[]) => {
    app.patchStyleForAllShapes({ strokeWidth: v[0] })
  }, [])

  const handleThinningChangeStart = React.useCallback(() => {
    app.setSnapshot()
  }, [])

  const handleThinningChange = React.useCallback((v: number[]) => {
    app.patchStyleForAllShapes({ thinning: v[0] })
  }, [])

  const handleStreamlineChangeStart = React.useCallback(() => {
    app.setSnapshot()
  }, [])

  const handleStreamlineChange = React.useCallback((v: number[]) => {
    app.patchStyleForAllShapes({ streamline: v[0] })
  }, [])

  const handleSmoothingChangeStart = React.useCallback(() => {
    app.setSnapshot()
  }, [])

  const handleSmoothingChange = React.useCallback((v: number[]) => {
    app.patchStyleForAllShapes({ smoothing: v[0] })
  }, [])

  const handleCapStartChange = React.useCallback(
    (v: boolean | 'indeterminate') => {
      app.setNextStyleForAllShapes({ capStart: !!v })
    },
    []
  )

  const handleTaperStartChangeStart = React.useCallback(() => {
    app.setSnapshot()
  }, [])

  const handleTaperStartChange = React.useCallback((v: number[]) => {
    app.patchStyleForAllShapes({ taperStart: v[0] })
  }, [])

  const handleCapEndChange = React.useCallback(
    (v: boolean | 'indeterminate') => {
      app.setNextStyleForAllShapes({ capEnd: !!v })
    },
    []
  )

  const handleTaperEndChangeStart = React.useCallback(() => {
    app.setSnapshot()
  }, [])

  const handleTaperEndChange = React.useCallback((v: number[]) => {
    app.patchStyleForAllShapes({ taperEnd: v[0] })
  }, [])

  const handleIsFilledChange = React.useCallback(
    (v: boolean | 'indeterminate') => {
      app.setNextStyleForAllShapes({ isFilled: !!v })
    },
    []
  )

  const handleStyleChangeComplete = React.useCallback(() => {
    app.finishStyleUpdate()
  }, [])

  const handleStrokeColorChange = React.useCallback((color: string) => {
    app.patchStyle({ stroke: color })
  }, [])

  const handleFillColorChange = React.useCallback((color: string) => {
    app.patchStyle({ fill: color })
  }, [])

  // Resets

  const handleResetSize = React.useCallback(() => {
    app.resetStyle('size')
  }, [])

  const handleResetThinning = React.useCallback(() => {
    app.resetStyle('thinning')
  }, [])

  const handleResetStreamline = React.useCallback(() => {
    app.resetStyle('streamline')
  }, [])

  const handleResetSmoothing = React.useCallback(() => {
    app.resetStyle('smoothing')
  }, [])

  const handleResetTaperStart = React.useCallback(() => {
    app.resetStyle('taperStart')
  }, [])

  const handleResetTaperEnd = React.useCallback(() => {
    app.resetStyle('taperEnd')
  }, [])

  const handleResetStrokeWidth = React.useCallback(() => {
    app.resetStyle('strokeWidth')
  }, [])

  return (
    <div
      className={[
        styles.container,
        appState.isPanelOpen ? styles.open : '',
      ].join(' ')}
    >
      <div className={styles.inputs}>
        <Slider
          name="Size"
          value={[style.size]}
          min={1}
          max={100}
          step={1}
          onDoubleClick={handleResetSize}
          onValueChange={handleSizeChange}
          onPointerDown={handleSizeChangeStart}
          onPointerUp={handleStyleChangeComplete}
        />
        <Slider
          name="Thinning"
          value={[style.thinning]}
          min={-0.99}
          max={0.99}
          step={0.01}
          onDoubleClick={handleResetThinning}
          onValueChange={handleThinningChange}
          onPointerDown={handleThinningChangeStart}
          onPointerUp={handleStyleChangeComplete}
        />
        <Slider
          name="Streamline"
          value={[style.streamline]}
          min={0.01}
          max={0.99}
          step={0.01}
          onDoubleClick={handleResetStreamline}
          onValueChange={handleStreamlineChange}
          onPointerDown={handleStreamlineChangeStart}
          onPointerUp={handleStyleChangeComplete}
        />
        <Slider
          name="Smoothing"
          value={[style.smoothing]}
          min={0.01}
          max={0.99}
          step={0.01}
          onDoubleClick={handleResetSmoothing}
          onValueChange={handleSmoothingChange}
          onPointerDown={handleSmoothingChangeStart}
          onPointerUp={handleStyleChangeComplete}
        />
        <hr />
        <Checkbox
          name="Cap Start"
          checked={style.capStart}
          onCheckedChange={handleCapStartChange}
        />
        <Slider
          name="Taper Start"
          value={[style.taperStart]}
          min={0}
          max={100}
          step={1}
          onDoubleClick={handleResetTaperStart}
          onValueChange={handleTaperStartChange}
          onPointerDown={handleTaperStartChangeStart}
          onPointerUp={handleStyleChangeComplete}
        />
        <hr />
        <Checkbox
          name="Cap End"
          checked={style.capEnd}
          onCheckedChange={handleCapEndChange}
        />
        <Slider
          name="Taper End"
          value={[style.taperEnd]}
          min={0}
          max={100}
          step={1}
          onDoubleClick={handleResetTaperEnd}
          onValueChange={handleTaperEndChange}
          onPointerDown={handleTaperEndChangeStart}
          onPointerUp={handleStyleChangeComplete}
        />
        <hr />
        <Checkbox
          name="Fill"
          checked={style.isFilled}
          onCheckedChange={handleIsFilledChange}
        />
        {style.isFilled && (
          <Colors
            name=""
            color={style.fill}
            colors={colors}
            onChange={handleFillColorChange}
          />
        )}
        <Slider
          name="Stroke"
          value={[style.strokeWidth]}
          min={0}
          max={100}
          step={1}
          onDoubleClick={handleResetStrokeWidth}
          onValueChange={handleStrokeWidthChange}
          onPointerDown={handleStrokeWidthChangeStart}
          onPointerUp={handleStyleChangeComplete}
        />
        {style.strokeWidth > 0 && (
          <Colors
            name=""
            color={style.stroke}
            colors={colors}
            onChange={handleStrokeColorChange}
          />
        )}
      </div>
      <hr />
      <div className={styles.buttonsRow}>
        <button className={styles.rowButton} onClick={app.resetStyles}>
          Reset
        </button>
        <button className={styles.rowButton} onClick={app.copyStyles}>
          Copy
        </button>
      </div>
    </div>
  )
}
