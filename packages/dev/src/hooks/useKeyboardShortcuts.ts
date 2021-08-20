import * as React from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useApp } from 'state'

export function useKeyboardShortcuts() {
  const app = useApp()

  useHotkeys('command+z,ctrl+z', () => {
    app.undo()
  })

  useHotkeys('command+shift+z,ctrl+shift+z', () => {
    app.redo()
  })

  useHotkeys('e,backspace', () => {
    app.deleteAll()
  })
}
