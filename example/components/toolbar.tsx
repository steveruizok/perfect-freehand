import * as React from 'react'
import state, { useSelector } from '../state'
import Alert from './alert'
import copySvgToClipboard from '../utils/copySvgToClipboard'
import styled from 'styled-components'
import { Trash, RotateCcw, RotateCw, Settings, Clipboard } from 'react-feather'

const ToolbarContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-scrim);
  backdrop-filter: blur(30px);
  user-select: none;
  overflow: visible;
`

const ButtonGroup = styled.div`
  padding: 0 4px;
  display: flex;
  align-items: center;
  overflow: inherit;
`

const IconButton = styled.button`
  background: transparent;
  display: flex;
  border: none;
  align-items: center;
  font-size: 32px;
  padding: 8px;
  color: var(--color-text);
  cursor: pointer;
  border-radius: 4px;
  outline: none;

  &:disabled {
    opacity: 0.3;
  }

  &:hover {
    background-color: var(--color-hover);
  }
`

export default function Toolbar() {
  const clipboardMessage = useSelector(state => state.data.clipboardMessage)

  return (
    <ToolbarContainer onPointerDown={e => e.stopPropagation()}>
      <ButtonGroup>
        <IconButton onClick={() => state.send('UNDO')}>
          <RotateCcw />
        </IconButton>
        <IconButton onClick={() => state.send('REDO')}>
          <RotateCw />
        </IconButton>
      </ButtonGroup>
      <div>
        <a href="https://github.com/steveruizok/perfect-freehand">
          perfect-freehand
        </a>{' '}
        | <a href="https://twitter.com/steveruizok">@steveruizok</a>
      </div>
      <ButtonGroup>
        <Alert
          animationLength={150}
          visibilityDuration={1200}
          alertText={clipboardMessage}
          onFinish={() => state.send('SET_CLIPBOARD_MESSAGE', null)}
        >
          <IconButton
            onClick={async () => {
              state.send('SET_CLIPBOARD_MESSAGE', await copySvgToClipboard())
            }}
          >
            <Clipboard />
          </IconButton>
        </Alert>
        <IconButton onClick={() => state.send('TOGGLED_CONTROLS')}>
          <Settings />
        </IconButton>
        <IconButton onClick={() => state.send('CLEARED_CANVAS')}>
          <Trash />
        </IconButton>
      </ButtonGroup>
    </ToolbarContainer>
  )
}
