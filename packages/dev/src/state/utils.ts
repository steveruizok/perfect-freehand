function cross(x: number[], y: number[], z: number[]): number {
  return (y[0] - x[0]) * (z[1] - x[1]) - (z[0] - x[0]) * (y[1] - x[1])
}

export function pointInPolygon(p: number[], points: number[][]): boolean {
  let wn = 0 // winding number

  points.forEach((a, i) => {
    const b = points[(i + 1) % points.length]
    if (a[1] <= p[1]) {
      if (b[1] > p[1] && cross(a, b, p) > 0) {
        wn += 1
      }
    } else if (b[1] <= p[1] && cross(a, b, p) < 0) {
      wn -= 1
    }
  })

  return wn !== 0
}

export function copyTextToClipboard(string: string) {
  try {
    navigator.clipboard.writeText(string)
  } catch (e) {
    const textarea = document.createElement('textarea')
    textarea.setAttribute('position', 'fixed')
    textarea.setAttribute('top', '0')
    textarea.setAttribute('readonly', 'true')
    textarea.setAttribute('contenteditable', 'true')
    textarea.style.position = 'fixed'
    textarea.value = string
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()

    try {
      const range = document.createRange()
      range.selectNodeContents(textarea)

      const sel = window.getSelection()
      if (!sel) return

      sel.removeAllRanges()
      sel.addRange(range)

      textarea.setSelectionRange(0, textarea.value.length)
    } catch (err) {
      console.log('could not copy to clipboard')
      null // Could not copy to clipboard
    } finally {
      document.body.removeChild(textarea)
    }
  }
}
