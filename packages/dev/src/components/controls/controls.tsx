import * as React from 'react'
import { Colors } from 'components/colors'
import { Checkbox } from 'components/checkbox'
import { Select } from 'components/select'
import { Slider } from 'components/slider'
import styles from './controls.module.css'
import { app, useAppState } from 'state'
import type { Easing, State } from 'types'

const COLORS = [
  '#000000',
  '#ffc107',
  '#ff5722',
  '#e91e63',
  '#673ab7',
  '#00bcd4',
  '#efefef',
]

const EASINGS = [
  'linear',
  'easeInQuad',
  'easeOutQuad',
  'easeInOutQuad',
  'easeInCubic',
  'easeOutCubic',
  'easeInOutCubic',
  'easeInQuart',
  'easeOutQuart',
  'easeInOutQuart',
  'easeInQuint',
  'easeOutQuint',
  'easeInOutQuint',
  'easeInSine',
  'easeOutSine',
  'easeInOutSine',
  'easeInExpo',
  'easeOutExpo',
  'easeInOutExpo',
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

  const handleEasingChange = React.useCallback((easing: string) => {
    app.patchStyleForAllShapes({ easing: easing as Easing })
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

  const handleEasingStartChange = React.useCallback((easing: string) => {
    app.patchStyleForAllShapes({ easingStart: easing as Easing })
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

  const handleEasingEndChange = React.useCallback((easing: string) => {
    app.patchStyleForAllShapes({ easingEnd: easing as Easing })
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

  const handleResetEasing = React.useCallback(() => {
    app.resetStyle('easing')
  }, [])

  const handleResetTaperStart = React.useCallback(() => {
    app.resetStyle('taperStart')
  }, [])

  const handleResetEasingStart = React.useCallback(() => {
    app.resetStyle('easingStart')
  }, [])

  const handleResetTaperEnd = React.useCallback(() => {
    app.resetStyle('taperEnd')
  }, [])

  const handleResetEasingEnd = React.useCallback(() => {
    app.resetStyle('easingEnd')
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
          min={0}
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
        <Select
          name="Easing"
          value={style.easing}
          onValueChange={handleEasingChange}
          onDoubleClick={handleResetEasing}
        >
          {EASINGS.map((easing) => (
            <option key={easing} value={easing}>
              {easing[0].toUpperCase() + easing.slice(1)}
            </option>
          ))}
        </Select>
        <hr />
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
        {style.taperStart <= 0 && (
          <Checkbox
            name="Cap Start"
            disabled={style.taperStart > 0}
            checked={style.taperStart === 0 && style.capStart}
            onCheckedChange={handleCapStartChange}
          />
        )}
        {style.taperStart > 0 && (
          <Select
            name="Easing Start"
            value={style.easingStart}
            onValueChange={handleEasingStartChange}
            onDoubleClick={handleResetEasingStart}
          >
            {EASINGS.map((easing) => (
              <option key={easing} value={easing}>
                {easing[0].toUpperCase() + easing.slice(1)}
              </option>
            ))}
          </Select>
        )}
        <hr />
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
        {style.taperEnd <= 0 && (
          <Checkbox
            name="Cap End"
            disabled={style.taperEnd > 0}
            checked={style.taperEnd === 0 && style.capEnd}
            onCheckedChange={handleCapEndChange}
          />
        )}
        {style.taperEnd > 0 && (
          <Select
            name="Easing End"
            value={style.easingEnd}
            onValueChange={handleEasingEndChange}
            onDoubleClick={handleResetEasingEnd}
          >
            {EASINGS.map((easing) => (
              <option key={easing} value={easing}>
                {easing[0].toUpperCase() + easing.slice(1)}
              </option>
            ))}
          </Select>
        )}
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
            colors={COLORS}
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
            colors={COLORS}
            onChange={handleStrokeColorChange}
          />
        )}
      </div>
      <hr />
      <div className={styles.buttonsRow}>
        <button className={styles.rowButton} onClick={app.resetStyles}>
          Reset Options
        </button>
        <button className={styles.rowButton} onClick={app.copyStyles}>
          Copy Options
        </button>
      </div>
      <hr />
      <div className={styles.buttonsRow}>
        <button className={styles.rowButton} onClick={app.copySvg}>
          Copy to SVG
        </button>
      </div>
    </div>
  )
}
