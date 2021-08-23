import * as React from 'react'
import * as Label from '@radix-ui/react-label'
import {
  Root,
  Track,
  Range,
  Thumb,
  SliderOwnProps,
} from '@radix-ui/react-slider'
import styles from './slider.module.css'

interface SliderProps extends SliderOwnProps {
  value: number[]
  onPointerDown: () => void
  onPointerUp: () => void
  onDoubleClick: () => void
}

export function Slider({
  onDoubleClick,
  onPointerUp,
  onPointerDown,
  onValueChange,
  min,
  max,
  step,
  ...props
}: SliderProps) {
  const handleValueChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange?.([+e.currentTarget.value])
    },
    [onValueChange]
  )

  return (
    <>
      <Label.Root dir="ltr" htmlFor={props.name} onDoubleClick={onDoubleClick}>
        {props.name}
      </Label.Root>
      <Root
        {...props}
        className={styles.root}
        dir="ltr"
        min={min}
        max={max}
        step={step}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onValueChange={onValueChange}
      >
        <Track className={styles.track}>
          <Range className={styles.range} />
        </Track>
        {props.value.map((_, i) => (
          <Thumb className={styles.thumb} key={i}>
            <div className={styles.thumbBall} />
          </Thumb>
        ))}
      </Root>
      <input
        className={styles.numberInput}
        type="number"
        value={props.value[0]}
        min={min}
        max={max}
        step={step}
        onChange={handleValueChange}
      />
    </>
  )
}
