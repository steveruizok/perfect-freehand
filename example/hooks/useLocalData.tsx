import * as React from 'react'
import state from '../state'

export default function useLocalData() {
  React.useEffect(() => {
    if (typeof localStorage === 'undefined') return

    const local = localStorage.getItem('pressure_lines')
    const data = local
      ? JSON.parse(local)
      : {
          alg: {},
          marks: [],
          settings: {},
        }

    setTimeout(
      () =>
        state.send('LOADED', {
          ...data,
        }),
      32
    )

    return () => {
      state.send('UNLOADED')
    }
  }, [])
}
