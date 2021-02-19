export default function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
}) {
  return (
    <>
      <label>{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={(max - min) / 100}
        value={value}
        style={{ width: '100%' }}
        onChange={e => onChange(Number(e.currentTarget.value))}
      />
      <input
        type="number"
        min={min}
        max={max}
        step={(max - min) / 100}
        value={value}
        onChange={e => onChange(Number(e.currentTarget.value))}
      />
    </>
  )
}
