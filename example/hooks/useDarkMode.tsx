import { useSelector } from '../state'
import * as React from 'react'

export default function useDarkMode() {
  const darkMode = useSelector(state => state.data.settings.darkMode)
  React.useEffect(() => {
    if (typeof window === 'undefined') return

    if (typeof document !== 'undefined') {
      if (darkMode) {
        document.body.classList.add('dark')
      } else {
        document.body.classList.remove('dark')
      }
    }
  }, [darkMode])
}
