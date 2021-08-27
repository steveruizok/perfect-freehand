import * as React from 'react'
import styles from './panel.module.css'
import { app, useAppState } from 'state'
import { GitHubLogoIcon, HamburgerMenuIcon } from '@radix-ui/react-icons'

export function Panel() {
  const tool = useAppState((s) => s.appState.tool)

  return (
    <>
      <div className={[styles.top, styles.center].join(' ')}>
        <a
          href="https://github.com/steveruizok/perfect-freehand"
          target="_blank"
          rel="noopener nofollow"
        >
          perfect-freehand
        </a>
      </div>
      <div className={[styles.container, styles.top, styles.left].join(' ')}>
        <a onClick={app.togglePanelOpen}>
          <HamburgerMenuIcon height={24} width={24} color="black" />
        </a>
      </div>
      <div className={[styles.container, styles.top, styles.right].join(' ')}>
        <a
          href="https://github.com/steveruizok/perfect-freehand"
          target="_blank"
          rel="noopener nofollow"
        >
          <GitHubLogoIcon height={24} width={24} />
        </a>
      </div>
      <div className={[styles.container, styles.bottom, styles.left].join(' ')}>
        <button
          onClick={app.selectDrawingTool}
          data-active={tool === 'drawing'}
        >
          Draw
        </button>
        <button
          onClick={app.selectErasingTool}
          data-active={tool === 'erasing'}
        >
          Erase
        </button>
      </div>
      <div
        className={[styles.container, styles.bottom, styles.right].join(' ')}
      >
        <button onClick={app.undo}>Undo</button>
        <button onClick={app.redo}>Redo</button>
        <button onClick={app.deleteAll}>Clear</button>
      </div>
    </>
  )
}
