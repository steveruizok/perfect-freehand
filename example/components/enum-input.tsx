export default function EnumInput({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (n: string) => void
}) {
  return (
    <>
      <label>{label}</label>
      <select value={value} onChange={e => onChange(e.currentTarget.value)}>
        {options.map((option, i) => (
          <option key={i}>{option}</option>
        ))}
      </select>
    </>
  )
}
