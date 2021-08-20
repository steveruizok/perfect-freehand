import * as React from 'react'
import styles from './button.module.css'

interface ButtonProps
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  // todo
}

export function Button(props: ButtonProps) {
  return <button className={styles.button} {...props} />
}
