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
  return <App />
}

export default AppWrapper
