import * as React from 'react'
import state from '../state'

export default function useLocalData() {
  React.useEffect(() => {
    if (typeof localStorage === 'undefined') return

    const local = localStorage.getItem('perfect-freehand-demo-2')

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

    const unsub = state.onUpdate(d => {
      if (d.isIn('up')) {
        localStorage.setItem(
          'perfect-freehand-demo-2',
          JSON.stringify({
            alg: d.data.alg,
            marks: d.data.marks,
            settings: d.data.settings,
          })
        )
      }
    })

    return () => {
      unsub()
      state.send('UNLOADED')
    }
  }, [])
}
