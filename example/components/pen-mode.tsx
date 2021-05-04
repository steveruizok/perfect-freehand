import { IconButton } from './styled'
import styled from 'styled-components'
import { PenTool } from 'react-feather'
import state, { useSelector } from 'state'

export default function PenMode() {
  const penMode = useSelector(state => state.data.settings.penMode)

  if (!penMode) return null

  return (
    <Container onPointerDown={e => e.preventDefault()}>
      <IconButton
        onClick={e => {
          state.send('EXITED_PEN_MODE')
          e.preventDefault()
        }}
      >
        <PenTool />
      </IconButton>
    </Container>
  )
}

const Container = styled.div`
  position: absolute;
  top: 56px;
  left: 16px;
  background-color: var(--color-background);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0px 0px 26px -4px rgba(0, 0, 0, 0.2);
`
