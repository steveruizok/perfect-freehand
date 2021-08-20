import * as React from 'react'
import { Editor } from 'components/editor'
import { Controls } from 'components/controls'
import { Panel } from 'components/panel'
import { AppState, context, initialState } from 'state'
import { useKeyboardShortcuts } from 'hooks'

function App(): JSX.Element {
  useKeyboardShortcuts()

  return (
    <div className="app">
      <Editor />
      <Controls />
      <Panel />
    </div>
  )
}

const AppWrapper: React.FC = () => {
  const [appState] = React.useState(() => new AppState(initialState, 'state'))

  return (
    <context.Provider value={appState}>
      <App />
    </context.Provider>
  )
}

export default AppWrapper
