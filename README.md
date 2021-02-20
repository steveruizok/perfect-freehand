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

The library exports a default function, `getPath`, that accepts an array of points and an (optional) options object and returns SVG path data for a stroke.

The array of points may be _either_ an array of number pairs representing the point's x, y, and (optionally) pressure...

```js
import getPath from 'perfect-freehand'

const path = getPath([
  [0, 0],
  [10, 5],
  [20, 8],
])

const path = getPath([
  [0, 0, 0],
  [10, 5, 0.5],
  [20, 8, 0.3],
])
```

...or an array of objects with `x`, `y`, and (optionally) `pressure` properties.

```
getPath([
  { x: 0, y: 0 },
  { x: 10, y: 5 },
  { x: 20, y: 8 },
])

getPath([
  { x: 0, y: 0, pressure: 0, },
  { x: 10, y: 5, pressure: 0.5 },
  { x: 20, y: 8, pressure: 0.3 },
])
```

### Options

The options object is optional, as are its properties.

| Property           | Type    | Default | Description                                                           |
| ------------------ | ------- | ------- | --------------------------------------------------------------------- |
| `minSize`          | number  | 2.5     | The thinnest size of the stroke.                                      |
| `maxSize`          | number  | 8       | The thickest size of the stroke.                                      |
| `simulatePressure` | boolean | true    | Whether to interpret velocity as pressure for mouse and touch inputs. |
| `streamline`       | number  | .5      | How much to streamline the stroke.                                    |
| `smooth`           | number  | .5      | How much to soften the stroke's edges.                                |

```js
getPath(myPoints, {
  type: 'pen',
  minSize: 2.5,
  maxSize: 8,
  simulatePressure: true,
  streamline: 0.5,
  smooth: 0.5,
})
```

## Example

```jsx
import * as React from 'react'
import getPath from 'perfect-freehand'

export default function Example() {
  const [currentType, setCurrentType] = React.useState('mouse')
  const [currentMark, setCurrentMark] = React.useState([])

  function handlePointerDown(e) {
    setCurrentType(e.pointerType)
    setCurrentMark([[e.pageX, e.pageY, e.pressure]])
  }

  function handlePointerMove(e) {
    if (e.buttons === 1 && e.pointerType === currentType) {
      setCurrentMark([...currentMark, [e.pageX, e.pageY, e.pressure]])
    }
  }

  return (
    <svg
      width={800}
      height={600}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    >
      <path d={getPath(currentMark, { type: currentType })} />
    </svg>
  )
}
```

[![Edit perfect-freehand-example](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/perfect-freehand-example-biwyi?fontsize=14&hidenavigation=1&theme=dark)

## Advanced Usage

In addition to `getPath`, the library also exports smaller functions that `getPath` uses to generate its SVG data. While you can use `getPath`'s data to render strokes with an HTML canvas (via the Path2D element) or with SVG paths, these new functions will allow you to create paths in other rendering technologies.

#### `getStrokePoints`

Accepts an array of points (formatted either as `[x, y, pressure]` or `{ x: number, y: number, pressure: number}`) and returns a set of streamlined points as `[x, y, pressure, angle, distance, length]`. The path's total length will be the length of the last point in the array.

#### `getStrokeOutlinePoints`

Accepts an array of points (formatted as as `[x, y, pressure, angle, distance, length]`, i.e. the output of `getStrokePoints`) and returns an array of points (`[x, y]`) defining the outline of a pressure-sensitive stroke.

#### `getShortStrokeOutlinePoints`

Works like `getStrokeOutlinePoints`, but designed to work with short paths.

#### `clipPath`

Accepts a series of points (formatted as `[x, y]`, i.e. the output of `getStrokeOutlinePoints` or `getShortStrokeOutlinePoints`) and returns a polygon (a series of faces) from the stroke.
