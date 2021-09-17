import * as React from 'react'
import * as Label from '@radix-ui/react-label'
import styles from './select.module.css'

interface SelectProps {
  name: string
  value: string
  children: React.ReactNode
  onDoubleClick: () => void
  onValueChange: (value: string) => void
}

export function Select({
  onValueChange,
  onDoubleClick,
  name,
  value,
  children,
}: SelectProps) {
  const handleValueChange = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onValueChange?.(e.currentTarget.value)
    },
    [onValueChange]
  )

  return (
    <>
      <Label.Root dir="ltr" htmlFor={name} onDoubleClick={onDoubleClick}>
        {name}
      </Label.Root>
      <div className={styles.select}>
        <select name={name} value={value} onChange={handleValueChange}>
          {children}
        </select>
      </div>
    </>
  )
}
