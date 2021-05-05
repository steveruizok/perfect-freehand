import { IconButton } from './styled'
import styled from 'styled-components'
import { XCircle } from 'react-feather'
import { useSelector } from 'state'
import { useState } from 'react'

export default function PenMode() {
  const penMode = useSelector(state => state.data.settings.penMode)
  const [visible, setVisible] = useState(true)

  if (!(visible && penMode && isIpadOS())) {
    return null
  }

  return (
    <Container onPointerDown={e => e.preventDefault()}>
      <Alert>
        {navigator.platform} Using an iPad pencil?&nbsp;
        <a
          href="https://discussions.apple.com/thread/251808014"
          rel="nofollow"
          target="_blank"
        >
          Turn off Scribble
        </a>
        &nbsp;to prevent missed strokes!
        <IconButton onClick={() => setVisible(false)}>
          <XCircle size={16} />
        </IconButton>
      </Alert>
    </Container>
  )
}

const Container = styled.div`
  position: absolute;
  bottom: 64px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
`

const Alert = styled.div`
  background-color: var(--color-background);
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0px 0px 26px -4px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
`

function isIpadOS() {
  return (
    navigator.maxTouchPoints &&
    navigator.maxTouchPoints > 2 &&
    /MacIntel/.test(navigator.platform)
  )
}
