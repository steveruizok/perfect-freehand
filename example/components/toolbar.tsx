import * as React from 'react'
import state, { useSelector } from '../state'
import Alert from './alert'
import styled from 'styled-components'
import {
  Sun,
  Trash,
  RotateCcw,
  RotateCw,
  Clipboard,
  GitHub,
} from 'react-feather'

const ToolbarContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
  overflow: visible;
  font-size: 14px;
  z-index: 10;
  touch-action: manipulation;
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
          <RotateCcw size={18} />
        </IconButton>
        <IconButton onClick={() => state.send('REDO')}>
          <RotateCw size={18} />
        </IconButton>
        <IconButton onClick={() => state.send('CLEARED_CANVAS')}>
          <Trash size={18} />
        </IconButton>
      </ButtonGroup>
      <div>
        <a
          href="https://github.com/steveruizok/perfect-freehand"
          target="_blank"
          rel="nofollow noopener"
        >
          perfect-freehand
        </a>
      </div>
      <ButtonGroup>
        <IconButton
          as="a"
          href="https://github.com/steveruizok/perfect-freehand"
          target="_blank"
          rel="nofollow noopener"
        >
          <GitHub size={18} />
        </IconButton>
        <Alert
          animationLength={150}
          visibilityDuration={1200}
          alertText={clipboardMessage}
          onFinish={() => state.send('CLEARED_CLIPBOARD_MESSAGE', null)}
        >
          <IconButton onClick={async () => state.send('COPIED_TO_CLIPBOARD')}>
            <Clipboard size={18} />
          </IconButton>
        </Alert>
        <IconButton onClick={() => state.send('TOGGLED_DARK_MODE')}>
          <Sun size={18} />
        </IconButton>
      </ButtonGroup>
    </ToolbarContainer>
  )
}
