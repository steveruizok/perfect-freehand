import { useRef, useState, useEffect } from 'react'
import styled from 'styled-components'
import { useStateDesigner } from '@state-designer/react'

const PADDING = 32

export default function Bezier({
  label,
  value,
  onChange,
}: {
  label: string
  value: number[]
  onChange: (v: number[]) => void
}) {
  function handleChange(v: number, i: number) {
    let next = [...value]
    next[i] = v
    onChange(next)
  }

  const state = useStateDesigner({
    data: {
      value,
      draggingKnob: 1,
      pointer: {
        x: 0,
        y: 0,
      },
    },
    on: {
      UPDATED_VALUE_FROM_PROPS: 'setValue',
      MOVED_POINTER: { secretlyDo: 'updatePointer' },
    },
    initial: 'idle',
    states: {
      idle: {
        on: {
          CLICKED_BACKGROUND: {
            to: 'draggingKnob',
          },
          STARTED_DRAGGING_KNOB: {
            do: 'setDraggingKnob',
            to: 'draggingKnob',
          },
          RESET_KNOB: {
            do: ['setDraggingKnob', 'resetDraggingKnob', 'shareValue'],
          },
        },
      },
      draggingKnob: {
        onEnter: ['updateDraggingKnob', 'shareValue'],
        on: {
          MOVED_POINTER: {
            do: ['updateDraggingKnob', 'shareValue'],
          },
          STOPPED_DRAGGING: {
            to: 'idle',
          },
        },
      },
    },
    actions: {
      setDraggingKnob(data, payload: number) {
        data.draggingKnob = payload
      },
      updateDraggingKnob(data) {
        const {
          value,
          draggingKnob,
          pointer: { x, y },
        } = data
        if (draggingKnob === 0 || draggingKnob === 3) {
          value[draggingKnob * 2 + 1] = Math.max(Math.min(y, 1), 0)
        } else {
          value[draggingKnob * 2] = x
          value[draggingKnob * 2 + 1] = y
        }
      },
      resetDraggingKnob(data) {
        data.value[data.draggingKnob * 2] = 0
        data.value[data.draggingKnob * 2 + 1] = 0
      },
      updatePointer(data, payload: { x: number; y: number }) {
        data.pointer = payload
      },
      setValue(data, payload: number[]) {
        data.value = payload
      },
      shareValue(data) {
        onChange([...data.value])
      },
    },
  })

  const rContainer = useRef<HTMLDivElement>(null)
  const [rect, setRect] = useState([0, 0, 200, 128])

  useEffect(() => {
    state.send('UPDATED_VALUE_FROM_PROPS', value)

    const elm = rContainer.current!
    const rect = elm.getBoundingClientRect()
    setRect([rect.x, rect.y, rect.width, rect.height])
  }, [value])

  const [x0, y0, x1, y1, x2, y2, x3, y3] = state.data.value

  const w = rect[2] - PADDING * 2
  const h = rect[3] - PADDING * 2

  const cx0 = PADDING + x0 * w
  const cy0 = PADDING + (1 - y0) * h

  const cx1 = PADDING + x1 * w
  const cy1 = PADDING + (1 - y1) * h

  const cx2 = PADDING + x2 * w
  const cy2 = PADDING + (1 - y2) * h

  const cx3 = PADDING + x3 * w
  const cy3 = PADDING + (1 - y3) * h

  const path = `M ${cx0},${cy0} C ${cx1},${cy1} ${cx2},${cy2} ${cx3},${cy3}`

  return (
    <>
      <label>{label}</label>
      <Container ref={rContainer}>
        <svg
          width={rect[2]}
          height={rect[3]}
          viewBox={`0 0 ${rect[2]} ${rect[3]}`}
          onPointerMove={({ pageX, pageY }) => {
            state.send('MOVED_POINTER', {
              x: (pageX - PADDING - rect[0]) / w,
              y: 1 - (pageY - PADDING - rect[1]) / h,
            })
          }}
          onPointerUp={() => state.send('STOPPED_DRAGGING')}
        >
          <rect
            x={PADDING}
            y={PADDING}
            width={w}
            height={h}
            fill="transparent"
            stroke="rgba(144, 144, 144, .2)"
          />
          <g opacity=".5">
            <text
              x={PADDING}
              y={'50%'}
              textAnchor="left"
              transform={`translate(-${PADDING * 1.7}, ${h *
                1.25}) rotate(-90)`}
            >
              Size
            </text>
            <text x={'50%'} y={rect[3] - PADDING / 2} textAnchor="middle">
              Pressure
            </text>
          </g>
          <line x1={cx0} y1={cy0} x2={cx1} y2={cy1} />
          <line x1={cx2} y1={cy2} x2={cx3} y2={cy3} />
          <path opacity={0.5} d={path} strokeWidth={2} />
          <circle
            cx={cx0}
            cy={cy0}
            r={8}
            onPointerDown={() => state.send('STARTED_DRAGGING_KNOB', 0)}
            onDoubleClick={() => state.send('RESET_KNOB', 0)}
          />
          <circle
            cx={cx1}
            cy={cy1}
            r={8}
            onPointerDown={() => state.send('STARTED_DRAGGING_KNOB', 1)}
            onDoubleClick={() => state.send('RESET_KNOB', 1)}
          />
          <circle
            cx={cx2}
            cy={cy2}
            r={8}
            onPointerDown={() => state.send('STARTED_DRAGGING_KNOB', 2)}
            onDoubleClick={() => state.send('RESET_KNOB', 2)}
          />
          <circle
            cx={cx3}
            cy={cy3}
            r={8}
            onPointerDown={() => state.send('STARTED_DRAGGING_KNOB', 3)}
            onDoubleClick={() => state.send('RESET_KNOB', 3)}
          />
        </svg>
      </Container>
      <Values>
        <input
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={y0}
          onChange={e => handleChange(Number(e.currentTarget.value), 1)}
        />
        <input
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={x1}
          onChange={e => handleChange(Number(e.currentTarget.value), 2)}
        />
        <input
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={y1}
          onChange={e => handleChange(Number(e.currentTarget.value), 3)}
        />
        <input
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={x2}
          onChange={e => handleChange(Number(e.currentTarget.value), 4)}
        />
        <input
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={y2}
          onChange={e => handleChange(Number(e.currentTarget.value), 5)}
        />
        <input
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={y3}
          onChange={e => handleChange(Number(e.currentTarget.value), 7)}
        />
      </Values>
    </>
  )
}

const Container = styled.div`
  height: 160px;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(144, 144, 144, 0.5);
  grid-column: span 2;

  svg {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: var(--color-background);
    user-select: none;
  }

  text,
  circle {
    fill: var(--color-text);
  }

  line,
  path {
    stroke-width: 2px;
    stroke: var(--color-text);
    fill: transparent;
  }
`

const Values = styled.div`
  grid-column: 2 / span 2;
  display: grid;
  grid-template-columns: repeat(6, 1fr);

  input {
    width: 100%;
  }
`
