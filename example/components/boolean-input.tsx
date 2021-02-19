export default function BooleanInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (n: boolean) => void
}) {
  return (
    <>
      <label>{label}</label>
      <input
        type="checkbox"
        checked={value}
        onChange={e => onChange(Boolean(e.currentTarget.checked))}
      />
      <span>{String(value)}</span>
    </>
  )
}
