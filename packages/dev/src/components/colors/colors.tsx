import * as React from 'react'
import * as Label from '@radix-ui/react-label'
import styles from './colors.module.css'

interface ColorsProps {
  name: string
  colors: string[]
  color: string
  onChange: (color: string) => void
}

export function Colors(props: ColorsProps) {
  return (
    <>
      <Label.Root htmlFor={props.name}>{props.name}</Label.Root>
      <div className={styles.grid}>
        {props.colors.map((color) => {
          return (
            <button
              key={color}
              className={
                color === props.color
                  ? [styles.color, styles.selected].join(' ')
                  : styles.color
              }
              style={{
                backgroundColor: color,
              }}
              onClick={() => props.onChange(color)}
            />
          )
        })}
      </div>
    </>
  )
}
