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
  onPointerDown: () => void
  onPointerUp: () => void
  // ...
}

export function Slider({ onPointerUp, onPointerDown, ...props }: SliderProps) {
  const value = props.value || props.defaultValue || [0]

  return (
    <>
      <Label.Root htmlFor={props.name}>{props.name}</Label.Root>
      <Root
        defaultValue={[8]}
        className={styles.root}
        {...props}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <Track className={styles.track}>
          <Range className={styles.range} />
        </Track>
        {value.map((_, i) => (
          <Thumb className={styles.thumb} key={i} />
        ))}
      </Root>
      <div />
    </>
  )
}
