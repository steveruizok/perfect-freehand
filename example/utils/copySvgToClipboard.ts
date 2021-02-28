export default async function() {
  const element = document.getElementById('drawable-svg')

  let clipboardMessage = null
  if (element) {
    const s = new XMLSerializer()
    const svgString = s.serializeToString(element)

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
