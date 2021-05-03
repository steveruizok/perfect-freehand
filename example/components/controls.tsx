import * as React from 'react'
import NumberInput from './number-input'
import BooleanInput from './boolean-input'
import EnumInput from './enum-input'
import state, { useSelector } from '../state'
import styled from 'styled-components'
import { button, folder, Leva, useControls } from 'leva'
import { bezier } from '@leva-ui/plugin-bezier'

const LightTheme = {
  colors: {
    elevation1: '#ced1e5', // bg color of the root panel (main title bar)
    elevation2: '#fafafa', // bg color of the rows (main panel color)
    elevation3: '#f8f8f8', // bg color of the inputs
    accent1: '#3a96ff',
    accent2: '#439efe',
    accent3: '#9ac8ff',
    highlight1: '#535760',
    highlight2: '#343434',
    highlight3: '#000000',
    vivid1: '#e07810',
    toolTipBackground: '$highlight3',
    toolTipText: '$elevation2',
  },
}

const DarkTheme = {
  colors: {
    elevation1: '#292d39', // bg color of the root panel (main title bar)
    elevation2: '#181c20', // bg color of the rows (main panel color)
    elevation3: '#373c4b', // bg color of the inputs
    accent1: '#0066dc',
    accent2: '#007bff',
    accent3: '#3c93ff',
    highlight1: '#535760',
    highlight2: '#8c92a4',
    highlight3: '#fefefe',
    vivid1: '#ffcc00',
    toolTipBackground: '$highlight3',
    toolTipText: '$elevation2',
  },
}

export default function Controls() {
  const darkMode = useSelector(state => state.data.settings.darkMode)
  const options = useSelector(state => state.data.alg)
  const settings = useSelector(state => state.data.settings)

  const [, set] = useControls(() => ({
    clipPath: {
      label: 'Clip',
      value: options.clip,
      onChange: v => state.send('CHANGED_OPTIONS', { clip: v }),
    },
    showPath: {
      label: 'Stroke',
      value: options.clip,
      onChange: v => state.send('CHANGED_SETTINGS', { showTrace: v }),
    },
    size: {
      label: 'Size',
      value: options.size,
      min: 1,
      max: 64,
      step: 1,
      onChange: v => state.send('CHANGED_OPTIONS', { size: v }),
    },
    thinning: {
      label: 'Thinning',
      value: options.thinning,
      min: -1,
      max: 1,
      step: 0.01,
      onChange: v => state.send('CHANGED_OPTIONS', { thinning: v }),
    },
    smoothing: {
      label: 'Smoothing',
      value: options.smoothing,
      min: 0,
      max: 2,
      step: 0.01,
      onChange: v => state.send('CHANGED_OPTIONS', { smoothing: v }),
    },
    streamline: {
      label: 'Streamline',
      value: options.streamline,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: v => state.send('CHANGED_OPTIONS', { streamline: v }),
    },
    easing: bezier({
      label: 'Easing',
      graph: false,
      handles: [
        options.easing[0],
        options.easing[1],
        options.easing[2],
        options.easing[3],
      ],
      onChange: v => state.send('CHANGED_OPTIONS', { easing: v }),
    }),
    start: folder({
      taperStart: {
        label: 'Taper',
        value: options.taperStart,
        min: 0,
        max: 200,
        step: 1,
        onChange: v => state.send('CHANGED_OPTIONS', { taperStart: v }),
      },
      taperStartEasing: bezier({
        label: 'Easing',
        graph: false,
        handles: [
          options.taperStartEasing[0],
          options.taperStartEasing[1],
          options.taperStartEasing[2],
          options.taperStartEasing[3],
        ],
        onChange: v => state.send('CHANGED_OPTIONS', { taperStartEasing: v }),
      }),
    }),
    end: folder({
      taperEnd: {
        label: 'Taper',
        value: options.taperEnd,
        min: 0,
        max: 200,
        step: 1,
        onChange: v => state.send('CHANGED_OPTIONS', { taperEnd: v }),
      },
      taperEndEasing: bezier({
        label: 'Easing',
        graph: false,
        handles: [
          options.taperEndEasing[0],
          options.taperEndEasing[1],
          options.taperEndEasing[2],
          options.taperEndEasing[3],
        ],
        onChange: v => state.send('CHANGED_OPTIONS', { taperEndEasing: v }),
      }),
    }),
    reset: button(() => {
      state.send('RESET_OPTIONS')
      const {
        data: { settings, alg },
      } = state
      set({
        clipPath: options.clip,
        showPath: settings.showTrace,
        size: options.size,
        thinning: options.thinning,
        streamline: options.streamline,
        taperStart: options.taperStart,
        taperEnd: options.taperEnd,
      })
    }),
  }))

  return (
    <StyledControls onPointerDown={e => e.stopPropagation()}>
      <Leva
        flat={true}
        fill={true}
        collapsed={true}
        theme={darkMode ? DarkTheme : LightTheme}
      />
    </StyledControls>
  )
}

{
  /* <StyledControls onPointerDown={e => e.stopPropagation()}>>
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
      <NumberInput
        value={options.smoothing}
        onChange={v => state.send('CHANGED_OPTIONS', { smoothing: v })}
        label="Smoothing"
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
      <EnumInput
        label="Easing"
        value={options.easing}
        options={['linear', 'easeIn', 'easeOut', 'easeInOut']}
        onChange={v => state.send('CHANGED_OPTIONS', { easing: v })}
      />
      <NumberInput
        value={options.taperStart}
        onChange={v => state.send('CHANGED_OPTIONS', { taperStart: v })}
        label="Taper Start"
        min={0}
        max={100}
      />
      <EnumInput
        label="Taper Start Easing"
        value={options.taperStartEasing}
        options={['linear', 'easeIn', 'easeOut', 'easeInOut']}
        onChange={v => state.send('CHANGED_OPTIONS', { taperStartEasing: v })}
      />
      <NumberInput
        value={options.taperEnd}
        onChange={v => state.send('CHANGED_OPTIONS', { taperEnd: v })}
        label="Taper End"
        min={0}
        max={100}
      />
      <EnumInput
        label="Taper End Easing"
        value={options.taperEndEasing}
        options={['linear', 'easeIn', 'easeOut', 'easeInOut']}
        onChange={v => state.send('CHANGED_OPTIONS', { taperEndEasing: v })}
      />
      <ButtonGroup>
        <button onClick={() => state.send('RESET_OPTIONS')}>Reset</button>
        <button onClick={() => state.send('TOGGLED_CONTROLS')}>Close</button>
      </ButtonGroup> 
    </StyledControls>*/
}

const StyledControls = styled.div`
  position: absolute;
  top: 56px;
  right: 16px;
  width: 320px;
  height: 400px;
  overflow: visible;
  pointer-events: none;

  & > * {
    position: absolute;
    top: 0px;
    right: 0px;
    pointer-events: all;
    border: 1px solid var(--color-scrim);
  }
`
