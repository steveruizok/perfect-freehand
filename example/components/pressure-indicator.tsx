import { useSelector } from 'state'

export default function PressureIndicator() {
  const penMode = useSelector(state => state.data.settings.penMode)
  const lastPressure = useSelector(state => state.data.lastPressure)

  if (!penMode) return null

  return (
    <g>
      <line
        x1={72}
        y1={80}
        x2={172}
        y2={80}
        stroke="rgba(0,0,0,.1)"
        strokeWidth={4}
      />
      <line
        x1={72}
        y1={80}
        x2={72 + lastPressure * 100}
        y2={80}
        stroke="rgba(0,0,0,.5)"
        strokeWidth={4}
      />
    </g>
  )
}
