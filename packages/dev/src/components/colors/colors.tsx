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
              className={styles.color}
              style={{
                backgroundColor: color,
                borderBottom: color === props.color ? '3px solid #000' : 'none',
              }}
              onClick={() => props.onChange(color)}
            />
          )
        })}
      </div>
    </>
  )
}
