import * as React from 'react'
import NumberInput from './number-input'
import BooleanInput from './boolean-input'
import EnumInput from './enum-input'
import state, { useSelector } from '../state'
import styled from 'styled-components'

export default function Controls() {
  const options = useSelector(state => state.data.alg)
  const settings = useSelector(state => state.data.settings)

  return (
    <StyledControls onPointerDown={e => e.stopPropagation()}>
      <BooleanInput
        label="Clip Path"
        value={options.clip}
        onChange={v => state.send('CHANGED_OPTIONS', { clip: v })}
      />
      <BooleanInput
        label="Show Path"
        value={settings.showTrace}
        onChange={v => state.send('CHANGED_SETTINGS', { showTrace: v })}
      />
      <hr />
      <NumberInput
        label="Size"
        value={options.size}
        min={1}
        max={64}
        onChange={v => state.send('CHANGED_OPTIONS', { size: v })}
      />
      <NumberInput
        label="Thinning"
        value={options.thinning}
        min={-1}
        max={1}
        onChange={v => state.send('CHANGED_OPTIONS', { thinning: v })}
      />
      <EnumInput
        label="Easing"
        value={options.easing}
        options={['linear', 'easeIn', 'easeOut', 'easeInOut']}
        onChange={v => state.send('CHANGED_OPTIONS', { easing: v })}
      />
      <NumberInput
        value={options.smoothing}
        onChange={v => state.send('CHANGED_OPTIONS', { smoothing: v })}
        label="Smooth"
        min={0}
        max={2}
      />
      <NumberInput
        value={options.streamline}
        onChange={v => state.send('CHANGED_OPTIONS', { streamline: v })}
        label="Streamline"
        min={0}
        max={1}
      />
      <ButtonGroup>
        <button onClick={() => state.send('RESET_OPTIONS')}>Reset</button>
        <button onClick={() => state.send('TOGGLED_CONTROLS')}>Close</button>
      </ButtonGroup>
    </StyledControls>
  )
}

const StyledControls = styled.div`
  position: absolute;
  top: 44px;
  right: 0;
  width: 100%;
  max-width: 512px;
  display: grid;
  grid-template-columns: auto 1fr 48px;
  gap: 4px 8px;
  font-size: 13px;
  padding: 16px;
  background-color: var(--color-scrim);
  backdrop-filter: blur(30px);
  align-items: center;

  select {
    height: 20px;
    grid-column: span 2;
  }

  input {
    height: 20px;
  }

  hr {
    grid-column: span 3;
    width: 100%;
  }
`

const ButtonGroup = styled.div`
  padding-top: 16px;
  grid-column: 1 / span 3;
  display: grid;
  grid-auto-flow: column;
  gap: 16px;

  button {
    padding: 8px 12px;
  }
`
