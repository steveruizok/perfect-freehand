import * as React from 'react'
import styles from './panel.module.css'
import { Button } from 'components/button'
import { useApp, useAppState } from 'state'
import { GitHubLogoIcon } from '@radix-ui/react-icons'

export function Panel() {
  const app = useApp()
  const tool = useAppState((s) => s.appState.tool)

  return (
    <>
      <div className={[styles.container, styles.top, styles.right].join(' ')}>
        <a href="https://github.com/steveruizok/perfect-freehand">
          <GitHubLogoIcon height={24} width={24} />
        </a>
      </div>
      <div className={[styles.container, styles.bottom, styles.left].join(' ')}>
        <Button
          onClick={app.selectDrawingTool}
          data-active={tool === 'drawing'}
        >
          Draw
        </Button>
        <Button
          onClick={app.selectErasingTool}
          data-active={tool === 'erasing'}
        >
          Erase
        </Button>
      </div>
      <div
        className={[styles.container, styles.bottom, styles.right].join(' ')}
      >
        <Button onClick={app.undo}>Undo</Button>
        <Button onClick={app.redo}>Redo</Button>
        <Button onClick={app.deleteAll}>Clear</Button>
      </div>
    </>
  )
}
