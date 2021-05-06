# ![Screenshot](screenshot.svg 'Perfect Freehand')

Draw perfect pressure-sensitive freehand strokes.

🔗 [Demo](https://perfect-freehand-example.vercel.app/)

💰 Want to use this library in your commercial product? [Contact me here](steveruizok+perfectfreehand@gmail.com).

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Support](#support)
- [Discussion](#discussion)
- [Author](#author)

## Installation

```bash
npm install perfect-freehand
```

or

```bash
yarn add perfect-freehand
```

## Usage

This package's default export is a function that:

- accepts an array of points and an (optional) options object
- returns a stroke as an array of points formatted as `[x, y]`

```js
import getStroke from 'perfect-freehand'
```

You may format your input points as array _or_ an object. In both cases, the value for pressure is optional (it will default to `.5`).

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

| Property           | Type     | Default | Description                                           |
| ------------------ | -------- | ------- | ----------------------------------------------------- |
| `size`             | number   | 8       | The base size (diameter) of the stroke.               |
| `thinning`         | number   | .5      | The effect of pressure on the stroke's size.          |
| `smoothing`        | number   | .5      | How much to soften the stroke's edges.                |
| `streamline`       | number   | .5      | How much to streamline the stroke.                    |
| `simulatePressure` | boolean  | true    | Whether to simulate pressure based on velocity.       |
| `easing`           | function | t => t  | An easing function to apply to each point's pressure. |
| `start`            | function | t => t  | Tapering options for the start of the line.           |
| `end`              | { }      |         | Tapering options for the end of the line.             |
| `last`             | boolean  | false   | Whether the stroke is complete.                       |

The `start` and `end` options accept an object:

| Property | Type     | Default | Description                                 |
| -------- | -------- | ------- | ------------------------------------------- |
| `taper`  | boolean  | 0       | The distance to taper.                      |
| `easing` | function | t =>    | An easing function for the tapering effect. |

When `taper` is zero for either start or end, the library will add a rounded cap at that end of the line.

```js
getStroke(myPoints, {
  size: 8,
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
  easing: t => t * t * t,
  simulatePressure: true,
  last: true,
  start: {
    taper: 20,
    easing: t => t * t * t,
  },
  end: {
    taper: 20,
    easing: t => t * t * t,
  },
})
```

> **Tip:** To create a stroke with a steady line, set the `thinning` option to `0`.

> **Tip:** To create a stroke that gets thinner with pressure instead of thicker, use a negative number for the `thinning` option.

### Rendering

While `getStroke` returns an array of points representing a stroke, it's up to you to decide how you will render the stroke. The library does not export any rendering solutions.

For example, the function below will turn a stroke into SVG path data for use with either [SVG paths](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d) or HTML Canvas (using the [`Path2D` constructor](https://developer.mozilla.org/en-US/docs/Web/API/Path2D/Path2D#using_svg_paths)).

```js
// Create SVG path data using the points from perfect-freehand.
function getSvgPathFromStroke(points) {
  const d = []

  if (stroke.length < 3) {
    return ''
  }

  let p0 = stroke[stroke.length - 3]
  let p1 = stroke[stroke.length - 2]

  d.push('M', p0[0], p0[1], 'Q')

  for (let i = 0; i < stroke.length; i++) {
    d.push(p0[0], p0[1], (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2)
    p0 = p1
    p1 = stroke[i]
  }

  d.push('Z')

  return d.join(' ')
}
```

To render a stroke as a flat polygon, add the [`polygon-clipping`](https://github.com/mfogel/polygon-clipping) package and use the following function together with the `getSvgPathFromStroke`.

```js
import polygonClipping from 'polygon-clipping'

function getFlatSvgPathFromStroke(stroke) {
  const poly = polygonClipping.union([stroke])

  const d = []

  for (let face of poly) {
    for (let points of face) {
      d.push(getSvgPathFromStroke(points))
    }
  }

  return d.join(' ')
}
```

> **Tip:** For implementations in Typescript, see the example project included in this repository.

### Example

```jsx
import * as React from 'react'
import getStroke from 'perfect-freehand'
import { getSvgPathFromStroke } from './utils'

export default function Example() {
  const [currentMark, setCurrentMark] = React.useState()

  function handlePointerDown(e) {
    e.preventDefault()
    setCurrentMark({
      type: e.pointerType,
      points: [[e.pageX, e.pageY, e.pressure]],
    })
  }

  function handlePointerMove(e) {
    e.preventDefault()
    if (e.buttons === 1) {
      setCurrentMark({
        ...currentMark,
        points: [...currentMark.points, [e.pageX, e.pageY, e.pressure]],
      })
    }
  }

  return (
    <svg
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      style={{ touchAction: 'none' }}
    >
      {currentMark && (
        <path
          d={getSvgPathFromStroke(
            getStroke(currentMark.points, {
              size: 24,
              thinning: 0.75,
              smoothing: 0.5,
              streamline: 0.5,
              simulatePressure: currentMark.type !== 'pen',
            })
          )}
        />
      )}
    </svg>
  )
}
```

[![Edit perfect-freehand-example](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/perfect-freehand-example-biwyi?fontsize=14&hidenavigation=1&theme=dark)

### Advanced Usage

#### `StrokeOptions`

A TypeScript type for the options object.

```ts
import { StrokeOptions } from 'perfect-freehand'
```

For advanced usage, the library also exports smaller functions that `getStroke` uses to generate its SVG data. While you can use `getStroke`'s data to render strokes with an HTML canvas (via the Path2D element) or with SVG paths, these new functions will allow you to create paths in other rendering technologies.

#### `getStrokePoints`

```js
const strokePoints = getStrokePoints(rawInputPoints)
```

Accepts an array of points (formatted either as `[x, y, pressure]` or `{ x: number, y: number, pressure: number}`) and a streamline value. Returns a set of streamlined points as `[x, y, pressure, angle, distance, lengthAtPoint]`. The path's total length will be the length of the last point in the array.

#### `getStrokeOutlinePoints`

Accepts an array of points (formatted as `[x, y, pressure, angle, distance, length]`, i.e. the output of `getStrokePoints`) and returns an array of points (`[x, y]`) defining the outline of a pressure-sensitive stroke.

```js
const outlinePoints = getOutlinePoints(strokePoints)
```

## Support

Please [open an issue](https://github.com/steveruizok/perfect-freehand/issues/new) for support.

## Discussion

Have an idea or casual question? Visit the [discussion page](https://github.com/steveruizok/perfect-freehand/discussions).

## Author

- [@steveruizok](https://twitter.com/steveruizok)
