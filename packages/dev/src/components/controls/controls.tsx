import * as React from 'react'
import { Checkbox } from 'components/checkbox'
import { Slider } from 'components/slider'
import styles from './controls.module.css'
import { useApp, useAppState } from 'state/app-state'
import type { State } from 'types'
import { Colors } from 'components/colors'

const colors = [
  '#ffc107',
  '#ff5722',
  '#e91e63',
  '#673ab7',
  '#00bcd4',
  '#8bc34a',
  '#efefef',
  '#777777',
  '#000000',
]

const appStateSelector = (s: State) => s.appState

export function Controls() {
  const app = useApp()
  const state = useAppState(appStateSelector)
  const { style } = state

  const handleSizeChangeStart = React.useCallback(() => {
    app.startStyleUpdate('size')
  }, [])

  const handleSizeChange = React.useCallback((v: number[]) => {
    app.patchStyleForAllShapes({ size: v[0] })
  }, [])

  const handleStrokeWidthChangeStart = React.useCallback(() => {
    app.startStyleUpdate('strokeWidth')
  }, [])

  const handleStrokeWidthChange = React.useCallback((v: number[]) => {
    app.patchStyleForAllShapes({ strokeWidth: v[0] })
  }, [])

  const handleThinningChangeStart = React.useCallback(() => {
    app.startStyleUpdate('thinning')
  }, [])

  const handleThinningChange = React.useCallback((v: number[]) => {
    app.patchStyleForAllShapes({ thinning: v[0] })
  }, [])

  const handleStreamlineChangeStart = React.useCallback(() => {
    app.startStyleUpdate('streamline')
  }, [])

  const handleStreamlineChange = React.useCallback((v: number[]) => {
    app.patchStyleForAllShapes({ streamline: v[0] })
  }, [])

  const handleSmoothingChangeStart = React.useCallback(() => {
    app.startStyleUpdate('smoothing')
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
    app.startStyleUpdate('taperStart')
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
    app.startStyleUpdate('taperEnd')
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

  const handleColorChange = React.useCallback((color: string) => {
    app.patchStyle({ color })
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.inputs}>
        <Slider
          name="Size"
          value={[style.size]}
          min={1}
          max={100}
          step={1}
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
          onValueChange={handleTaperEndChange}
          onPointerDown={handleTaperEndChangeStart}
          onPointerUp={handleStyleChangeComplete}
        />
        <hr />
        <Slider
          name="CSS Stroke"
          value={[style.strokeWidth]}
          min={0}
          max={100}
          step={1}
          onValueChange={handleStrokeWidthChange}
          onPointerDown={handleStrokeWidthChangeStart}
          onPointerUp={handleStyleChangeComplete}
        />
        <Checkbox
          name="Fill"
          checked={style.isFilled}
          onCheckedChange={handleIsFilledChange}
        />
        <Colors
          name="Color"
          color={style.color}
          colors={colors}
          onChange={handleColorChange}
        />
      </div>
    </div>
  )
}
