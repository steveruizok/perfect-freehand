export default async function copySvgToClipboard() {
  let clipboardMessage = null

  const element = document.getElementById('drawable-svg') as any

  if (element) {
    // Get the SVG's bounding box
    var bbox = element.getBBox()
    let tViewBox = element.getAttribute('viewBox')
    var viewBox = [
      bbox.x - 16,
      bbox.y - 16,
      bbox.width + 32,
      bbox.height + 32,
    ].join(' ')
    let tW = element.getAttribute('width')
    let tH = element.getAttribute('height')

    // Resize the element to the bounding box
    element.setAttribute('viewBox', viewBox)
    element.setAttribute('width', bbox.width)
    element.setAttribute('height', bbox.height)

    // Take a snapshot of the element
    const s = new XMLSerializer()
    const svgString = s.serializeToString(element)

    // Reset the element to its original viewBox / size
    element.setAttribute('viewBox', tViewBox)
    element.setAttribute('width', tW)
    element.setAttribute('height', tH)

    await navigator.clipboard.writeText(svgString).then(
      () => {
        clipboardMessage = {
          error: false,
          message: `Copied SVG`,
        }
      },
      () => {
        clipboardMessage = {
          error: true,
          message: `Unable to copy svg`,
        }
      }
    )
  } else {
    clipboardMessage = {
      error: true,
      message: `Couldn't find svg`,
    }
  }
  return clipboardMessage
}
