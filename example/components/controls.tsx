import * as React from 'react'
import NumberInput from './number-input'
import BooleanInput from './boolean-input'
import state, { useSelector } from '../state'
import styled from 'styled-components'

const StyledControls = styled.div`
  position: absolute;
  top: 44px;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: auto 1fr 48px;
  gap: 4px 8px;
  font-size: 13px;
  padding: 16px 8px;
  background-color: var(--color-scrim);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(30px);
`

const ButtonGroup = styled.div`
  grid-column: 1 / span 3;
  display: grid;
  grid-auto-flow: column;
  gap: 16px;

  button {
    padding: 8px 12px;
  }
`

export default function Controls() {
  const options = useSelector(state => state.data.alg)
  const settings = useSelector(state => state.data.settings)

  return (
    <StyledControls onPointerDown={e => e.stopPropagation()}>
      <BooleanInput
        label="Simulate Pressure"
        value={options.simulatePressure}
        onChange={v => state.send('CHANGED_OPTIONS', { simulatePressure: v })}
      />
      <NumberInput
        value={options.streamline}
        onChange={v => state.send('CHANGED_OPTIONS', { streamline: v })}
        label="Streamline"
        min={0}
        max={1}
      />
      <NumberInput
        label="Min Size"
        value={options.minSize}
        min={1}
        max={64}
        onChange={v => state.send('CHANGED_OPTIONS', { minSize: v })}
      />
      <NumberInput
        label="Max Size"
        value={options.maxSize}
        min={1}
        max={64}
        onChange={v => state.send('CHANGED_OPTIONS', { maxSize: v })}
      />

      <NumberInput
        value={options.smooth}
        onChange={v => state.send('CHANGED_OPTIONS', { smooth: v })}
        label="smooth"
        min={0}
        max={50}
      />
      <BooleanInput
        label="Dark Mode"
        value={settings.darkMode}
        onChange={v => state.send('TOGGLED_DARK_MODE')}
      />
      <BooleanInput
        label="Show Path"
        value={settings.showTrace}
        onChange={v => state.send('CHANGED_SETTINGS', { showTrace: v })}
      />
      <ButtonGroup>
        <button onClick={() => state.send('RESET_OPTIONS')}>Reset</button>
        <button onClick={() => state.send('TOGGLED_CONTROLS')}>Close</button>
      </ButtonGroup>
    </StyledControls>
  )
}
