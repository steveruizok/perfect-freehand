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

The library export one default function, `getPath`, that accepts an array of points and an (optional) options object and returns SVG path data for a stroke.

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

| Property           | Type    | Default | Description                                                                                 |
| ------------------ | ------- | ------- | ------------------------------------------------------------------------------------------- |
| `type`             | string  | 'mouse' | A [pointerType](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/pointerType). |
| `minSize`          | number  | 2.5     | The thinnest size of the stroke.                                                            |
| `maxSize`          | number  | 8       | The thickest size of the stroke.                                                            |
| `simulatePressure` | boolean | true    | Whether to interpret velocity as pressure for mouse and touch inputs.                       |
| `streamline`       | number  | .5      | How much to streamline the stroke.                                                          |
| `smooth`           | number  | .5      | How much to soften the stroke's edges.                                                      |

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
import * as React from "react"
import getPath from "perfect-freehand"

function Example() {
  const [currentType, setCurrentType] = React.useState([])
  const [currentMark, setCurrentMark] = React.useState([])

  function handlePointerDown(e: React.PointerEvent) {
    setCurrentType(e.pointerType)
    setCurrentMark([[e.pageX, e.pageY, e.pressure]])
  }

  function handlePointerMove(e: React.PointerEvent) {
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
    <path d={getPath(currentMark, { type: currentType })}>
    </svg>
  )
}
```
