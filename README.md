# Perfect Freehand

Perfect freehand is a library for creating freehand paths by [@steveruizok](https://twitter.com/steveruizok).

![Screenshot](/screenshot.png)

🔗 [Demo](https://perfect-freehand-example.vercel.app/)

## Installation

```bash
npm install perfect-freehand
```

or

```bash
yarn add perfect-freehand
```

## Usage

The library exports a default function, `getStroke`, that:

- accepts an array of points and an (optional) options object
- returns a stroke as an array of points formatted as `[x, y]`

```js
import getStroke from 'perfect-freehand'
```

You may format your input points _either_ as an array or an object as shown below. In both cases, the pressure value is optional.

```js
getStroke([
  [0, 0, 0],
  [10, 5, 0.5],
  [20, 8, 0.3],
])

getStroke([
  { x: 0, y: 0, pressure: 0 },
  { x: 10, y: 5, pressure: 0.5 },
  { x: 20, y: 8, pressure: 0.3 },
])
```

### Options

The options object is optional, as are each of its properties.

| Property           | Type    | Default | Description                                     |
| ------------------ | ------- | ------- | ----------------------------------------------- |
| `size`             | number  | 8       | The base size (diameter) of the stroke.         |
| `thinning`         | number  | .5      | The effect of pressure on the stroke's size.    |
| `smoothing`        | number  | .5      | How much to soften the stroke's edges.          |
| `streamline`       | number  | .5      | How much to streamline the stroke.              |
| `simulatePressure` | boolean | true    | Whether to simulate pressure based on velocity. |

```js
getStroke(myPoints, {
  size: 8,
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
  simulatePressure: true,
})
```

> **Tip:** To create a stroke that gets thinner with pressure instead of thicker, use a negative number for the `thinning` option.

### Rendering

While `getStroke` returns an array of points representing a stroke, it's up to you to decide how you will render the stroke. The library does not export any rendering solutions.

For example, here is a function that takes in a stroke and returns SVG path data. You can use the string returned by this function in two ways. For SVG, you can pass the data into `path` element's [`d` property](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d). For HTML canvas, you can pass the string into the [`Path2D` constructor](https://developer.mozilla.org/en-US/docs/Web/API/Path2D/Path2D#using_svg_paths) and then stroke or fill the path.

```js
// Create SVG path data using the points from perfect-freehand.
function getSvgPathFromStroke(stroke) {
  const d = []

  let [p0, p1] = stroke

  d.push(`M ${p0[0]} ${p0[1]} Q`)

  for (let i = 1; i < stroke.length; i++) {
    const mpx = p0[0] + (p1[0] - p0[0]) / 2
    const mpy = p0[1] + (p1[1] - p0[1]) / 2
    d.push(`${p0[0]},${p0[1]} ${mpx},${mpy}`)
    p0 = p1
    p1 = stroke[i + 1]
  }

  d.push('Z')

  return d.join(' ')
}
```

# Example

```jsx
import * as React from 'react'
import getStroke from 'perfect-freehand'
import { getSvgPathFromStroke } from './utils'

export default function Example() {
  const [currentMark, setCurrentMark] = React.useState()

  function handlePointerDown(e) {
    setCurrentMark({
      type: e.pointerType,
      points: [[e.pageX, e.pageY, e.pressure]],
    })
  }

  function handlePointerMove(e) {
    if (e.buttons === 1) {
      setCurrentMark({
        ...currentMark,
        points: [...currentMark.points, [e.pageX, e.pageY, e.pressure]],
      })
    }
  }

  const stroke = currentMark
    ? getStroke(currentMark.points, {
        size: 16,
        thinning: 0.75,
        smoothing: 0.5,
        streamline: 0.5,
        simulatePressure: currentMark.type !== 'pen',
      })
    : []

  return (
    <svg
      width={800}
      height={600}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      style={{ touchAction: 'none' }}
    >
      {currentMark && <path d={getSvgPathFromStroke(stroke)} />}
    </svg>
  )
}
```

[![Edit perfect-freehand-example](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/perfect-freehand-example-biwyi?fontsize=14&hidenavigation=1&theme=dark)

# Advanced Usage

## Functions

For advanced usage, the library also exports smaller functions that `getStroke` uses to generate its SVG data. While you can use `getStroke`'s data to render strokes with an HTML canvas (via the Path2D element) or with SVG paths, these new functions will allow you to create paths in other rendering technologies.

#### `getStrokePoints`

Accepts an array of points (formatted either as `[x, y, pressure]` or `{ x: number, y: number, pressure: number}`) and returns a set of streamlined points as `[x, y, pressure, angle, distance, length]`. The path's total length will be the length of the last point in the array.

#### `getStrokeOutlinePoints`

Accepts an array of points (formatted as `[x, y, pressure, angle, distance, length]`, i.e. the output of `getStrokePoints`) and returns an array of points (`[x, y]`) defining the outline of a pressure-sensitive stroke.

## Rendering a Flattened Stroke

To render a stroke as a flat polygon, add the `polygon-clipping` package and use (or refer to) the following function.

```js
import getStroke from 'perfect-freehand'
import polygonClipping from 'polygon-clipping'

function getFlatSvgPathFromStroke(stroke) {

  const poly = polygonClipping.union([stroke] as any)

  const d = []

  for (let face of poly) {
    for (let pts of face) {
      let [p0, p1] = pts

      d.push(`M ${p0[0]} ${p0[1]} Q`)

      for (let i = 1; i < pts.length; i++) {
        const mpx = p0[0] + (p1[0] - p0[0]) / 2
        const mpy = p0[1] + (p1[1] - p0[1]) / 2
        d.push(`${p0[0]},${p0[1]} ${mpx},${mpy}`)
        p0 = p1
        p1 = pts[i + 1]
      }

      d.push('Z')
    }
  }

  return d.join(' ')
}
```
